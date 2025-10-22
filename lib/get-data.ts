// lib/get-data.neon.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!); // URL Neon avec ?sslmode=require

type AvailRow = {
  userId: string;
  dayOfWeek: number; // 0 = Lundi ... 6 = Dimanche (DB)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

type UserRow = {
  id: string;
  role: string | null; // 'student' | 'instructor' | 'admin'
  name: string | null;
};

const JOURS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
]; // 7 jours
const SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]; // créneaux d'1h, 08→19 (représente jusqu'à 20h)

const parseMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map((n) => Number(n));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};
const ceilDiv = (num: number, den: number) => Math.ceil(num / den);
const floorDiv = (num: number, den: number) => Math.floor(num / den);

/**
 * Charge les données de planning **pour une agence donnée** (Agency.id).
 * Retourne aussi `weekStart` (lundi ISO) depuis Agency.last_week_start.
 */
export async function loadPlanningInput(agencyId: string) {
  if (!agencyId) throw new Error('loadPlanningInput: missing agencyId');

  // 0) Récupère le lundi de la semaine (Agency.last_week_start)
  const agencyRows = (await sql`
    SELECT last_week_start
    FROM "Agency"
    WHERE "id" = ${agencyId}
    LIMIT 1
  `) as unknown as Array<{ last_week_start: string | null }>;
  const weekStart = agencyRows?.[0]?.last_week_start;
  if (!weekStart) {
    throw new Error(
      `Agency ${agencyId} missing last_week_start (doit être un lundi, au format YYYY-MM-DD)`
    );
  }

  // 1) Utilisateurs de l’agence
  const users = (await sql`
    SELECT "id", "role", "name"
    FROM "User"
    WHERE "agencyId" = ${agencyId}
  `) as unknown as UserRow[];

  const students = users.filter((u) => u.role === 'student');
  const instructors = users.filter((u) => u.role === 'instructor');

  const eleves = students.map((s) => s.id);
  const moniteurs = instructors.map((i) => i.id);

  const names: Record<string, string> = Object.fromEntries(
    users.map((u) => [u.id, u.name ?? u.id])
  );

  const studentIds = new Set(eleves);
  const instructorIds = new Set(moniteurs);

  // 2) Dispos des users de l’agence (toute la semaine)
  const avail = (await sql`
    SELECT a."userId"     AS "userId",
           a."dayOfWeek"  AS "dayOfWeek",
           a."startTime"  AS "startTime",
           a."endTime"    AS "endTime"
    FROM "Availability" a
    JOIN "User" u ON u."id" = a."userId"
    WHERE u."agencyId" = ${agencyId}
      AND a."dayOfWeek" BETWEEN 0 AND 6
    ORDER BY a."dayOfWeek", a."startTime"
  `) as unknown as AvailRow[];

  // 3) Conversion → solveur (heures entières, par heure)
  const dispo_moniteurs: Array<{
    id: string;
    day: number;
    start: number;
    end: number;
  }> = [];
  const slots_eleves: Array<{ id: string; day: number; hour: number }> = [];

  for (const r of avail) {
    const day = r.dayOfWeek; // 0..6 (0=Lundi)
    if (day < 0 || day > 6) continue;

    const sMin = parseMin(r.startTime); // minutes depuis 00:00
    const eMin = parseMin(r.endTime);

    // borne à la fenêtre couverte par nos SLOTS (8h..20h)
    const windowStartMin = SLOTS[0] * 60; // 08:00
    const windowEndMin = (SLOTS[SLOTS.length - 1] + 1) * 60; // 20:00
    const sClamped = Math.max(sMin, windowStartMin);
    const eClamped = Math.min(eMin, windowEndMin);
    if (eClamped <= sClamped) continue;

    // projection en heures entières pour créneaux d'1h
    // [startHour, endHour) (ex : 08:30–10:15 => 9..10)
    const startHour = ceilDiv(sClamped, 60);
    const endHour = floorDiv(eClamped, 60);
    if (endHour <= startHour) continue;

    if (instructorIds.has(r.userId)) {
      // Moniteur: intervalle continu
      dispo_moniteurs.push({
        id: r.userId,
        day,
        start: startHour,
        end: endHour,
      });
    } else if (studentIds.has(r.userId)) {
      // Élève: on éclate en créneaux unitaires
      for (let h = startHour; h < endHour; h++) {
        if (SLOTS.includes(h)) {
          slots_eleves.push({ id: r.userId, day, hour: h });
        }
      }
    }
  }

  // 4) Limites (défaut)
  const limites = {
    moniteur_daily: Object.fromEntries(moniteurs.map((m) => [m, 7])),
    moniteur_weekly: Object.fromEntries(moniteurs.map((m) => [m, 35])),
    eleve_weekly: Object.fromEntries(eleves.map((e) => [e, 8])),
    eleve_daily: 2,
  };

  // Logs debug (à couper en prod)
  console.log('[planning][neon] agencyId', agencyId);
  console.log('[planning][neon] weekStart', weekStart);
  console.log('[planning][neon] moniteurs', moniteurs.length);
  console.log('[planning][neon] eleves', eleves.length);
  console.log('[planning][neon] dispo_moniteurs', dispo_moniteurs.length);
  console.log('[planning][neon] slots_eleves', slots_eleves.length);

  return {
    weekStart, // ← utilisé par le solveur pour InstructorWeekDay
    agencyId,
    jours: JOURS, // 7 jours, 0=Lundi..6=Dimanche
    creneaux: SLOTS, // heures entières
    moniteurs,
    eleves,
    dispo_moniteurs,
    slots_eleves,
    limites,
    names,
  };
}

// lib/get-data.neon.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!); // URL Neon avec ?sslmode=require

type AvailRow = {
  userId: string;
  dayOfWeek: number; // 0=dimanche ... 6=samedi (ou 0..4 si tu limites semaine)
  startTime: string; // "08:00"
  endTime: string; // "10:00"
};

type UserRow = {
  id: string;
  role: string | null; // 'student' | 'instructor' | 'admin'
  name: string | null;
};

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const SLOTS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const H = (hhmm: string) => Number(hhmm.split(':')[0]);
const expand = (s: number, e: number) =>
  Array.from({ length: Math.max(0, e - s) }, (_, i) => s + i);

/**
 * Charge les données de planning **pour une agence donnée** (Agency.id).
 */
export async function loadPlanningInput(agencyId: string) {
  if (!agencyId) throw new Error('loadPlanningInput: missing agencyId');

  // 1) Utilisateurs de l’agence
  const users = (await sql`
    SELECT "id", "role", "name"
    FROM "User"
    WHERE "agencyId" = ${agencyId}
  `) as unknown as UserRow[];

  const students = users.filter(
    (u) => u.role === 'student' || u.id.startsWith('student-')
  );
  const instructors = users.filter(
    (u) => u.role === 'instructor' || u.id.startsWith('instructor-')
  );

  const eleves = students.map((s) => s.id);
  const moniteurs = instructors.map((i) => i.id);

  const studentIds = new Set(eleves);
  const instructorIds = new Set(moniteurs);

  // 2) Dispos uniquement des users de l’agence (via JOIN pour éviter un IN énorme)
  const avail = (await sql`
    SELECT a."userId"     AS "userId",
           a."dayOfWeek"  AS "dayOfWeek",
           a."startTime"  AS "startTime",
           a."endTime"    AS "endTime"
    FROM "Availability" a
    JOIN "User" u ON u."id" = a."userId"
    WHERE u."agencyId" = ${agencyId}
      AND a."dayOfWeek" BETWEEN 0 AND 4   -- limite Lundi..Vendredi (adapte si besoin)
    ORDER BY a."dayOfWeek", a."startTime"
  `) as unknown as AvailRow[];

  // 3) Conversion en structures attendues par le solveur
  const dispo_moniteurs: Array<{
    id: string;
    day: number;
    start: number;
    end: number;
  }> = [];
  const slots_eleves: Array<{ id: string; day: number; hour: number }> = [];

  for (const r of avail) {
    // ton ancien mapping: Dimanche(0)→6, Lundi(1)→0, etc.
    const day = (r.dayOfWeek + 6) % 7; // 0..6
    if (day < 0 || day >= JOURS.length) continue; // on ne garde que Lundi..Vendredi

    const s0 = H(r.startTime);
    const e0 = H(r.endTime);
    const start = Math.max(s0, SLOTS[0]);
    const end = Math.min(e0, SLOTS[SLOTS.length - 1] + 1);
    if (end <= start) continue;

    if (instructorIds.has(r.userId)) {
      // Moniteurs: intervalles [start, end)
      dispo_moniteurs.push({ id: r.userId, day, start, end });
    } else if (studentIds.has(r.userId)) {
      // Élèves: créneaux unitaires
      for (const h of expand(start, end)) {
        if (SLOTS.includes(h)) {
          slots_eleves.push({ id: r.userId, day, hour: h });
        }
      }
    }
  }

  // 4) Limites (par défaut; remplace par tes valeurs si tu les stockes en BDD)
  const limites = {
    moniteur_daily: Object.fromEntries(moniteurs.map((m) => [m, 7])),
    moniteur_weekly: Object.fromEntries(moniteurs.map((m) => [m, 35])),
    eleve_weekly: Object.fromEntries(eleves.map((e) => [e, 8])),
    eleve_daily: 2,
  };

  // Logs utiles (désactive en prod)
  console.log('[planning][neon] agencyId', agencyId);
  console.log('[planning][neon] moniteurs', moniteurs.length);
  console.log('[planning][neon] eleves', eleves.length);
  console.log('[planning][neon] dispo_moniteurs', dispo_moniteurs.length);
  console.log('[planning][neon] slots_eleves', slots_eleves.length);

  return {
    jours: JOURS,
    creneaux: SLOTS,
    moniteurs,
    eleves,
    dispo_moniteurs,
    slots_eleves,
    limites,
  };
}

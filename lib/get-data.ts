// lib/get-data.neon.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!); // URL Neon, avec ?sslmode=require

type AvailRow = {
  userId: string;
  dayOfWeek: number;
  startTime: string; // "08:00"
  endTime: string; // "10:00"
};

type UserRow = {
  id: string;
  role: string | null;
  name: string | null;
};

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const SLOTS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const H = (hhmm: string) => Number(hhmm.split(':')[0]);
const expand = (s: number, e: number) =>
  Array.from({ length: Math.max(0, e - s) }, (_, i) => s + i);

export async function loadPlanningInput() {
  // ⚠️ Utiliser les noms QUOTÉS "Availability" / "User" et colonnes CamelCase QUOTÉES
  const avail = (await sql`
  SELECT "userId"     AS "userId",
         "dayOfWeek"  AS "dayOfWeek",
         "startTime"  AS "startTime",
         "endTime"    AS "endTime"
  FROM "Availability"
  WHERE "dayOfWeek" BETWEEN 0 AND 4
  ORDER BY "dayOfWeek", "startTime"
`) as unknown as AvailRow[];

  const users = (await sql`
  SELECT "id", "role", "name"
  FROM "User"
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

  const dispo_moniteurs: Array<{
    id: string;
    day: number;
    start: number;
    end: number;
  }> = [];
  const slots_eleves: Array<{ id: string; day: number; hour: number }> = [];

  for (const r of avail) {
    const day = (r.dayOfWeek + 6) % 7; // Dimanche(0)->6, Lundi(1)->0
    if (day < 0 || day >= JOURS.length) continue;

    const s0 = H(r.startTime),
      e0 = H(r.endTime);
    const start = Math.max(s0, SLOTS[0]);
    const end = Math.min(e0, SLOTS[SLOTS.length - 1] + 1);
    if (end <= start) continue;

    if (instructorIds.has(r.userId)) {
      // Moniteurs: intervalles [start, end)
      dispo_moniteurs.push({ id: r.userId, day, start, end });
    } else if (studentIds.has(r.userId)) {
      // Élèves: unités d'1h
      for (const h of expand(start, end))
        if (SLOTS.includes(h)) {
          slots_eleves.push({ id: r.userId, day, hour: h });
        }
    }
  }

  const limites = {
    moniteur_daily: Object.fromEntries(moniteurs.map((m) => [m, 7])),
    moniteur_weekly: Object.fromEntries(moniteurs.map((m) => [m, 35])),
    eleve_weekly: Object.fromEntries(eleves.map((e) => [e, 8])),
    eleve_daily: 2,
  };

  console.log('[planning][neon] moniteurs', moniteurs);
  console.log('[planning][neon] eleves', eleves);
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

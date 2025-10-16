// lib/scheduler.ts
import { loadPlanningInput } from './get-data';

export type Match = {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
};

export type ScheduleResult = {
  matches: Match[];
  unmatchedStudents: Array<{ id: string; name: string }>;
  stats: {
    totalStudents: number;
    matchedStudents: number;
    totalInstructors: number;
    totalMatches: number;
  };
};

const PY_SERVICE_URL =
  process.env.PY_SERVICE_URL || 'http://localhost:8000/solve';
const PY_SERVICE_KEY = process.env.PY_SERVICE_KEY || ''; // ← même valeur que API_KEY côté solver
const FETCH_TIMEOUT_MS = Number(process.env.SOLVER_TIMEOUT_MS || 25000);

/** Appelle le microservice FastAPI avec le payload de l’agence. */
export async function runPythonScheduler(
  agencyId: string
): Promise<ScheduleResult> {
  if (!agencyId) throw new Error('runPythonScheduler: missing agencyId');

  const input = await loadPlanningInput(agencyId);

  // Timeout propre via AbortController
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  };
  if (PY_SERVICE_KEY) headers['x-api-key'] = PY_SERVICE_KEY;

  try {
    const res = await fetch(PY_SERVICE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: controller.signal,
      // Evite le cache côté Next/Node pour ce type d’appel
      cache: 'no-store',
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Solver HTTP ${res.status} ${res.statusText} — ${txt}`);
    }

    const data = (await res.json()) as ScheduleResult;
    return data;
  } catch (err: any) {
    // Message clair en cas d’abandon (timeout)
    if (err?.name === 'AbortError') {
      throw new Error(`Solver timeout after ${FETCH_TIMEOUT_MS} ms`);
    }
    throw err;
  } finally {
    clearTimeout(to);
  }
}

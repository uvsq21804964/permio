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
const PY_SERVICE_KEY = process.env.PY_SERVICE_KEY || '';
const FETCH_TIMEOUT_MS = Number(process.env.SOLVER_TIMEOUT_MS || 25000);

export async function runPythonScheduler(
  agencyId: string
): Promise<ScheduleResult> {
  if (!agencyId) throw new Error('runPythonScheduler: missing agencyId');

  const input = await loadPlanningInput(agencyId);

  // ✅ on extrait les noms et on n’envoie pas ce champ au solver
  const { names, ...payloadForSolver } = input as any;
  const nameById: Record<string, string> = names ?? {};

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
      body: JSON.stringify(payloadForSolver),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Solver HTTP ${res.status} ${res.statusText} — ${txt}`);
    }

    const data = (await res.json()) as ScheduleResult;

    // ✅ ENRICHISSEMENT : remplace les IDs par les noms pour le front
    const withNames: ScheduleResult = {
      ...data,
      matches: (data.matches || []).map((m) => ({
        ...m,
        studentName: nameById[m.studentId] ?? m.studentName ?? m.studentId,
        instructorName:
          nameById[m.instructorId] ?? m.instructorName ?? m.instructorId,
      })),
      unmatchedStudents: (data.unmatchedStudents || []).map((s) => ({
        ...s,
        name: nameById[s.id] ?? s.name ?? s.id,
      })),
    };

    return withNames;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Solver timeout after ${FETCH_TIMEOUT_MS} ms`);
    }
    throw err;
  } finally {
    clearTimeout(to);
  }
}

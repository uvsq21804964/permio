// lib/scheduler.ts (NOUVELLE VERSION)
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
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

const PY_CODE = String.raw`
import sys, json
import pulp

# Usage: python script.py /path/to/input.json

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

jours = data["jours"]                 # ["Lundi",...]
creneaux = data["creneaux"]           # [7..18]
moniteurs = data["moniteurs"]
eleves = data["eleves"]

# D_M à partir d'intervalles [start,end) par moniteur/jour
D_M = {}
for m in moniteurs:
    for j in range(len(jours)):
        for t in creneaux:
            D_M[(m, j, t)] = 0
for it in data["dispo_moniteurs"]:
    mid, day, s, e = it["id"], it["day"], it["start"], it["end"]
    for t in creneaux:
        if s <= t < e:
            D_M[(mid, day, t)] = 1

# D_E depuis slots unitaires
D_E = {}
for e in eleves:
    for j in range(len(jours)):
        for t in creneaux:
            D_E[(e, j, t)] = 0
for it in data["slots_eleves"]:
    sid, day, h = it["id"], it["day"], it["hour"]
    if h in creneaux:
        D_E[(sid, day, h)] = 1

h_M_jour = None  # peut varier par moniteur, on le gère contrainte par moniteur
h_M_total = data["limites"]["moniteur_weekly"]
h_E_total = data["limites"]["eleve_weekly"]
max_creneaux_jour_eleve = data["limites"]["eleve_daily"]
moniteur_daily = data["limites"]["moniteur_daily"]

model = pulp.LpProblem("Planning_DB", pulp.LpMaximize)
# On adresse les jours par index 0..len(jours)-1 pour simplifier
x = pulp.LpVariable.dicts("x", (moniteurs, eleves, range(len(jours)), creneaux), 0, 1, pulp.LpBinary)

# Objectif
model += pulp.lpSum(x[m][e][d][t] for m in moniteurs for e in eleves for d in range(len(jours)) for t in creneaux)

# Disponibilités
for m in moniteurs:
  for e in eleves:
    for d in range(len(jours)):
      for t in creneaux:
        model += x[m][e][d][t] <= D_M[(m, d, t)]
        model += x[m][e][d][t] <= D_E[(e, d, t)]

# Un seul élève par moniteur/slot
for m in moniteurs:
  for d in range(len(jours)):
    for t in creneaux:
      model += pulp.lpSum(x[m][e][d][t] for e in eleves) <= 1

# Un seul moniteur par élève/slot
for e in eleves:
  for d in range(len(jours)):
    for t in creneaux:
      model += pulp.lpSum(x[m][e][d][t] for m in moniteurs) <= 1

# Limite journalière par moniteur (moniteur_daily[m])
for m in moniteurs:
  for d in range(len(jours)):
    model += pulp.lpSum(x[m][e][d][t] for e in eleves for t in creneaux) <= moniteur_daily.get(m, 7)

# Limite hebdo moniteurs
for m in moniteurs:
  model += pulp.lpSum(x[m][e][d][t] for e in eleves for d in range(len(jours)) for t in creneaux) <= h_M_total.get(m, 35)

# Limite hebdo élèves
for e in eleves:
  model += pulp.lpSum(x[m][e][d][t] for m in moniteurs for d in range(len(jours)) for t in creneaux) <= h_E_total.get(e, 8)

# Max slots/jour/élève
for e in eleves:
  for d in range(len(jours)):
    model += pulp.lpSum(x[m][e][d][t] for m in moniteurs for t in creneaux) <= max_creneaux_jour_eleve

solver = pulp.PULP_CBC_CMD(msg=False)
model.solve(solver)

jours_index = {j: i for i, j in enumerate(jours)}
results = []
assign_by_student = {e: 0 for e in eleves}

for m in moniteurs:
  for e in eleves:
    for d in range(len(jours)):
      for t in creneaux:
        val = x[m][e][d][t].value()
        if val is not None and int(val) == 1:
          assign_by_student[e] += 1
          results.append({
            "studentId": e,
            "studentName": e,
            "instructorId": m,
            "instructorName": m,
            "dayOfWeek": d,
            "startTime": f"{t:02d}:00",
            "endTime": f"{t+1:02d}:00",
            "duration": 60
          })

unmatched = [{"id": e, "name": e} for e, c in assign_by_student.items() if c == 0]

payload = {
  "matches": results,
  "unmatchedStudents": unmatched,
  "stats": {
    "totalStudents": len(eleves),
    "matchedStudents": sum(1 for c in assign_by_student.values() if c > 0),
    "totalInstructors": len(moniteurs),
    "totalMatches": len(results)
  }
}

print(json.dumps(payload, ensure_ascii=False))
`;

function execFileAsync(
  file: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  const { promisify } = require('util');
  const execFileCb = promisify(execFile);
  return execFileCb(file, args, { windowsHide: true });
}

export async function runPythonScheduler(): Promise<ScheduleResult> {
  // 1) Charger les données depuis Neon
  const input = await loadPlanningInput();

  console.log('input', input);

  // 2) Écrire le JSON et le script Python dans des fichiers temporaires
  const tmpDir = os.tmpdir();
  const base = Date.now();
  const jsonPath = path.join(tmpDir, `planning_${base}.json`);
  const scriptPath = path.join(tmpDir, `scheduler_${base}.py`);

  await Promise.all([
    fs.writeFile(jsonPath, JSON.stringify(input), { encoding: 'utf8' }),
    fs.writeFile(scriptPath, PY_CODE, { encoding: 'utf8' }),
  ]);

  // 3) Essayer python3 puis python
  const bins = [process.env.PYTHON_PATH, 'python3', 'python'].filter(
    Boolean
  ) as string[];
  let out: { stdout: string; stderr: string } | null = null;
  let lastErr: any;
  for (const bin of bins) {
    try {
      out = await execFileAsync(bin, [scriptPath, jsonPath]);
      break;
    } catch (e) {
      lastErr = e;
    }
  }

  // 4) Nettoyage best-effort
  try {
    await fs.unlink(jsonPath);
  } catch {}
  try {
    await fs.unlink(scriptPath);
  } catch {}

  if (!out) throw new Error(`Impossible d’exécuter Python: ${String(lastErr)}`);

  const text = out.stdout?.toString().trim();
  if (!text) throw new Error('Sortie vide du solveur (JSON attendu)');

  let data: ScheduleResult;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Sortie non-JSON:
${text}

Erreur: ${String(e)}`);
  }

  return data;
}

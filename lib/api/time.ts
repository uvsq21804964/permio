// src/lib/api/time.ts

/**
 * Convertit "HH:mm" -> minutes depuis minuit.
 * Implémentation strictement identique à celle utilisée dans les routes.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Vérifie si deux intervalles [start1, end1] et [start2, end2]
 * se chevauchent ou sont adjacents (ex: 09:00–10:00 et 10:00–11:00).
 * Implémentation identique à celle des routes /availabilities*.
 */
export function doRangesOverlapOrAdjacent(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // chevauchement ou juste collés (ex: 09:00–10:00 et 10:00–11:00)
  return start1Min <= end2Min && start2Min <= end1Min;
}

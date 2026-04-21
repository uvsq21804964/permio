// lib/schedule-utils.ts
import type { Match } from '@/types/schedule';

function sortMatches(a: Match, b: Match) {
  if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
  return a.startTime.localeCompare(b.startTime);
}

export function groupByDay(items: Match[]) {
  const byDay = new Map<number, Match[]>();
  for (const it of items) {
    if (!byDay.has(it.dayOfWeek)) byDay.set(it.dayOfWeek, []);
    byDay.get(it.dayOfWeek)!.push(it);
  }
  return Array.from(byDay.entries()).sort((a, b) => a[0] - b[0]);
}

export function groupMatches<
  K extends 'studentId' | 'instructorId',
  N extends 'studentName' | 'instructorName'
>(matches: Match[], key: K, nameKey: N) {
  const map = new Map<string, { name: string; items: Match[] }>();
  for (const m of matches) {
    const id = m[key] as string;
    const name = (m[nameKey] as string) || id;
    if (!map.has(id)) map.set(id, { name, items: [] });
    map.get(id)!.items.push(m);
  }
  for (const v of map.values()) v.items.sort(sortMatches);
  return map;
}

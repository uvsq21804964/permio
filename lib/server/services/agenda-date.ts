export function isoToDateOnly(iso: string): Date {
  const base = iso.slice(0, 10);
  const [yStr, mStr, dStr] = base.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfWeekMondayISO(base?: string): string {
  const date = base ? isoToDateOnly(base) : new Date();
  const dow = date.getDay();
  const isoDow = dow === 0 ? 7 : dow;
  date.setDate(date.getDate() - (isoDow - 1));
  date.setHours(0, 0, 0, 0);
  return dateToISO(date);
}

export function addDaysISO(iso: string, delta: number): string {
  const date = isoToDateOnly(iso);
  date.setDate(date.getDate() + delta);
  return dateToISO(date);
}

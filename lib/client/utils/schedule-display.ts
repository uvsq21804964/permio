type TimelineLayoutOptions = {
  startHour: number;
  pixelsPerHour: number;
  stripSeconds?: boolean;
};

export function stripSeconds(value: string): string {
  const parts = value.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return value;
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = stripSeconds(value).split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function getTimelineBlockStyle(
  startTime: string,
  endTime: string,
  { startHour, pixelsPerHour }: TimelineLayoutOptions
) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const offsetMinutes = startMinutes - startHour * 60;
  const durationMinutes = Math.max(0, endMinutes - startMinutes);

  return {
    top: (offsetMinutes / 60) * pixelsPerHour,
    height: (durationMinutes / 60) * pixelsPerHour,
  };
}

export function hashStringToIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % modulo;
}

export function getStablePaletteClass(
  key: string,
  palette: readonly string[]
): string {
  return palette[hashStringToIndex(key, palette.length)];
}

export function parseISODateLocal(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

export function toISODateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMondayOfWeek(date: Date): Date {
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const day = localDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  localDate.setDate(localDate.getDate() + diff);
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

export function addDaysToISO(iso: string, delta: number): string {
  const date = parseISODateLocal(iso);
  date.setDate(date.getDate() + delta);
  return toISODateLocal(date);
}

export function isFrenchLocale(locale: string): boolean {
  return locale === 'fr' || locale.startsWith('fr');
}

export function formatShortDate(date: Date, locale: string): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return isFrenchLocale(locale) ? `${day}/${month}` : `${month}/${day}`;
}

export function formatTimeForLocale(value: string, locale: string): string {
  const [hours, minutes] = stripSeconds(value).split(':').map(Number);
  const date = new Date(2000, 0, 1, hours || 0, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat(isFrenchLocale(locale) ? 'fr-FR' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !isFrenchLocale(locale),
  }).format(date);
}

export function formatHourLabel(hour: number, locale: string): string {
  if (isFrenchLocale(locale)) {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  const date = new Date(2000, 0, 1, hour, 0, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
  }).format(date);
}

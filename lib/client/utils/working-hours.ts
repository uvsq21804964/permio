export const DEFAULT_WORKDAY_START_HOUR = 8;
export const DEFAULT_WORKDAY_END_HOUR = 18;

export function isOutsideDefaultWorkingHours(hour: number) {
  return hour < DEFAULT_WORKDAY_START_HOUR || hour >= DEFAULT_WORKDAY_END_HOUR;
}

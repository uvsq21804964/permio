export type TimedSlot = {
  startTime: string;
  endTime: string;
};

export function sortTimedSlots<T extends TimedSlot>(slots: T[]): T[] {
  return [...slots].sort((left, right) =>
    left.startTime.localeCompare(right.startTime),
  );
}

export function mergeTimedSlotsByKey<T extends TimedSlot>(
  slots: T[],
  getKey: (slot: T) => string,
): T[] {
  if (!slots.length) return [];

  const groups = new Map<string, T[]>();
  for (const slot of slots) {
    const key = getKey(slot).trim();
    const existing = groups.get(key) ?? [];
    existing.push(slot);
    groups.set(key, existing);
  }

  const merged: T[] = [];

  for (const groupedSlots of groups.values()) {
    const sorted = sortTimedSlots(groupedSlots);
    let current: T | null = null;

    for (const slot of sorted) {
      if (!current) {
        current = { ...slot };
        continue;
      }

      if (slot.startTime <= current.endTime) {
        if (slot.endTime > current.endTime) current.endTime = slot.endTime;
        continue;
      }

      merged.push(current);
      current = { ...slot };
    }

    if (current) merged.push(current);
  }

  return sortTimedSlots(merged);
}

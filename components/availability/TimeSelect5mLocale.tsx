'use client';

import { useEffect, useMemo } from 'react';

import {
  clamp,
  isFrLocale,
  minutesToParts,
  minutesToTime,
  nearestAllowed,
  pad2,
  partsToMinutes,
  timeToMinutes,
} from '@/lib/client/utils/availability-time';

type Props = {
  id: string;
  locale: string;
  value: string;
  onChange: (next: string) => void;
  minMinutes: number;
  maxMinutes: number;
  stepMinutes: number;
};

export function TimeSelect5mLocale({
  id,
  locale,
  value,
  onChange,
  minMinutes,
  maxMinutes,
  stepMinutes,
}: Props) {
  const allowed = useMemo(() => {
    const values: number[] = [];
    for (let minute = minMinutes; minute <= maxMinutes; minute += stepMinutes) {
      values.push(minute);
    }
    return values;
  }, [minMinutes, maxMinutes, stepMinutes]);

  const safeValue = nearestAllowed(
    clamp(timeToMinutes(value), minMinutes, maxMinutes),
    allowed,
  );
  const { hh24, mm, hh12, ampm } = minutesToParts(safeValue);

  if (isFrLocale(locale)) {
    const hourOptions = useMemo(() => {
      const minHour = Math.floor(minMinutes / 60);
      const maxHour = Math.floor(maxMinutes / 60);
      const values: number[] = [];

      for (let hour = minHour; hour <= maxHour; hour += 1) {
        values.push(hour);
      }

      return values;
    }, [minMinutes, maxMinutes]);

    const minuteOptions = useMemo(() => {
      const values = allowed
        .filter((minute) => Math.floor(minute / 60) === hh24)
        .map((minute) => minute % 60);

      return Array.from(new Set(values)).sort((left, right) => left - right);
    }, [allowed, hh24]);

    useEffect(() => {
      if (!minuteOptions.includes(mm)) {
        const fallbackMinute = minuteOptions[0] ?? 0;
        const nextValue = nearestAllowed(hh24 * 60 + fallbackMinute, allowed);
        onChange(minutesToTime(nextValue));
      }
    }, [allowed, hh24, minuteOptions, mm, onChange]);

    return (
      <div className="grid grid-cols-2 gap-2">
        <select
          id={`${id}-hour`}
          value={hh24}
          onChange={(event) => {
            const nextValue = nearestAllowed(
              clamp(
                Number(event.target.value) * 60 + mm,
                minMinutes,
                maxMinutes,
              ),
              allowed,
            );
            onChange(minutesToTime(nextValue));
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          {hourOptions.map((hour) => (
            <option key={hour} value={hour}>
              {pad2(hour)}
            </option>
          ))}
        </select>

        <select
          id={`${id}-min`}
          value={mm}
          onChange={(event) => {
            const nextValue = nearestAllowed(
              clamp(
                hh24 * 60 + Number(event.target.value),
                minMinutes,
                maxMinutes,
              ),
              allowed,
            );
            onChange(minutesToTime(nextValue));
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          {minuteOptions.map((minute) => (
            <option key={minute} value={minute}>
              {pad2(minute)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const ampmOptions = useMemo(() => {
    const values = new Set<'AM' | 'PM'>();
    for (const minute of allowed) {
      values.add(minutesToParts(minute).ampm);
    }
    return Array.from(values);
  }, [allowed]);

  const hour12Options = useMemo(() => {
    const values = new Set<number>();
    for (const minute of allowed) {
      const parts = minutesToParts(minute);
      if (parts.ampm === ampm) {
        values.add(parts.hh12);
      }
    }
    return Array.from(values).sort((left, right) => left - right);
  }, [allowed, ampm]);

  const minuteOptions = useMemo(() => {
    const values = new Set<number>();
    for (const minute of allowed) {
      const parts = minutesToParts(minute);
      if (parts.ampm === ampm && parts.hh12 === hh12) {
        values.add(parts.mm);
      }
    }
    return Array.from(values).sort((left, right) => left - right);
  }, [allowed, ampm, hh12]);

  useEffect(() => {
    const safeAmpm = ampmOptions.includes(ampm) ? ampm : ampmOptions[0] ?? 'AM';
    const safeHour12 = hour12Options.includes(hh12)
      ? hh12
      : hour12Options[0] ?? 12;
    const safeMinute = minuteOptions.includes(mm) ? mm : minuteOptions[0] ?? 0;
    const nextValue = nearestAllowed(
      clamp(
        partsToMinutes(safeHour12, safeMinute, safeAmpm),
        minMinutes,
        maxMinutes,
      ),
      allowed,
    );

    if (nextValue !== safeValue) {
      onChange(minutesToTime(nextValue));
    }
  }, [
    allowed,
    ampm,
    ampmOptions,
    hh12,
    maxMinutes,
    minMinutes,
    minuteOptions,
    mm,
    onChange,
    hour12Options,
    safeValue,
  ]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        id={`${id}-hour12`}
        value={hh12}
        onChange={(event) => {
          const nextValue = nearestAllowed(
            clamp(
              partsToMinutes(Number(event.target.value), mm, ampm),
              minMinutes,
              maxMinutes,
            ),
            allowed,
          );
          onChange(minutesToTime(nextValue));
        }}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        required
      >
        {hour12Options.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>

      <select
        id={`${id}-min`}
        value={mm}
        onChange={(event) => {
          const nextValue = nearestAllowed(
            clamp(
              partsToMinutes(hh12, Number(event.target.value), ampm),
              minMinutes,
              maxMinutes,
            ),
            allowed,
          );
          onChange(minutesToTime(nextValue));
        }}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        required
      >
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>
            {pad2(minute)}
          </option>
        ))}
      </select>

      <select
        id={`${id}-ampm`}
        value={ampm}
        onChange={(event) => {
          const nextValue = nearestAllowed(
            clamp(
              partsToMinutes(hh12, mm, event.target.value as 'AM' | 'PM'),
              minMinutes,
              maxMinutes,
            ),
            allowed,
          );
          onChange(minutesToTime(nextValue));
        }}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        required
      >
        {ampmOptions.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}

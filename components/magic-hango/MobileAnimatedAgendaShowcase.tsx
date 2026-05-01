'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type SlotTone = 'service' | 'travel' | 'recommended' | 'gap';

type MiniSlot = {
  start: string;
  end: string;
  title: string;
  meta: string;
  tone: SlotTone;
  mapsUrl?: string;
};

type MorphSlot = {
  key: string;
  before?: MiniSlot;
  after?: MiniSlot;
};

const AGENDA_START_HOUR = 8;
const AGENDA_END_HOUR = 17;
const AGENDA_DURATION_MINUTES = (AGENDA_END_HOUR - AGENDA_START_HOUR) * 60;
const PIXELS_PER_MINUTE = 1.25;
const AGENDA_HEIGHT_PX = AGENDA_DURATION_MINUTES * PIXELS_PER_MINUTE;

function toAgendaMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours - AGENDA_START_HOUR) * 60 + minutes;
}

function getSlotVisual(slot: MiniSlot) {
  const durationMinutes = toAgendaMinutes(slot.end) - toAgendaMinutes(slot.start);
  const top = toAgendaMinutes(slot.start) * PIXELS_PER_MINUTE;
  const height = durationMinutes * PIXELS_PER_MINUTE;

  return { top, height, durationMinutes };
}

export function MobileAnimatedAgendaShowcase({
  locale,
  beforeTitle,
  beforeSubtitle,
  beforeFooter,
  afterTitle,
  afterSubtitle,
  afterFooter,
  labels,
  slots,
  ui,
}: {
  locale: 'fr' | 'en';
  beforeTitle: string;
  beforeSubtitle: string;
  beforeFooter: string;
  afterTitle: string;
  afterSubtitle: string;
  afterFooter: string;
  labels: Record<SlotTone, string>;
  slots: MorphSlot[];
  ui: {
    beforeState: string;
    afterState: string;
    toBefore: string;
    toAfter: string;
    mapsOpenInMobile: string;
    mapsHint: string;
  };
}) {
  const [optimized, setOptimized] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setOptimized(true);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, []);

  const formatDisplayTime = (value: string) => {
    if (locale === 'fr') {
      return value;
    }

    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;

    return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
  };

  const formatTravelTimeRange = (start: string, end: string) => {
    if (locale === 'fr') {
      return `${start} - ${end}`;
    }

    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    const startSuffix = startHours >= 12 ? 'PM' : 'AM';
    const endSuffix = endHours >= 12 ? 'PM' : 'AM';
    const normalizedStartHours = startHours % 12 || 12;
    const normalizedEndHours = endHours % 12 || 12;

    const startText = `${normalizedStartHours}:${String(startMinutes).padStart(2, '0')}`;
    const endText = `${normalizedEndHours}:${String(endMinutes).padStart(2, '0')}`;

    if (startSuffix === endSuffix) {
      return `${startText} - ${endText} ${startSuffix}`;
    }

    return `${startText} ${startSuffix} - ${endText} ${endSuffix}`;
  };

  const tones = {
    service: 'border-sky-200 bg-sky-50/80 text-slate-900',
    travel: optimized
      ? 'border-dashed border-amber-300 bg-amber-50/88 text-amber-950'
      : 'border-dashed border-rose-300 bg-rose-50/84 text-rose-950',
    gap: optimized
      ? 'border-dashed border-emerald-300 bg-emerald-50/88 text-emerald-950'
      : 'border-dashed border-slate-300 bg-slate-50/92 text-slate-900',
    recommended:
      'border-amber-300 bg-amber-50/95 text-amber-950 shadow-[0_14px_28px_-22px_rgba(217,119,6,0.6)]',
  } as const;

  const badgeTones = {
    service: 'bg-sky-600 text-white',
    travel: optimized ? 'bg-transparent text-amber-700' : 'bg-transparent text-rose-700',
    gap: optimized ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-white',
    recommended: 'bg-amber-500 text-slate-950',
  } as const;

  return (
    <section className="overflow-hidden rounded-[28px] border border-black/8 bg-white/92 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.42)]">
      <div className="border-b border-black/6 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,245,214,0.92))] px-4 py-4">
        <div className="text-lg font-semibold tracking-tight text-slate-950">
          {optimized ? afterTitle : beforeTitle}
        </div>
        <p className="mt-2 text-sm leading-6 text-black/65">
          {optimized ? afterSubtitle : beforeSubtitle}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOptimized(false)}
            className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
              optimized
                ? 'bg-black/5 text-black/45'
                : 'bg-slate-950 text-white shadow-[0_16px_35px_-24px_rgba(15,23,42,0.7)]'
            }`}
          >
            {ui.beforeState}
          </button>
          <button
            type="button"
            onClick={() => setOptimized(true)}
            className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
              optimized
                ? 'bg-amber-500 text-slate-950 shadow-[0_16px_35px_-24px_rgba(217,119,6,0.55)]'
                : 'bg-black/5 text-black/45'
            }`}
          >
            {ui.afterState}
          </button>
        </div>
      </div>

      <div className="px-3 py-4">
        <button
          type="button"
          onClick={() => setOptimized((value) => !value)}
          className="mb-3 inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-slate-950 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_16px_35px_-24px_rgba(15,23,42,0.7)] transition hover:opacity-92"
        >
          {optimized ? ui.toBefore : ui.toAfter}
        </button>

        <div>
          <div
            className="relative overflow-hidden rounded-[24px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]"
            style={{ height: `${AGENDA_HEIGHT_PX}px` }}
          >
            {Array.from(
              { length: AGENDA_END_HOUR - AGENDA_START_HOUR + 1 },
              (_, index) => `${String(AGENDA_START_HOUR + index).padStart(2, '0')}:00`,
            ).map((hour, index, allHours) => {
              const top = (index / (allHours.length - 1)) * 100;

              return (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-dashed border-black/8"
                  style={{ top: `${top}%` }}
                />
              );
            })}

            {slots.map((slot) => {
              const fromSlot = slot.before ?? slot.after;
              const toSlot = slot.after ?? slot.before;

              if (!fromSlot || !toSlot) {
                return null;
              }

              const currentSlot = optimized ? toSlot : fromSlot;
              const currentVisual = getSlotVisual(currentSlot);
              const isUnavailableInCurrentState = optimized ? !slot.after : !slot.before;
              const isHidden = isUnavailableInCurrentState;
              const isTravelSlot = currentSlot.tone === 'travel' && Boolean(currentSlot.mapsUrl);

              return (
                <article
                  key={slot.key}
                  onClick={
                    isTravelSlot
                      ? () => {
                          if (!currentSlot.mapsUrl) return;
                          window.open(currentSlot.mapsUrl, '_blank', 'noopener,noreferrer');
                        }
                      : undefined
                  }
                  onKeyDown={
                    isTravelSlot
                      ? (event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          if (!currentSlot.mapsUrl) return;
                          window.open(currentSlot.mapsUrl, '_blank', 'noopener,noreferrer');
                        }
                      : undefined
                  }
                  role={isTravelSlot ? 'button' : undefined}
                  tabIndex={isTravelSlot ? 0 : undefined}
                  aria-label={isTravelSlot ? `${ui.mapsHint}: ${currentSlot.title}` : undefined}
                  className={`absolute left-2 right-2 overflow-hidden rounded-[18px] border text-left transition-[top,height,opacity,transform,background-color,border-color,color,box-shadow] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${tones[currentSlot.tone]} ${isTravelSlot ? 'cursor-pointer' : ''} ${isHidden ? 'pointer-events-none' : ''}`}
                  style={{
                    top: `${currentVisual.top}px`,
                    height: `${currentVisual.height}px`,
                    opacity: isHidden ? 0 : 1,
                    transform: isHidden ? 'scale(0.96)' : 'scale(1)',
                    padding: currentVisual.durationMinutes <= 20 ? '0.35rem 0.65rem' : '0.55rem 0.75rem',
                  }}
                    >
                      {currentSlot.tone === 'travel' ? (
                        <div className="flex h-full items-center">
                          <div className="grid w-full grid-cols-[92px_88px_minmax(0,1fr)] items-center gap-2">
                            <div className="min-w-0 whitespace-nowrap text-[11px] font-semibold tabular-nums leading-4 text-black/45">
                              <div className="text-[10px] font-medium leading-4 text-black/45">
                                {formatTravelTimeRange(currentSlot.start, currentSlot.end)}
                              </div>
                            </div>

                            <div className="flex items-center justify-center">
                              <span className="text-center text-[10px] font-semibold leading-4 text-amber-800">
                                {currentSlot.title}
                              </span>
                            </div>

                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <div className="min-w-0 truncate text-[10px] leading-4 text-black/58">
                                {currentSlot.meta}
                              </div>
                              {isTravelSlot ? (
                                <div className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                                  {ui.mapsOpenInMobile}
                                  <Image
                                    src="/GoogleMaps.svg"
                                    alt={ui.mapsHint}
                                    width={44}
                                    height={11}
                                    className="h-auto w-[44px]"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid h-full grid-cols-[92px_88px_minmax(0,1fr)] items-center gap-2">
                          <div className="min-w-0 whitespace-nowrap text-[11px] font-semibold tabular-nums leading-4 text-slate-950">
                            {formatDisplayTime(currentSlot.start)}
                            <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-black/45">
                              {formatDisplayTime(currentSlot.end)}
                            </div>
                          </div>

                          <div className="flex justify-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${badgeTones[currentSlot.tone]}`}
                            >
                              {labels[currentSlot.tone]}
                            </span>
                          </div>

                            <div className="flex min-w-0 h-full flex-col items-center justify-center text-center">
                              <div className="w-full truncate text-[11px] font-semibold leading-4 text-slate-950">
                                {currentSlot.title}
                              </div>
                              {currentSlot.meta ? (
                                <div className="w-full truncate text-[10px] leading-4 text-black/58">
                                  {currentSlot.meta}
                                </div>
                              ) : null}
                            </div>
                        </div>
                      )}
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-black/6 px-4 py-4 text-sm leading-6 text-black/68">
        {optimized ? afterFooter : beforeFooter}
      </div>
    </section>
  );
}

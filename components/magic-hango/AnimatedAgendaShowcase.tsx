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
const PIXELS_PER_MINUTE = 1.1;
const AGENDA_HEIGHT_PX = AGENDA_DURATION_MINUTES * PIXELS_PER_MINUTE;

function toAgendaMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours - AGENDA_START_HOUR) * 60 + minutes;
}

function getSlotVisual(slot: MiniSlot) {
  const durationMinutes = toAgendaMinutes(slot.end) - toAgendaMinutes(slot.start);
  const top = toAgendaMinutes(slot.start) * PIXELS_PER_MINUTE;
  const height = durationMinutes * PIXELS_PER_MINUTE;

  return {
    top,
    height,
    durationMinutes,
  };
}

export function AnimatedAgendaShowcase({
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
  details,
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
    eyebrow: string;
    beforeState: string;
    afterState: string;
    toBefore: string;
    toAfter: string;
    whyLabel: string;
    impactLabel: string;
    mapsOpenInDesktop: string;
    mapsHint: string;
  };
  details: {
    before: string[];
    after: string[];
  };
}) {
  const [optimized, setOptimized] = useState(false);
  const [showLateAdditions, setShowLateAdditions] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setOptimized(true);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!optimized) {
      setShowLateAdditions(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowLateAdditions(true);
    }, 1850);

    return () => window.clearTimeout(timeout);
  }, [optimized]);

  const formatDisplayTime = (value: string) => {
    if (locale === 'fr') {
      return value;
    }

    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;

    return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
  };

  const tones = {
    service: 'border-sky-200 bg-sky-50/75 text-slate-900',
    travel: optimized
      ? 'border-dashed border-amber-300 bg-amber-50/85 text-amber-950'
      : 'border-dashed border-rose-300 bg-rose-50/80 text-rose-950',
    gap: optimized
      ? 'border-dashed border-emerald-300 bg-emerald-50/85 text-emerald-950'
      : 'border-dashed border-slate-400 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.92),rgba(226,232,240,0.92)_8px,rgba(248,250,252,0.98)_8px,rgba(248,250,252,0.98)_16px)] text-slate-900',
    recommended:
      'border-amber-300 bg-amber-50/92 text-amber-950 shadow-[0_18px_40px_-28px_rgba(217,119,6,0.7)]',
  } as const;

  const badgeTones = {
    service: 'bg-sky-600 text-white',
    travel: optimized ? 'bg-transparent text-amber-700' : 'bg-transparent text-rose-700',
    gap: optimized ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-white',
    recommended: 'bg-amber-500 text-slate-950',
  } as const;

  const hourLabels = Array.from(
    { length: AGENDA_END_HOUR - AGENDA_START_HOUR + 1 },
    (_, index) => formatDisplayTime(`${String(AGENDA_START_HOUR + index).padStart(2, '0')}:00`),
  );

  const activeReasons = (optimized ? details.after : details.before).slice(0, 2);

  return (
    <section className="overflow-hidden rounded-[34px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,250,235,0.92))] p-5 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.42)] backdrop-blur md:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3">
            <div className="relative" style={{ height: `${AGENDA_HEIGHT_PX}px` }}>
              {hourLabels.map((hour, index) => {
                const top = (index / (hourLabels.length - 1)) * 100;

                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 -translate-y-1/2 text-[11px] font-medium text-black/40"
                    style={{ top: `${top}%` }}
                  >
                    {hour}
                  </div>
                );
              })}
            </div>

            <div
              className="relative overflow-hidden rounded-[26px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              style={{ height: `${AGENDA_HEIGHT_PX}px` }}
            >
              {hourLabels.map((hour, index) => {
                const top = (index / (hourLabels.length - 1)) * 100;

                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-dashed border-black/8"
                    style={{ top: `${top}%` }}
                  />
                );
              })}

              {slots.map((slot) => {
                const shouldRevealLate =
                  slot.key === 'inserted-session-two' || slot.key === 'new-drive';
                const visualSlot = optimized
                  ? (slot.after ?? slot.before)
                  : (slot.before ?? slot.after);

                if (!visualSlot) {
                  return null;
                }

                const fromSlot = slot.before ?? slot.after ?? visualSlot;
                const toSlot = slot.after ?? slot.before ?? visualSlot;
                const currentSlot = optimized ? toSlot : fromSlot;
                const currentVisual = getSlotVisual(currentSlot);
                const isUnavailableInCurrentState = optimized ? !slot.after : !slot.before;
                const isWaitingForLateReveal =
                  optimized && shouldRevealLate && !showLateAdditions;
                const isHidden =
                  isUnavailableInCurrentState || isWaitingForLateReveal;
                const isTiny = currentVisual.durationMinutes <= 20;
                const isCompact =
                  currentVisual.durationMinutes > 20 && currentVisual.durationMinutes <= 40;
                const titleClass = isTiny
                  ? 'text-xs leading-4'
                  : isCompact
                    ? 'text-[13px] leading-4'
                    : 'text-sm leading-5';
                const metaClass = isCompact
                  ? 'mt-0.5 text-[11px] leading-4'
                  : 'mt-1 text-xs leading-5';
                const travelSummary = currentSlot.meta
                  ? `${currentSlot.title} - ${currentSlot.meta}`
                  : currentSlot.title;

                const isTravelSlot =
                  currentSlot.tone === 'travel' &&
                  Boolean(currentSlot.mapsUrl);
                const timeColumnClass = isTravelSlot
                  ? isTiny
                    ? 'text-[10px] leading-4'
                    : isCompact
                      ? 'text-[11px] leading-4'
                      : 'text-xs leading-5'
                  : isTiny
                    ? 'text-xs leading-4'
                    : isCompact
                      ? 'text-[13px] leading-4'
                      : 'text-sm leading-6';

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
                    className={`absolute left-3 right-3 overflow-hidden rounded-[22px] border text-left transition-[top,height,opacity,transform,background-color,border-color,color,box-shadow] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${tones[currentSlot.tone]} ${isTravelSlot ? 'cursor-pointer hover:shadow-[0_16px_35px_-24px_rgba(15,23,42,0.45)] focus:outline-none focus:ring-2 focus:ring-slate-950/20' : ''} ${isHidden ? 'pointer-events-none' : ''}`}
                    style={{
                      top: `${currentVisual.top}px`,
                      height: `${currentVisual.height}px`,
                      zIndex: Math.round(currentVisual.top),
                      opacity: isHidden ? 0 : 1,
                      transform: isHidden ? 'scale(0.96)' : 'scale(1)',
                      padding:
                        currentVisual.durationMinutes <= 20
                          ? '0.5rem 1rem'
                          : currentVisual.durationMinutes <= 40
                            ? '0.5rem 1rem'
                            : '0.75rem 1rem',
                    }}
                  >
                    <div className="relative min-h-full">
                      <div className="absolute left-[108px] top-1/2 flex w-[120px] -translate-y-1/2 items-center justify-center">
                        <span
                          className={`inline-flex rounded-full font-semibold uppercase tracking-[0.14em] ${
                            isCompact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
                          } ${badgeTones[currentSlot.tone]}`}
                        >
                          {labels[currentSlot.tone]}
                        </span>
                      </div>

                      {currentSlot.tone === 'travel' ? (
                        <>
                          <div className={`absolute inset-y-0 left-0 flex w-[108px] items-center font-semibold tabular-nums ${timeColumnClass}`}>
                            <div className="truncate">{formatDisplayTime(currentSlot.start)} - {formatDisplayTime(currentSlot.end)}</div>
                          </div>

                          <div className="absolute inset-y-0 left-[240px] right-0 flex items-center justify-between gap-3">
                            <div className="min-w-0 truncate font-semibold text-[12px] leading-4">
                              {travelSummary}
                            </div>
                            {isTravelSlot ? (
                              <div
                                className={`inline-flex shrink-0 items-center gap-1.5 text-amber-950 ${
                                  isCompact
                                    ? 'text-[9px] font-semibold'
                                    : 'text-[10px] font-semibold'
                                }`}
                                aria-label={ui.mapsHint}
                                title={ui.mapsHint}
                              >
                                <span className="uppercase tracking-[0.12em]">
                                  {ui.mapsOpenInDesktop}
                                </span>
                                <Image
                                  src="/GoogleMaps.svg"
                                  alt={ui.mapsHint}
                                  width={56}
                                  height={14}
                                  className="shrink-0"
                                />
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-[108px_minmax(0,1fr)] items-start">
                          <div className={`min-w-0 font-semibold tabular-nums ${timeColumnClass}`}>
                            {formatDisplayTime(currentSlot.start)}
                            <div
                              className={`font-medium uppercase tracking-[0.12em] opacity-55 ${
                                isTiny ? 'text-[9px]' : 'text-[10px]'
                              }`}
                            >
                              {formatDisplayTime(currentSlot.end)}
                            </div>
                          </div>

                          <div className="min-w-0 pl-[132px]">
                            <div className={`truncate font-semibold ${titleClass}`}>{currentSlot.title}</div>
                            {!isTiny ? (
                              <div className={`line-clamp-2 opacity-80 ${metaClass}`}>{currentSlot.meta}</div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="flex h-full min-w-0 flex-col rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,250,245,0.98))] p-5 shadow-[0_22px_55px_-44px_rgba(15,23,42,0.3)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">
            {ui.eyebrow}
          </div>

          <div className="mt-4">
            <div className="text-lg font-semibold text-slate-950 transition">
              {optimized ? afterTitle : beforeTitle}
            </div>
            <p className="mt-2 text-sm leading-6 text-black/65">
              {optimized ? afterSubtitle : beforeSubtitle}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <span
              className={`inline-flex w-full items-center justify-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                optimized
                  ? 'border-transparent bg-black/5 text-black/45'
                  : 'border-transparent bg-slate-950 text-white shadow-[0_16px_35px_-24px_rgba(15,23,42,0.7)]'
              }`}
            >
              <span className="text-center">{ui.beforeState}</span>
            </span>
            <span
              className={`inline-flex w-full items-center justify-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                optimized
                  ? 'border-transparent bg-amber-500 text-slate-950 shadow-[0_16px_35px_-24px_rgba(217,119,6,0.55)]'
                  : 'border-transparent bg-black/5 text-black/45'
              }`}
            >
              <span className="text-center">{ui.afterState}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOptimized((value) => !value)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_16px_35px_-24px_rgba(15,23,42,0.7)] transition hover:opacity-92"
          >
            {optimized ? ui.toBefore : ui.toAfter}
          </button>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              {ui.whyLabel}
            </div>
            <div className="mt-3 space-y-2.5">
              {activeReasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-[18px] border border-black/7 bg-white/88 px-3 py-2.5 text-sm leading-6 text-slate-800 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.35)]"
                >
                  {reason}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              {ui.impactLabel}
            </div>
            <div className="mt-3 rounded-[20px] bg-slate-950 px-4 py-3 text-sm leading-6 text-white/82 shadow-[0_24px_40px_-28px_rgba(15,23,42,0.65)] transition">
              {optimized ? afterFooter : beforeFooter}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

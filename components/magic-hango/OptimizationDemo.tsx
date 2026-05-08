import { getTranslations } from 'next-intl/server';
import { AnimatedAgendaShowcase } from '@/components/magic-hango/AnimatedAgendaShowcase';
import type { Locale } from '@/src/lib/i18n';

type MiniSlot = {
  start: string;
  end: string;
  title: string;
  meta: string;
  tone: 'service' | 'travel' | 'recommended' | 'gap';
  mapsUrl?: string;
};

type ComparisonRow = {
  label: string;
  before: string;
  after: string;
  gain: string;
};

type AgendaStats = {
  sessionCount: number;
  billableMinutes: number;
  travelMinutes: number;
  gapMinutes: number;
  endMinutes: number;
  lastClient: string;
};

const BEFORE_DISTANCE_MILES = 154;
const AFTER_DISTANCE_MILES = 68.7;
const ASSUMED_MPG = 25;
const AAA_AVERAGE_REGULAR_GAS_USD_PER_GALLON = 2.839;
const FRENCH_AVERAGE_SP95_E10_EUR_PER_LITER = 2.002;
const ASSUMED_LITERS_PER_100KM = 235.214583 / ASSUMED_MPG;

const poppins = { className: 'font-sans' };

function buildGoogleMapsDirections(origin: string, destination: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function getSlotDuration(slot: MiniSlot) {
  return toMinutes(slot.end) - toMinutes(slot.start);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${String(remainingMinutes).padStart(2, '0')}`;
}

function formatClock(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

function formatClockForLocale(locale: Locale, minutes: number) {
  if (locale === 'fr') {
    return formatClock(minutes);
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${String(remainingMinutes).padStart(2, '0')} ${suffix}`;
}

function formatDistance(locale: Locale, miles: number) {
  if (locale === 'fr') {
    const kilometers = miles * 1.60934;
    return `${kilometers.toFixed(1).replace('.', ',')} km`;
  }

  return `${miles.toFixed(1).replace(/\.0$/, '')} mi`;
}

function formatCurrencyPerDay(locale: Locale, amount: number) {
  const formatted = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: locale === 'fr' ? 'EUR' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return locale === 'fr' ? `${formatted}/jour` : `${formatted}/day`;
}

function formatSavings(locale: Locale, amount: number) {
  const formatted = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: locale === 'fr' ? 'EUR' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return locale === 'fr' ? `${formatted} économisés` : `${formatted} saved`;
}

function computeAgendaStats(slots: MiniSlot[]): AgendaStats {
  return slots.reduce<AgendaStats>(
    (accumulator, slot) => {
      const duration = getSlotDuration(slot);

      if (slot.tone === 'travel') {
        accumulator.travelMinutes += duration;
      }

      if (slot.tone === 'gap') {
        accumulator.gapMinutes += duration;
      }

      if (slot.tone === 'service' || slot.tone === 'recommended') {
        accumulator.sessionCount += 1;
        accumulator.billableMinutes += duration;
        accumulator.lastClient = slot.meta || slot.title;
      }

      accumulator.endMinutes = Math.max(accumulator.endMinutes, toMinutes(slot.end));

      return accumulator;
    },
    {
      sessionCount: 0,
      billableMinutes: 0,
      travelMinutes: 0,
      gapMinutes: 0,
      endMinutes: 0,
      lastClient: '',
    },
  );
}

function ComparisonTable({
  title,
  note,
  assumption,
  rows,
  beforeLabel,
  afterLabel,
  gainLabel,
}: {
  title: string;
  note: string;
  assumption: string;
  rows: ComparisonRow[];
  beforeLabel: string;
  afterLabel: string;
  gainLabel: string;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-black/8 bg-white/92 shadow-[0_30px_80px_-56px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="border-b border-black/6 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,245,214,0.92))] px-5 py-4 md:px-6">
        <div className={`${poppins.className} text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45`}>
          {title}
        </div>
        <p className="mt-2 text-sm leading-6 text-black/65">{note}</p>
        <p className="mt-1 text-xs leading-5 text-black/48">{assumption}</p>
      </div>
      <div className="overflow-x-auto px-5 py-3 md:px-6 md:py-4">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/8 text-black/50">
              <th className="px-0 py-3 font-medium">{''}</th>
              <th className="px-3 py-3 font-medium">{beforeLabel}</th>
              <th className="px-3 py-3 font-medium">{afterLabel}</th>
              <th className="px-3 py-3 font-medium">{gainLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-black/6 last:border-b-0"
              >
                <td className="px-0 py-3.5 font-medium text-slate-950">
                  {row.label}
                </td>
                <td className="px-3 py-3.5 text-black/68">{row.before}</td>
                <td className="px-3 py-3.5 text-black/68">{row.after}</td>
                <td className="px-3 py-3.5">
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950">
                    {row.gain}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export async function OptimizationDemo({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'magicHango' });
  const isFrench = locale === 'fr';
  const slotLabels: Record<MiniSlot['tone'], string> = {
    service: t('simple.labels.service'),
    travel: t('simple.labels.travel'),
    recommended: t('simple.labels.recommended'),
    gap: t('simple.labels.gap'),
  };
  const valueItems = [
    t('conversationPreview.items.0'),
    t('conversationPreview.items.1'),
    t('conversationPreview.items.2'),
    t('conversationPreview.items.3'),
    t('conversationPreview.items.4'),
  ];
  const smsSteps = [
    {
      label: t('smsDemo.steps.0.label'),
      title: t('smsDemo.steps.0.title'),
      body: t('smsDemo.steps.0.body'),
    },
    {
      label: t('smsDemo.steps.1.label'),
      title: t('smsDemo.steps.1.title'),
      body: t('smsDemo.steps.1.body'),
    },
    {
      label: t('smsDemo.steps.2.label'),
      title: t('smsDemo.steps.2.title'),
      body: t('smsDemo.steps.2.body'),
    },
    {
      label: t('smsDemo.steps.3.label'),
      title: t('smsDemo.steps.3.title'),
      body: t('smsDemo.steps.3.body'),
    },
  ];

  const beforePlaces = {
    home: 'Mason Municipal Center, 6000 Mason-Montgomery Rd, Mason, OH 45040, USA',
    clientOne:
      'Miamisburg Civic Center, 10 N First St, Miamisburg, OH 45342, USA',
    clientTwo:
      'Loveland City Hall, 120 W Loveland Ave, Loveland, OH 45140, USA',
    clientThree: 'Dayton City Hall, 101 W 3rd St, Dayton, OH 45402, USA',
  };

  const afterPlaces = {
    home: 'Mason Municipal Center, 6000 Mason-Montgomery Rd, Mason, OH 45040, USA',
    clientA: 'Franklin Public Library, 44 E 4th St, Franklin, OH 45005, USA',
    clientB:
      'Miamisburg Civic Center, 10 N First St, Miamisburg, OH 45342, USA',
    clientC:
      'Lebanon Public Library, 101 S Broadway St, Lebanon, OH 45036, USA',
    clientD: 'Loveland City Hall, 120 W Loveland Ave, Loveland, OH 45140, USA',
  };

  const beforeSlots: MiniSlot[] = [
    {
      start: '08:30',
      end: '09:10',
      title: t('simple.before.slots.rideFromHome.title'),
      meta: t('simple.before.slots.rideFromHome.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(
        beforePlaces.home,
        beforePlaces.clientOne,
      ),
    },
    {
      start: '09:10',
      end: '10:10',
      title: t('simple.before.slots.sessionOne.title'),
      meta: t('simple.before.slots.sessionOne.meta'),
      tone: 'service',
    },
    {
      start: '10:10',
      end: '11:05',
      title: t('simple.before.slots.longDriveOne.title'),
      meta: t('simple.before.slots.longDriveOne.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(
        beforePlaces.clientOne,
        beforePlaces.clientTwo,
      ),
    },
    {
      start: '11:05',
      end: '12:05',
      title: t('simple.before.slots.sessionTwo.title'),
      meta: t('simple.before.slots.sessionTwo.meta'),
      tone: 'service',
    },
    {
      start: '12:05',
      end: '13:40',
      title: t('simple.before.slots.idleGap.title'),
      meta: t('simple.before.slots.idleGap.meta'),
      tone: 'gap',
    },
    {
      start: '13:40',
      end: '14:35',
      title: t('simple.before.slots.longDriveTwo.title'),
      meta: t('simple.before.slots.longDriveTwo.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(
        beforePlaces.clientTwo,
        beforePlaces.clientThree,
      ),
    },
    {
      start: '14:35',
      end: '15:35',
      title: t('simple.before.slots.sessionThree.title'),
      meta: t('simple.before.slots.sessionThree.meta'),
      tone: 'service',
    },
    {
      start: '15:35',
      end: '16:15',
      title: t('simple.before.slots.longTripHome.title'),
      meta: t('simple.before.slots.longTripHome.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(
        beforePlaces.clientThree,
        beforePlaces.home,
      ),
    },
  ];

  const afterSlots: MiniSlot[] = [
    {
      start: '08:30',
      end: '09:00',
      title: t('simple.after.slots.rideFromHome.title'),
      meta: t('simple.after.slots.rideFromHome.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(afterPlaces.home, afterPlaces.clientA),
    },
    {
      start: '09:00',
      end: '10:00',
      title: t('simple.after.slots.sessionOne.title'),
      meta: t('simple.after.slots.sessionOne.meta'),
      tone: 'service',
    },
    {
      start: '10:00',
      end: '10:15',
      title: t('simple.after.slots.optimizedDriveOne.title'),
      meta: t('simple.after.slots.optimizedDriveOne.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(
        afterPlaces.clientA,
        afterPlaces.clientB,
      ),
    },
    {
      start: '10:15',
      end: '11:15',
      title: t('simple.after.slots.sessionTwo.title'),
      meta: t('simple.after.slots.sessionTwo.meta'),
      tone: 'recommended',
    },
    {
      start: '11:15',
      end: '11:45',
      title: t('simple.after.slots.optimizedDriveTwo.title'),
      meta: t('simple.after.slots.optimizedDriveTwo.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(
        afterPlaces.clientB,
        afterPlaces.clientC,
      ),
    },
    {
      start: '11:45',
      end: '12:45',
      title: t('simple.after.slots.sessionThree.title'),
      meta: t('simple.after.slots.sessionThree.meta'),
      tone: 'service',
    },
    {
      start: '12:45',
      end: '13:40',
      title: t('simple.after.slots.realBreak.title'),
      meta: t('simple.after.slots.realBreak.meta'),
      tone: 'gap',
    },
    {
      start: '13:40',
      end: '14:00',
      title: t('simple.after.slots.shortDrive.title'),
      meta: t('simple.after.slots.shortDrive.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(
        afterPlaces.clientC,
        afterPlaces.clientD,
      ),
    },
    {
      start: '14:00',
      end: '15:00',
      title: t('simple.after.slots.sessionFour.title'),
      meta: t('simple.after.slots.sessionFour.meta'),
      tone: 'recommended',
    },
    {
      start: '15:00',
      end: '15:25',
      title: t('simple.after.slots.shortTripHome.title'),
      meta: t('simple.after.slots.shortTripHome.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(afterPlaces.clientD, afterPlaces.home),
    },
  ];

  const morphSlots = [
    {
      key: 'ride-from-home',
      before: beforeSlots[0],
      after: afterSlots[0],
    },
    {
      key: 'session-one',
      before: beforeSlots[1],
      after: afterSlots[1],
    },
    {
      key: 'drive-one',
      before: beforeSlots[2],
      after: afterSlots[2],
    },
    {
      key: 'session-two',
      before: beforeSlots[3],
      after: afterSlots[5],
    },
    {
      key: 'inserted-session-two',
      after: afterSlots[3],
    },
    {
      key: 'drive-two',
      before: beforeSlots[5],
      after: afterSlots[7],
    },
    {
      key: 'middle-gap',
      before: beforeSlots[4],
      after: afterSlots[6],
    },
    {
      key: 'new-drive',
      after: afterSlots[4],
    },
    {
      key: 'new-session',
      before: beforeSlots[6],
      after: afterSlots[8],
    },
    {
      key: 'return-home',
      before: beforeSlots[7],
      after: afterSlots[9],
    },
  ];

  const beforeStats = computeAgendaStats(beforeSlots);
  const afterStats = computeAgendaStats(afterSlots);
  const travelSavedMinutes = beforeStats.travelMinutes - afterStats.travelMinutes;
  const returnSavedMinutes = beforeStats.endMinutes - afterStats.endMinutes;
  const gapSavedMinutes = beforeStats.gapMinutes - afterStats.gapMinutes;
  const sessionGain = afterStats.sessionCount - beforeStats.sessionCount;
  const billableGainPercent = Math.round(
    ((afterStats.billableMinutes - beforeStats.billableMinutes) / beforeStats.billableMinutes) *
      100,
  );
  const beforeDistanceKm = BEFORE_DISTANCE_MILES * 1.60934;
  const afterDistanceKm = AFTER_DISTANCE_MILES * 1.60934;
  const beforeFuelCost = isFrench
    ? (beforeDistanceKm / 100) *
      ASSUMED_LITERS_PER_100KM *
      FRENCH_AVERAGE_SP95_E10_EUR_PER_LITER
    : (BEFORE_DISTANCE_MILES / ASSUMED_MPG) * AAA_AVERAGE_REGULAR_GAS_USD_PER_GALLON;
  const afterFuelCost = isFrench
    ? (afterDistanceKm / 100) *
      ASSUMED_LITERS_PER_100KM *
      FRENCH_AVERAGE_SP95_E10_EUR_PER_LITER
    : (AFTER_DISTANCE_MILES / ASSUMED_MPG) * AAA_AVERAGE_REGULAR_GAS_USD_PER_GALLON;
  const fuelSavings = beforeFuelCost - afterFuelCost;

  const comparisonRows: ComparisonRow[] = [
    {
      label: t('comparison.rows.sessions'),
      before: String(beforeStats.sessionCount),
      after: String(afterStats.sessionCount),
      gain: isFrench ? `+${sessionGain} séance` : `+${sessionGain} session`,
    },
    {
      label: t('comparison.rows.billable'),
      before: formatDuration(beforeStats.billableMinutes),
      after: formatDuration(afterStats.billableMinutes),
      gain: `+${billableGainPercent}%`,
    },
    {
      label: t('comparison.rows.travel'),
      before: formatDuration(beforeStats.travelMinutes),
      after: formatDuration(afterStats.travelMinutes),
      gain: `-${formatDuration(travelSavedMinutes)}`,
    },
    {
      label: t('comparison.rows.distance'),
      before: formatDistance(locale, BEFORE_DISTANCE_MILES),
      after: formatDistance(locale, AFTER_DISTANCE_MILES),
      gain: `-${formatDistance(locale, BEFORE_DISTANCE_MILES - AFTER_DISTANCE_MILES)}`,
    },
    {
      label: t('comparison.rows.fuel'),
      before: formatCurrencyPerDay(locale, beforeFuelCost),
      after: formatCurrencyPerDay(locale, afterFuelCost),
      gain: formatSavings(locale, fuelSavings),
    },
    {
      label: t('comparison.rows.deadTime'),
      before: formatDuration(beforeStats.gapMinutes),
      after: formatDuration(afterStats.gapMinutes),
      gain: `-${formatDuration(gapSavedMinutes)}`,
    },
    {
      label: t('comparison.rows.returnTime'),
      before: formatClockForLocale(locale, beforeStats.endMinutes),
      after: formatClockForLocale(locale, afterStats.endMinutes),
      gain: isFrench
        ? `${formatDuration(returnSavedMinutes)} plus tôt`
        : `${formatDuration(returnSavedMinutes)} earlier`,
    },
    {
      label: t('comparison.rows.endQuality'),
      before: beforeStats.lastClient,
      after: afterStats.lastClient,
      gain: isFrench ? 'Plus proche du domicile' : 'Closer to home',
    },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="relative overflow-hidden rounded-[38px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,221,0.98)_42%,rgba(255,252,242,0.94)_100%)] p-6 shadow-[0_34px_90px_-56px_rgba(217,119,6,0.48)] md:p-8">
        <div className="absolute -left-20 top-0 h-48 w-48 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-100/45 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className={`${poppins.className} inline-flex rounded-full border border-black/8 bg-white/76 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/45 shadow-sm`}>
                {t('simple.eyebrow')}
              </div>
              <h1 className={`${poppins.className} mt-4 max-w-4xl text-[clamp(1.65rem,4.5vw,2.95rem)] font-black tracking-tight text-slate-950 md:leading-[1.02]`}>
                {t('hero.title')}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-black/68 md:text-base">
                {t('simple.subtitle')}
              </p>
              <div className="mt-6">
                <a
                  href="#missed-call-workflow"
                  className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] transition hover:bg-slate-900"
                >
                  {t('hero.cta')}
                </a>
              </div>
          </div>

          <div className="rounded-[28px] border border-black/8 bg-white/92 p-4 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.28)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              {t('conversationPreview.eyebrow')}
            </div>
            <h2 className={`${poppins.className} mt-3 text-xl font-black tracking-tight text-slate-950`}>
              {t('conversationPreview.title')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/66">
              {t('conversationPreview.subtitle')}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {valueItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-black/8 bg-white/78 px-3 py-2 text-xs font-semibold text-slate-800 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.32)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          </div>
        </section>

      <section
        id="missed-call-workflow"
        className="rounded-[32px] border border-black/8 bg-white/92 p-6 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.32)] md:p-7"
      >
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            {t('smsDemo.eyebrow')}
          </div>
          <h2 className={`${poppins.className} mt-3 text-2xl font-black tracking-tight text-slate-950 md:text-[2rem]`}>
            {t('smsDemo.title')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-black/68 md:text-base">
            {t('smsDemo.subtitle')}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {smsSteps.map((step, index) => (
            <article
              key={step.label}
              className="rounded-[24px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,217,0.9))] p-5 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.22)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  {step.label}
                </div>
              </div>
              <div className="mt-4 text-sm font-semibold leading-6 text-slate-950">
                {step.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-black/66">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <AnimatedAgendaShowcase
          locale={locale}
          beforeTitle={t('simple.before.title')}
          beforeSubtitle={t('simple.before.subtitle')}
          beforeFooter={t('simple.before.footer')}
          afterTitle={t('simple.after.title')}
          afterSubtitle={t('simple.after.subtitle')}
          afterFooter={t('simple.after.footer')}
          labels={slotLabels}
          slots={morphSlots}
          ui={{
            eyebrow: t('animation.eyebrow'),
            beforeState: t('animation.beforeState'),
            afterState: t('animation.afterState'),
            toBefore: t('animation.toBefore'),
            toAfter: t('animation.toAfter'),
            whyLabel: t('animation.whyLabel'),
            impactLabel: t('animation.impactLabel'),
            mapsOpenInDesktop: t('animation.mapsOpenInDesktop'),
            mapsHint: t('animation.mapsHint'),
          }}
          details={{
            before: [
              t('animation.beforeReasonOne'),
              t('animation.beforeReasonTwo'),
              t('animation.beforeReasonThree'),
            ],
            after: [
              t('animation.afterReasonOne'),
              t('animation.afterReasonTwo'),
              t('animation.afterReasonThree'),
            ],
          }}
        />
      </section>

      <ComparisonTable
        title={t('comparison.title')}
        note={t('comparison.note')}
        assumption={t('comparison.assumption')}
        rows={comparisonRows}
        beforeLabel={t('comparison.headers.before')}
        afterLabel={t('comparison.headers.after')}
        gainLabel={t('comparison.headers.gain')}
      />
    </div>
  );
}

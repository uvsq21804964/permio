import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { getTranslations } from 'next-intl/server';
import { MobileAnimatedAgendaShowcase } from '@/components/magic-hango/MobileAnimatedAgendaShowcase';
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

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
});

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

function MobileStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-[22px] border border-black/8 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.22)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
        {label}
      </div>
      <div className={`${poppins.className} mt-2 text-2xl font-black tracking-tight text-slate-950`}>
        {value}
      </div>
      {detail ? <div className="mt-1 text-xs text-black/55">{detail}</div> : null}
    </article>
  );
}

function MobileComparisonCard({
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
  const comparisonGridClass =
    'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_104px] items-start gap-3';

  return (
    <section className="overflow-hidden rounded-[28px] border border-black/8 bg-white/92 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.42)]">
      <div className="border-b border-black/6 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,245,214,0.92))] px-4 py-4">
        <div className={`${poppins.className} text-lg font-bold tracking-tight text-slate-950`}>
          {title}
        </div>
        <p className="mt-2 text-sm leading-6 text-black/65">{note}</p>
        <p className="mt-1 text-xs leading-5 text-black/48">{assumption}</p>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className={`${comparisonGridClass} px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40`}>
          <div className="text-left">{beforeLabel}</div>
          <div className="text-left">{afterLabel}</div>
          <div className="text-left">{gainLabel}</div>
        </div>

        {rows.map((row) => (
          <article
            key={row.label}
            className="rounded-[20px] border border-black/7 bg-white/88 p-3 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.35)]"
          >
            <div className="text-sm font-semibold text-slate-950">{row.label}</div>
            <div className={`${comparisonGridClass} mt-3 text-xs`}>
              <div className="min-w-0">
                <div className="text-sm text-black/68">{row.before}</div>
              </div>
              <div className="min-w-0">
                <div className="text-sm text-black/68">{row.after}</div>
              </div>
              <div className="flex justify-start">
                <div className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950 whitespace-nowrap">
                  {row.gain}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MobileRouteMapCard({
  title,
  totalLabel,
  totalValue,
  caption,
  imageSrc,
  mapsUrl,
}: {
  title: string;
  totalLabel: string;
  totalValue: string;
  caption: string;
  imageSrc: string;
  mapsUrl: string;
}) {
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="block overflow-hidden rounded-[28px] border border-black/8 bg-white/94 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.42)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-black/6 px-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Image
              src="/GoogleMaps.svg"
              alt="Google Maps"
              width={72}
              height={18}
              className="h-auto w-[72px] shrink-0"
            />
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-950">{title}</div>
        </div>
        <div className="shrink-0 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
          {totalValue}
        </div>
      </div>
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
          {totalLabel}
        </div>
        <p className="mt-2 text-sm leading-6 text-black/68">{caption}</p>
      </div>
    </a>
  );
}

export async function OptimizationDemoMobile({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'magicHango' });
  const isFrench = locale === 'fr';

  const labels: Record<MiniSlot['tone'], string> = {
    service: t('simple.labels.service'),
    travel: t('simple.labels.travel'),
    recommended: t('simple.labels.recommended'),
    gap: t('simple.labels.gap'),
  };

  const beforePlaces = {
    home: 'Mason Municipal Center, 6000 Mason-Montgomery Rd, Mason, OH 45040, USA',
    clientOne: 'Miamisburg Civic Center, 10 N First St, Miamisburg, OH 45342, USA',
    clientTwo: 'Loveland City Hall, 120 W Loveland Ave, Loveland, OH 45140, USA',
    clientThree: 'Dayton City Hall, 101 W 3rd St, Dayton, OH 45402, USA',
  };

  const afterPlaces = {
    home: 'Mason Municipal Center, 6000 Mason-Montgomery Rd, Mason, OH 45040, USA',
    clientA: 'Franklin Public Library, 44 E 4th St, Franklin, OH 45005, USA',
    clientB: 'Miamisburg Civic Center, 10 N First St, Miamisburg, OH 45342, USA',
    clientC: 'Lebanon Public Library, 101 S Broadway St, Lebanon, OH 45036, USA',
    clientD: 'Loveland City Hall, 120 W Loveland Ave, Loveland, OH 45140, USA',
  };

  const beforeSlots: MiniSlot[] = [
    {
      start: '08:30',
      end: '09:10',
      title: t('simple.before.slots.rideFromHome.title'),
      meta: t('simple.before.slots.rideFromHome.meta'),
      tone: 'travel',
      mapsUrl: buildGoogleMapsDirections(beforePlaces.home, beforePlaces.clientOne),
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
      mapsUrl: buildGoogleMapsDirections(beforePlaces.clientOne, beforePlaces.clientTwo),
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
      mapsUrl: buildGoogleMapsDirections(beforePlaces.clientTwo, beforePlaces.clientThree),
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
      mapsUrl: buildGoogleMapsDirections(beforePlaces.clientThree, beforePlaces.home),
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
      mapsUrl: buildGoogleMapsDirections(afterPlaces.clientA, afterPlaces.clientB),
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
      mapsUrl: buildGoogleMapsDirections(afterPlaces.clientB, afterPlaces.clientC),
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
      mapsUrl: buildGoogleMapsDirections(afterPlaces.clientC, afterPlaces.clientD),
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

  const beforeStats = computeAgendaStats(beforeSlots);
  const afterStats = computeAgendaStats(afterSlots);
  const travelSavedMinutes = beforeStats.travelMinutes - afterStats.travelMinutes;
  const sessionGain = afterStats.sessionCount - beforeStats.sessionCount;
  const returnSavedMinutes = beforeStats.endMinutes - afterStats.endMinutes;
  const beforeDistanceKm = BEFORE_DISTANCE_MILES * 1.60934;
  const afterDistanceKm = AFTER_DISTANCE_MILES * 1.60934;
  const beforeFuelCost = isFrench
    ? (beforeDistanceKm / 100) * ASSUMED_LITERS_PER_100KM * FRENCH_AVERAGE_SP95_E10_EUR_PER_LITER
    : (BEFORE_DISTANCE_MILES / ASSUMED_MPG) * AAA_AVERAGE_REGULAR_GAS_USD_PER_GALLON;
  const afterFuelCost = isFrench
    ? (afterDistanceKm / 100) * ASSUMED_LITERS_PER_100KM * FRENCH_AVERAGE_SP95_E10_EUR_PER_LITER
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
      label: t('comparison.rows.returnTime'),
      before: formatClock(beforeStats.endMinutes),
      after: formatClock(afterStats.endMinutes),
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

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,221,0.98)_42%,rgba(255,252,242,0.94)_100%)] p-5 shadow-[0_34px_90px_-56px_rgba(217,119,6,0.48)]">
        <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative">
          <div className={`${poppins.className} inline-flex rounded-full border border-black/8 bg-white/76 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/45 shadow-sm`}>
            {t('simple.eyebrow')}
          </div>
          <h1 className={`${poppins.className} mt-4 text-[clamp(1.9rem,10vw,2.8rem)] font-black tracking-tight text-slate-950`}>
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-sm leading-7 text-black/68">
            {t('simple.subtitle')}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MobileStatCard
            label={t('hero.proof.travel')}
            value={`-${formatDuration(travelSavedMinutes)}`}
            detail={t('hero.proofDetails.perDay')}
          />
          <MobileStatCard
            label={t('hero.proof.choice')}
            value={`+${sessionGain}`}
            detail={t('hero.proofDetails.sessions')}
          />
          <div className="col-span-2">
            <MobileStatCard
              label={t('hero.proof.finish')}
              value={`${formatClock(beforeStats.endMinutes)} → ${formatClock(afterStats.endMinutes)}`}
              detail={isFrench ? 'sur une journée type' : 'on a worked day'}
            />
          </div>
        </div>
      </section>

      <MobileAnimatedAgendaShowcase
        locale={locale}
        beforeTitle={t('simple.before.title')}
        beforeSubtitle={t('simple.before.subtitle')}
        beforeFooter={t('simple.before.footer')}
        afterTitle={t('simple.after.title')}
        afterSubtitle={t('simple.after.subtitle')}
        afterFooter={t('simple.after.footer')}
        labels={labels}
        slots={morphSlots}
        ui={{
          beforeState: t('animation.beforeState'),
          afterState: t('animation.afterState'),
          toBefore: t('animation.toBefore'),
          toAfter: t('animation.toAfter'),
          mapsOpenInMobile: t('animation.mapsOpenInMobile'),
          mapsHint: t('animation.mapsHint'),
        }}
      />

      <MobileComparisonCard
        title={t('comparison.title')}
        note={t('comparison.note')}
        assumption={t('comparison.assumption')}
        rows={comparisonRows}
        beforeLabel={t('comparison.headers.before')}
        afterLabel={t('comparison.headers.after')}
        gainLabel={t('comparison.headers.gain')}
      />

      <div className="grid gap-4">
        <MobileRouteMapCard
          title={t('routeCards.before.title')}
          totalLabel={t('routeCards.totalLabel')}
          totalValue={formatDuration(beforeStats.travelMinutes)}
          caption={t('routeCards.before.caption')}
          imageSrc="/demo/DemoCalendarWithoutMagicHango.png"
          mapsUrl="https://www.google.com/maps/dir/Mason+Municipal+Center,+6000+Mason+Montgomery+Rd,+Mason,+OH+45040,+%C3%89tats-Unis/Miamisburg+Civic+Center,+10+N+1st+St,+Miamisburg,+OH+45342,+%C3%89tats-Unis/@39.4978571,-84.462854,11z/data=!4m14!4m13!1m5!1m1!1s0x8840580e2dd467b5:0x6efd7c758be091b0!2m2!1d-84.3083587!2d39.3533767!1m5!1m1!1s0x8840628c5c5af86b:0x36fade715f8a2f31!2m2!1d-84.2871069!2d39.6422979!3e0?entry=ttu&g_ep=EgoyMDI2MDQyOC4wIKXMDSoASAFQAw%3D%3D"
        />

        <MobileRouteMapCard
          title={t('routeCards.after.title')}
          totalLabel={t('routeCards.totalLabel')}
          totalValue={formatDuration(afterStats.travelMinutes)}
          caption={t('routeCards.after.caption')}
          imageSrc="/demo/DemoCalendarWithMagicHango.png"
          mapsUrl="https://www.google.com/maps/dir/Franklin-Springboro+Public+Library+-+Main,+44+E+4th+St,+Franklin,+OH+45005,+%C3%89tats-Unis/Miamisburg+Civic+Center,+10+N+1st+St,+Miamisburg,+OH+45342,+%C3%89tats-Unis/@39.6002809,-84.3333406,13z/data=!3m1!4b1!4m14!4m13!1m5!1m1!1s0x884061ade123f897:0x18dd6f635efd343d!2m2!1d-84.3026632!2d39.5586492!1m5!1m1!1s0x8840628c5c5af86b:0x36fade715f8a2f31!2m2!1d-84.2871069!2d39.6422979!3e0?entry=ttu&g_ep=EgoyMDI2MDQyOC4wIKXMDSoASAFQAw%3D%3D"
        />
      </div>
    </div>
  );
}

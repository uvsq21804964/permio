import { sql } from '@/lib/db';
import type { SmartPricingMode, SmartPricingParams } from '@/lib/pricing/smartSlotPricing';

export type SmartPricingSettingsRow = {
  instructor_user_id: string;
  enabled: boolean;
  mode: SmartPricingMode;
  trainer_hourly_value_cents: number | string;
  cost_per_km_cents: number | string;
  pass_through_rate: number | string;
  max_discount_pct: number | string;
  max_surcharge_pct: number | string;
  max_discount_cents: number | string | null;
  max_surcharge_cents: number | string | null;
  neutral_zone_pct: number | string;
  round_to_nearest_cents: number | string;
  hide_if_impact_above_cents: number | string;
  available_on_request_if_impact_above_cents: number | string;
  waste_factor: number | string;
  weights: SmartPricingParams['weights'] | string | null;
  thresholds: SmartPricingParams['thresholds'] | string | null;
  created_at: string;
  updated_at: string;
};

let ensureSmartPricingSettingsTablePromise: Promise<void> | null = null;

function toJsonLiteral(value: unknown) {
  return JSON.stringify(value);
}

async function ensureSmartPricingSettingsTable() {
  if (!ensureSmartPricingSettingsTablePromise) {
    ensureSmartPricingSettingsTablePromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS smart_pricing_settings (
          instructor_user_id text PRIMARY KEY,
          enabled boolean NOT NULL DEFAULT TRUE,
          mode text NOT NULL DEFAULT 'discount_only',
          trainer_hourly_value_cents integer NOT NULL DEFAULT 4500 CHECK (trainer_hourly_value_cents >= 0),
          cost_per_km_cents integer NOT NULL DEFAULT 45 CHECK (cost_per_km_cents >= 0),
          pass_through_rate numeric NOT NULL DEFAULT 0.5 CHECK (pass_through_rate >= 0 AND pass_through_rate <= 1),
          max_discount_pct numeric NOT NULL DEFAULT 0.2 CHECK (max_discount_pct >= 0),
          max_surcharge_pct numeric NOT NULL DEFAULT 0.15 CHECK (max_surcharge_pct >= 0),
          max_discount_cents integer DEFAULT 1800 CHECK (max_discount_cents >= 0),
          max_surcharge_cents integer DEFAULT 2500 CHECK (max_surcharge_cents >= 0),
          neutral_zone_pct numeric NOT NULL DEFAULT 0.03 CHECK (neutral_zone_pct >= 0),
          round_to_nearest_cents integer NOT NULL DEFAULT 500 CHECK (round_to_nearest_cents >= 0),
          hide_if_impact_above_cents integer NOT NULL DEFAULT 7000 CHECK (hide_if_impact_above_cents >= 0),
          available_on_request_if_impact_above_cents integer NOT NULL DEFAULT 5000 CHECK (available_on_request_if_impact_above_cents >= 0),
          waste_factor numeric NOT NULL DEFAULT 0.6 CHECK (waste_factor >= 0),
          weights jsonb NOT NULL,
          thresholds jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT smart_pricing_settings_mode_check
            CHECK (mode IN ('rank_only', 'discount_only', 'discount_and_surcharge'))
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS smart_pricing_settings_updated_at_idx
          ON smart_pricing_settings (updated_at DESC)
      `;

      await sql`
        ALTER TABLE smart_pricing_settings
        ALTER COLUMN round_to_nearest_cents SET DEFAULT 500
      `;

      await sql`
        UPDATE smart_pricing_settings
        SET round_to_nearest_cents = 500,
            updated_at = now()
        WHERE round_to_nearest_cents = 100
      `;
    })().catch((error) => {
      ensureSmartPricingSettingsTablePromise = null;
      throw error;
    });
  }

  await ensureSmartPricingSettingsTablePromise;
}

export async function getSmartPricingSettingsRow(
  instructorUserId: string,
): Promise<SmartPricingSettingsRow | null> {
  await ensureSmartPricingSettingsTable();

  const rows = await sql`
    SELECT
      instructor_user_id,
      enabled,
      mode,
      trainer_hourly_value_cents,
      cost_per_km_cents,
      pass_through_rate,
      max_discount_pct,
      max_surcharge_pct,
      max_discount_cents,
      max_surcharge_cents,
      neutral_zone_pct,
      round_to_nearest_cents,
      hide_if_impact_above_cents,
      available_on_request_if_impact_above_cents,
      waste_factor,
      weights,
      thresholds,
      created_at::text AS created_at,
      updated_at::text AS updated_at
    FROM smart_pricing_settings
    WHERE instructor_user_id = ${instructorUserId}
    LIMIT 1
  `;

  return (rows[0] as SmartPricingSettingsRow | undefined) ?? null;
}

export async function upsertSmartPricingSettingsRow(params: {
  instructorUserId: string;
  settings: SmartPricingParams;
}) {
  await ensureSmartPricingSettingsTable();

  const { instructorUserId, settings } = params;
  const rows = await sql`
    INSERT INTO smart_pricing_settings (
      instructor_user_id,
      enabled,
      mode,
      trainer_hourly_value_cents,
      cost_per_km_cents,
      pass_through_rate,
      max_discount_pct,
      max_surcharge_pct,
      max_discount_cents,
      max_surcharge_cents,
      neutral_zone_pct,
      round_to_nearest_cents,
      hide_if_impact_above_cents,
      available_on_request_if_impact_above_cents,
      waste_factor,
      weights,
      thresholds,
      created_at,
      updated_at
    )
    VALUES (
      ${instructorUserId},
      ${settings.enabled},
      ${settings.mode},
      ${settings.trainerHourlyValueCents},
      ${settings.costPerKmCents},
      ${settings.passThroughRate},
      ${settings.maxDiscountPct},
      ${settings.maxSurchargePct},
      ${settings.maxDiscountCents ?? null},
      ${settings.maxSurchargeCents ?? null},
      ${settings.neutralZonePct},
      ${settings.roundToNearestCents},
      ${settings.hideIfImpactAboveCents},
      ${settings.availableOnRequestIfImpactAboveCents},
      ${settings.wasteFactor},
      ${toJsonLiteral(settings.weights)}::jsonb,
      ${toJsonLiteral(settings.thresholds)}::jsonb,
      now(),
      now()
    )
    ON CONFLICT (instructor_user_id)
    DO UPDATE SET
      enabled = EXCLUDED.enabled,
      mode = EXCLUDED.mode,
      trainer_hourly_value_cents = EXCLUDED.trainer_hourly_value_cents,
      cost_per_km_cents = EXCLUDED.cost_per_km_cents,
      pass_through_rate = EXCLUDED.pass_through_rate,
      max_discount_pct = EXCLUDED.max_discount_pct,
      max_surcharge_pct = EXCLUDED.max_surcharge_pct,
      max_discount_cents = EXCLUDED.max_discount_cents,
      max_surcharge_cents = EXCLUDED.max_surcharge_cents,
      neutral_zone_pct = EXCLUDED.neutral_zone_pct,
      round_to_nearest_cents = EXCLUDED.round_to_nearest_cents,
      hide_if_impact_above_cents = EXCLUDED.hide_if_impact_above_cents,
      available_on_request_if_impact_above_cents = EXCLUDED.available_on_request_if_impact_above_cents,
      waste_factor = EXCLUDED.waste_factor,
      weights = EXCLUDED.weights,
      thresholds = EXCLUDED.thresholds,
      updated_at = now()
    RETURNING
      instructor_user_id,
      enabled,
      mode,
      trainer_hourly_value_cents,
      cost_per_km_cents,
      pass_through_rate,
      max_discount_pct,
      max_surcharge_pct,
      max_discount_cents,
      max_surcharge_cents,
      neutral_zone_pct,
      round_to_nearest_cents,
      hide_if_impact_above_cents,
      available_on_request_if_impact_above_cents,
      waste_factor,
      weights,
      thresholds,
      created_at::text AS created_at,
      updated_at::text AS updated_at
  `;

  return rows[0] as SmartPricingSettingsRow;
}

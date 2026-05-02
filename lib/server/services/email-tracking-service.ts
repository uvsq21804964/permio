import { sql } from '@/lib/db';

export type EmailTrackingRow = {
  trackingId: string;
  recipientEmail: string | null;
  firstName: string | null;
  subject: string | null;
  campaignLabel: string | null;
  sentAt: string | null;
  openCount: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  firstOpenIp: string | null;
  lastOpenIp: string | null;
  lastUserAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailTrackingSummary = {
  totalTracked: number;
  totalOpened: number;
  totalPending: number;
  totalOpens: number;
  openRate: number;
};

type EmailTrackingDbRow = {
  trackingId: string;
  recipientEmail: string | null;
  firstName: string | null;
  subject: string | null;
  campaignLabel: string | null;
  sentAt: string | null;
  openCount: number | string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  firstOpenIp: string | null;
  lastOpenIp: string | null;
  lastUserAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

type EmailTrackingSummaryRow = {
  totalTracked: number | string | null;
  totalOpened: number | string | null;
  totalOpens: number | string | null;
};

let ensureEmailTrackingTablePromise: Promise<void> | null = null;

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function parseTrackingId(trackingId: string) {
  const trimmed = trackingId.trim();
  const lastDashIndex = trimmed.lastIndexOf('-');

  if (lastDashIndex <= 0 || lastDashIndex >= trimmed.length - 1) {
    return {
      trackingId: trimmed,
      recipientEmail: null,
      sentAtIso: null,
    };
  }

  const recipientEmail = trimmed.slice(0, lastDashIndex) || null;
  const timestampRaw = trimmed.slice(lastDashIndex + 1);
  const timestamp = Number(timestampRaw);
  const sentAtIso =
    Number.isFinite(timestamp) && timestamp > 0
      ? new Date(timestamp * 1000).toISOString()
      : null;

  return {
    trackingId: trimmed,
    recipientEmail,
    sentAtIso,
  };
}

function mapTrackingRow(row: EmailTrackingDbRow): EmailTrackingRow {
  return {
    trackingId: row.trackingId,
    recipientEmail: row.recipientEmail,
    firstName: row.firstName,
    subject: row.subject,
    campaignLabel: row.campaignLabel,
    sentAt: row.sentAt,
    openCount: toNumber(row.openCount),
    firstOpenedAt: row.firstOpenedAt,
    lastOpenedAt: row.lastOpenedAt,
    firstOpenIp: row.firstOpenIp,
    lastOpenIp: row.lastOpenIp,
    lastUserAgent: row.lastUserAgent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function ensureEmailTrackingTable() {
  if (!ensureEmailTrackingTablePromise) {
    ensureEmailTrackingTablePromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS email_tracking (
          tracking_id text PRIMARY KEY,
          recipient_email text,
          first_name text,
          subject text,
          campaign_label text,
          sent_at timestamptz,
          open_count integer NOT NULL DEFAULT 0,
          first_opened_at timestamptz,
          last_opened_at timestamptz,
          first_open_ip text,
          last_open_ip text,
          last_user_agent text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS email_tracking_sent_at_idx
          ON email_tracking (sent_at DESC NULLS LAST, created_at DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS email_tracking_last_opened_idx
          ON email_tracking (last_opened_at DESC NULLS LAST)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS email_tracking_recipient_idx
          ON email_tracking (recipient_email)
      `;
    })().catch((error) => {
      ensureEmailTrackingTablePromise = null;
      throw error;
    });
  }

  await ensureEmailTrackingTablePromise;
}

export async function registerTrackedEmail(params: {
  trackingId: string;
  recipientEmail?: string | null;
  firstName?: string | null;
  subject?: string | null;
  campaignLabel?: string | null;
  sentAtIso?: string | null;
}) {
  await ensureEmailTrackingTable();

  const parsed = parseTrackingId(params.trackingId);
  const trackingId = parsed.trackingId;
  const recipientEmail = params.recipientEmail?.trim() || parsed.recipientEmail;
  const firstName = params.firstName?.trim() || null;
  const subject = params.subject?.trim() || null;
  const campaignLabel = params.campaignLabel?.trim() || null;
  const sentAtIso = params.sentAtIso || parsed.sentAtIso;

  const rows = await sql`
    INSERT INTO email_tracking (
      tracking_id,
      recipient_email,
      first_name,
      subject,
      campaign_label,
      sent_at,
      created_at,
      updated_at
    )
    VALUES (
      ${trackingId},
      ${recipientEmail},
      ${firstName},
      ${subject},
      ${campaignLabel},
      ${sentAtIso},
      now(),
      now()
    )
    ON CONFLICT (tracking_id)
    DO UPDATE SET
      recipient_email = COALESCE(email_tracking.recipient_email, EXCLUDED.recipient_email),
      first_name = COALESCE(email_tracking.first_name, EXCLUDED.first_name),
      subject = COALESCE(email_tracking.subject, EXCLUDED.subject),
      campaign_label = COALESCE(email_tracking.campaign_label, EXCLUDED.campaign_label),
      sent_at = COALESCE(email_tracking.sent_at, EXCLUDED.sent_at),
      updated_at = now()
    RETURNING
      tracking_id AS "trackingId",
      recipient_email AS "recipientEmail",
      first_name AS "firstName",
      subject,
      campaign_label AS "campaignLabel",
      sent_at::text AS "sentAt",
      open_count AS "openCount",
      first_opened_at::text AS "firstOpenedAt",
      last_opened_at::text AS "lastOpenedAt",
      first_open_ip AS "firstOpenIp",
      last_open_ip AS "lastOpenIp",
      last_user_agent AS "lastUserAgent",
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
  `;

  return mapTrackingRow(rows[0] as EmailTrackingDbRow);
}

export async function recordTrackedEmailOpen(params: {
  trackingId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await ensureEmailTrackingTable();

  const parsed = parseTrackingId(params.trackingId);
  const trackingId = parsed.trackingId;
  const recipientEmail = parsed.recipientEmail;
  const sentAtIso = parsed.sentAtIso;
  const ipAddress = params.ipAddress?.trim() || null;
  const userAgent = params.userAgent?.trim() || null;

  const rows = await sql`
    INSERT INTO email_tracking (
      tracking_id,
      recipient_email,
      sent_at,
      open_count,
      first_opened_at,
      last_opened_at,
      first_open_ip,
      last_open_ip,
      last_user_agent,
      created_at,
      updated_at
    )
    VALUES (
      ${trackingId},
      ${recipientEmail},
      ${sentAtIso},
      1,
      now(),
      now(),
      ${ipAddress},
      ${ipAddress},
      ${userAgent},
      now(),
      now()
    )
    ON CONFLICT (tracking_id)
    DO UPDATE SET
      recipient_email = COALESCE(email_tracking.recipient_email, EXCLUDED.recipient_email),
      sent_at = COALESCE(email_tracking.sent_at, EXCLUDED.sent_at),
      open_count = email_tracking.open_count + 1,
      first_opened_at = COALESCE(email_tracking.first_opened_at, now()),
      last_opened_at = now(),
      first_open_ip = COALESCE(email_tracking.first_open_ip, EXCLUDED.first_open_ip),
      last_open_ip = EXCLUDED.last_open_ip,
      last_user_agent = EXCLUDED.last_user_agent,
      updated_at = now()
    RETURNING
      tracking_id AS "trackingId",
      recipient_email AS "recipientEmail",
      first_name AS "firstName",
      subject,
      campaign_label AS "campaignLabel",
      sent_at::text AS "sentAt",
      open_count AS "openCount",
      first_opened_at::text AS "firstOpenedAt",
      last_opened_at::text AS "lastOpenedAt",
      first_open_ip AS "firstOpenIp",
      last_open_ip AS "lastOpenIp",
      last_user_agent AS "lastUserAgent",
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
  `;

  return mapTrackingRow(rows[0] as EmailTrackingDbRow);
}

export async function getEmailTrackingDashboard() {
  await ensureEmailTrackingTable();

  const [summaryRows, trackingRows] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS "totalTracked",
        COUNT(*) FILTER (WHERE open_count > 0)::int AS "totalOpened",
        COALESCE(SUM(open_count), 0)::int AS "totalOpens"
      FROM email_tracking
    `,
    sql`
      SELECT
        tracking_id AS "trackingId",
        recipient_email AS "recipientEmail",
        first_name AS "firstName",
        subject,
        campaign_label AS "campaignLabel",
        sent_at::text AS "sentAt",
        open_count AS "openCount",
        first_opened_at::text AS "firstOpenedAt",
        last_opened_at::text AS "lastOpenedAt",
        first_open_ip AS "firstOpenIp",
        last_open_ip AS "lastOpenIp",
        last_user_agent AS "lastUserAgent",
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt"
      FROM email_tracking
      ORDER BY
        COALESCE(sent_at, created_at) DESC,
        created_at DESC
      LIMIT 250
    `,
  ]);

  const summaryRow = (summaryRows[0] as EmailTrackingSummaryRow | undefined) ?? {
    totalTracked: 0,
    totalOpened: 0,
    totalOpens: 0,
  };

  const totalTracked = toNumber(summaryRow.totalTracked);
  const totalOpened = toNumber(summaryRow.totalOpened);
  const totalOpens = toNumber(summaryRow.totalOpens);
  const totalPending = Math.max(totalTracked - totalOpened, 0);

  const summary: EmailTrackingSummary = {
    totalTracked,
    totalOpened,
    totalPending,
    totalOpens,
    openRate: totalTracked > 0 ? Math.round((totalOpened / totalTracked) * 100) : 0,
  };

  return {
    summary,
    rows: trackingRows.map((row) => mapTrackingRow(row as EmailTrackingDbRow)),
  };
}

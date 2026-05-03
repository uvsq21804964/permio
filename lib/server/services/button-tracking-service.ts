import { clerkClient } from '@clerk/nextjs/server';

import { sql } from '@/lib/db';

export type ButtonTrackingEventRow = {
  id: string;
  buttonKey: string;
  buttonLabel: string | null;
  buttonContext: string | null;
  durationMs: number | null;
  eventType: ButtonTrackingEventType;
  pagePath: string | null;
  targetHref: string | null;
  locale: string | null;
  metadataJson: string | null;
  referrer: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type ButtonTrackingEventType = 'button_click' | 'page_view' | 'page_leave';

export type ButtonTrackingSummary = {
  totalClicks: number;
  uniqueButtons: number;
  uniquePages: number;
  uniqueUsers: number;
  authenticatedClicks: number;
  anonymousClicks: number;
  clicksLast24Hours: number;
  clicksLast7Days: number;
};

export type ButtonTrackingTopButtonRow = {
  buttonKey: string;
  buttonLabel: string | null;
  buttonContext: string | null;
  totalClicks: number;
  uniqueVisitors: number;
  lastClickedAt: string | null;
};

export type ButtonTrackingTopPageRow = {
  pagePath: string;
  totalClicks: number;
  uniqueButtons: number;
  uniqueVisitors: number;
  lastClickedAt: string | null;
};

export type ButtonTrackingTopUserRow = {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  totalClicks: number;
  uniqueButtons: number;
  lastClickedAt: string | null;
};

export type ButtonTrackingUserJourneyStep = {
  id: string;
  buttonKey: string;
  buttonLabel: string | null;
  durationMs: number | null;
  eventType: ButtonTrackingEventType;
  pagePath: string | null;
  targetHref: string | null;
  createdAt: string;
};

export type ButtonTrackingUserOption = {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  totalEvents: number;
  lastSeenAt: string | null;
};

type ButtonTrackingDbRow = {
  id: string;
  buttonKey: string;
  buttonLabel: string | null;
  buttonContext: string | null;
  durationMs: number | string | null;
  eventType: ButtonTrackingEventType | null;
  pagePath: string | null;
  targetHref: string | null;
  locale: string | null;
  metadataJson: string | null;
  referrer: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  sessionId: string | null;
  isAuthenticated: boolean | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type ButtonTrackingSummaryRow = {
  totalClicks: number | string | null;
  uniqueButtons: number | string | null;
  uniquePages: number | string | null;
  uniqueUsers: number | string | null;
  authenticatedClicks: number | string | null;
  anonymousClicks: number | string | null;
  clicksLast24Hours: number | string | null;
  clicksLast7Days: number | string | null;
};

type LocalUserDbRow = {
  name: string | null;
  role: string | null;
};

let ensureButtonTrackingTablePromise: Promise<void> | null = null;

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

function normalizeText(value: string | null | undefined, maxLength = 255) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() || null;
  return normalized || null;
}

function serializeMetadata(value: Record<string, unknown> | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.stringify(value).slice(0, 4000);
  } catch {
    return null;
  }
}

function normalizeEventType(value: string | null | undefined): ButtonTrackingEventType {
  return value === 'page_view' || value === 'page_leave' ? value : 'button_click';
}

function normalizeDurationMs(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(Math.round(value), 0);
}

function mapEventRow(row: ButtonTrackingDbRow): ButtonTrackingEventRow {
  return {
    id: row.id,
    buttonKey: row.buttonKey,
    buttonLabel: row.buttonLabel,
    buttonContext: row.buttonContext,
    durationMs: row.durationMs == null ? null : toNumber(row.durationMs),
    eventType: row.eventType ?? 'button_click',
    pagePath: row.pagePath,
    targetHref: row.targetHref,
    locale: row.locale,
    metadataJson: row.metadataJson,
    referrer: row.referrer,
    userId: row.userId,
    userEmail: row.userEmail,
    userName: row.userName,
    userRole: row.userRole,
    sessionId: row.sessionId,
    isAuthenticated: Boolean(row.isAuthenticated),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };
}

async function getClerk() {
  const anyClient = clerkClient as unknown as (() => Promise<any>) | any;
  return typeof anyClient === 'function' ? anyClient() : anyClient;
}

async function loadTrackedUserSnapshot(userId: string) {
  const localUserRows = (await sql`
    SELECT
      name,
      role
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `) as LocalUserDbRow[];

  let userEmail: string | null = null;
  let userName = localUserRows[0]?.name ?? null;

  try {
    const clerk = await getClerk();
    const user = (await clerk.users.getUser(userId)) as {
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      primaryEmailAddress?: { emailAddress?: string | null } | null;
      emailAddresses?: Array<{ emailAddress?: string | null }>;
    };

    userEmail = normalizeEmail(
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null,
    );

    userName =
      normalizeText(
        user.fullName ||
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          localUserRows[0]?.name,
        255,
      ) ?? userName;
  } catch (error) {
    console.error('[button-tracking] failed to load Clerk user snapshot', error);
  }

  return {
    userEmail,
    userName,
    userRole: normalizeText(localUserRows[0]?.role ?? null, 100),
  };
}

async function ensureButtonTrackingTable() {
  if (!ensureButtonTrackingTablePromise) {
    ensureButtonTrackingTablePromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS button_tracking_events (
          id text PRIMARY KEY,
          button_key text NOT NULL,
          button_label text,
          button_context text,
          duration_ms integer,
          event_type text NOT NULL DEFAULT 'button_click',
          page_path text,
          target_href text,
          locale text,
          metadata_json text,
          referrer text,
          user_id text,
          user_email text,
          user_name text,
          user_role text,
          session_id text,
          is_authenticated boolean NOT NULL DEFAULT false,
          ip_address text,
          user_agent text,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await sql`
        ALTER TABLE IF EXISTS button_tracking_events
        ADD COLUMN IF NOT EXISTS duration_ms integer
      `;

      await sql`
        ALTER TABLE IF EXISTS button_tracking_events
        ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'button_click'
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS button_tracking_events_created_at_idx
          ON button_tracking_events (created_at DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS button_tracking_events_button_key_idx
          ON button_tracking_events (button_key)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS button_tracking_events_page_path_idx
          ON button_tracking_events (page_path)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS button_tracking_events_user_id_idx
          ON button_tracking_events (user_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS button_tracking_events_event_type_idx
          ON button_tracking_events (event_type)
      `;
    })().catch((error) => {
      ensureButtonTrackingTablePromise = null;
      throw error;
    });
  }

  await ensureButtonTrackingTablePromise;
}

export async function recordTrackedButtonClick(params: {
  buttonKey: string;
  buttonLabel?: string | null;
  buttonContext?: string | null;
  durationMs?: number | null;
  eventType?: ButtonTrackingEventType | null;
  pagePath?: string | null;
  targetHref?: string | null;
  locale?: string | null;
  metadata?: Record<string, unknown> | null;
  referrer?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await ensureButtonTrackingTable();

  const buttonKey = normalizeText(params.buttonKey, 160);
  if (!buttonKey) {
    throw new Error('BUTTON_KEY_REQUIRED');
  }

  const buttonLabel = normalizeText(params.buttonLabel, 255);
  const buttonContext = normalizeText(params.buttonContext, 255);
  const durationMs = normalizeDurationMs(params.durationMs);
  const eventType = normalizeEventType(params.eventType);
  const pagePath = normalizeText(params.pagePath, 500);
  const targetHref = normalizeText(params.targetHref, 1000);
  const locale = normalizeText(params.locale, 20);
  const referrer = normalizeText(params.referrer, 1000);
  const ipAddress = normalizeText(params.ipAddress, 120);
  const userAgent = normalizeText(params.userAgent, 1000);
  const metadataJson = serializeMetadata(params.metadata);
  const userId = normalizeText(params.userId, 255);
  const sessionId = normalizeText(params.sessionId, 255);
  const isAuthenticated = Boolean(userId);

  const userSnapshot = userId
    ? await loadTrackedUserSnapshot(userId)
    : { userEmail: null, userName: null, userRole: null };

  const rows = (await sql`
    INSERT INTO button_tracking_events (
      id,
      button_key,
      button_label,
      button_context,
      duration_ms,
      event_type,
      page_path,
      target_href,
      locale,
      metadata_json,
      referrer,
      user_id,
      user_email,
      user_name,
      user_role,
      session_id,
      is_authenticated,
      ip_address,
      user_agent,
      created_at
    )
    VALUES (
      ${crypto.randomUUID()},
      ${buttonKey},
      ${buttonLabel},
      ${buttonContext},
      ${durationMs},
      ${eventType},
      ${pagePath},
      ${targetHref},
      ${locale},
      ${metadataJson},
      ${referrer},
      ${userId},
      ${userSnapshot.userEmail},
      ${userSnapshot.userName},
      ${userSnapshot.userRole},
      ${sessionId},
      ${isAuthenticated},
      ${ipAddress},
      ${userAgent},
      now()
    )
    RETURNING
      id,
      button_key AS "buttonKey",
      button_label AS "buttonLabel",
      button_context AS "buttonContext",
      duration_ms AS "durationMs",
      event_type AS "eventType",
      page_path AS "pagePath",
      target_href AS "targetHref",
      locale,
      metadata_json AS "metadataJson",
      referrer,
      user_id AS "userId",
      user_email AS "userEmail",
      user_name AS "userName",
      user_role AS "userRole",
      session_id AS "sessionId",
      is_authenticated AS "isAuthenticated",
      ip_address AS "ipAddress",
      user_agent AS "userAgent",
      created_at::text AS "createdAt"
  `) as ButtonTrackingDbRow[];

  return mapEventRow(rows[0]);
}

export async function getButtonTrackingDashboard() {
  await ensureButtonTrackingTable();

  const [summaryRows, topButtonRows, topPageRows, topUserRows, userOptionRows, recentRows] =
    await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'button_click')::int AS "totalClicks",
          COUNT(DISTINCT button_key) FILTER (WHERE event_type = 'button_click')::int AS "uniqueButtons",
          COUNT(DISTINCT page_path)::int AS "uniquePages",
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS "uniqueUsers",
          COUNT(*) FILTER (WHERE is_authenticated AND event_type = 'button_click')::int AS "authenticatedClicks",
          COUNT(*) FILTER (WHERE NOT is_authenticated AND event_type = 'button_click')::int AS "anonymousClicks",
          COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours' AND event_type = 'button_click')::int AS "clicksLast24Hours",
          COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days' AND event_type = 'button_click')::int AS "clicksLast7Days"
        FROM button_tracking_events
      `,
      sql`
        SELECT
          button_key AS "buttonKey",
          MAX(button_label) AS "buttonLabel",
          MAX(button_context) AS "buttonContext",
          COUNT(*)::int AS "totalClicks",
          COUNT(DISTINCT COALESCE(user_id, session_id, ip_address, id))::int AS "uniqueVisitors",
          MAX(created_at)::text AS "lastClickedAt"
        FROM button_tracking_events
        WHERE event_type = 'button_click'
        GROUP BY button_key
        ORDER BY COUNT(*) DESC, MAX(created_at) DESC
        LIMIT 20
      `,
      sql`
        SELECT
          COALESCE(page_path, '(unknown)') AS "pagePath",
          COUNT(*) FILTER (WHERE event_type = 'button_click')::int AS "totalClicks",
          COUNT(DISTINCT button_key) FILTER (WHERE event_type = 'button_click')::int AS "uniqueButtons",
          COUNT(DISTINCT COALESCE(user_id, session_id, ip_address, id))::int AS "uniqueVisitors",
          MAX(created_at)::text AS "lastClickedAt"
        FROM button_tracking_events
        GROUP BY COALESCE(page_path, '(unknown)')
        ORDER BY COUNT(*) DESC, MAX(created_at) DESC
        LIMIT 20
      `,
      sql`
        SELECT
          user_id AS "userId",
          MAX(user_email) AS "userEmail",
          MAX(user_name) AS "userName",
          MAX(user_role) AS "userRole",
          COUNT(*) FILTER (WHERE event_type = 'button_click')::int AS "totalClicks",
          COUNT(DISTINCT button_key) FILTER (WHERE event_type = 'button_click')::int AS "uniqueButtons",
          MAX(created_at)::text AS "lastClickedAt"
        FROM button_tracking_events
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        ORDER BY COUNT(*) DESC, MAX(created_at) DESC
        LIMIT 20
      `,
      sql`
        SELECT
          user_id AS "userId",
          MAX(user_email) AS "userEmail",
          MAX(user_name) AS "userName",
          MAX(user_role) AS "userRole",
          COUNT(*)::int AS "totalEvents",
          MAX(created_at)::text AS "lastSeenAt"
        FROM button_tracking_events
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        ORDER BY MAX(created_at) DESC
        LIMIT 100
      `,
      sql`
        SELECT
          id,
          button_key AS "buttonKey",
          button_label AS "buttonLabel",
          button_context AS "buttonContext",
          duration_ms AS "durationMs",
          event_type AS "eventType",
          page_path AS "pagePath",
          target_href AS "targetHref",
          locale,
          metadata_json AS "metadataJson",
          referrer,
          user_id AS "userId",
          user_email AS "userEmail",
          user_name AS "userName",
          user_role AS "userRole",
          session_id AS "sessionId",
          is_authenticated AS "isAuthenticated",
          ip_address AS "ipAddress",
          user_agent AS "userAgent",
          created_at::text AS "createdAt"
        FROM button_tracking_events
        ORDER BY created_at DESC
        LIMIT 200
      `,
    ]);

  const summaryRow = (summaryRows[0] as ButtonTrackingSummaryRow | undefined) ?? {
    totalClicks: 0,
    uniqueButtons: 0,
    uniquePages: 0,
    uniqueUsers: 0,
    authenticatedClicks: 0,
    anonymousClicks: 0,
    clicksLast24Hours: 0,
    clicksLast7Days: 0,
  };

  const summary: ButtonTrackingSummary = {
    totalClicks: toNumber(summaryRow.totalClicks),
    uniqueButtons: toNumber(summaryRow.uniqueButtons),
    uniquePages: toNumber(summaryRow.uniquePages),
    uniqueUsers: toNumber(summaryRow.uniqueUsers),
    authenticatedClicks: toNumber(summaryRow.authenticatedClicks),
    anonymousClicks: toNumber(summaryRow.anonymousClicks),
    clicksLast24Hours: toNumber(summaryRow.clicksLast24Hours),
    clicksLast7Days: toNumber(summaryRow.clicksLast7Days),
  };

  return {
    summary,
    topButtons: topButtonRows as ButtonTrackingTopButtonRow[],
    topPages: topPageRows as ButtonTrackingTopPageRow[],
    topUsers: topUserRows as ButtonTrackingTopUserRow[],
    userOptions: userOptionRows as ButtonTrackingUserOption[],
    recentEvents: (recentRows as ButtonTrackingDbRow[]).map((row) => mapEventRow(row)),
  };
}

export async function getButtonTrackingUserJourney(userId: string) {
  await ensureButtonTrackingTable();

  const normalizedUserId = normalizeText(userId, 255);
  if (!normalizedUserId) {
    return [];
  }

  const rows = (await sql`
    SELECT
      id,
      button_key AS "buttonKey",
      button_label AS "buttonLabel",
      button_context AS "buttonContext",
      duration_ms AS "durationMs",
      event_type AS "eventType",
      page_path AS "pagePath",
      target_href AS "targetHref",
      locale,
      metadata_json AS "metadataJson",
      referrer,
      user_id AS "userId",
      user_email AS "userEmail",
      user_name AS "userName",
      user_role AS "userRole",
      session_id AS "sessionId",
      is_authenticated AS "isAuthenticated",
      ip_address AS "ipAddress",
      user_agent AS "userAgent",
      created_at::text AS "createdAt"
    FROM button_tracking_events
    WHERE user_id = ${normalizedUserId}
    ORDER BY created_at ASC
    LIMIT 1000
  `) as ButtonTrackingDbRow[];

  return rows.map((row): ButtonTrackingUserJourneyStep => ({
    id: row.id,
    buttonKey: row.buttonKey,
    buttonLabel: row.buttonLabel,
    durationMs: row.durationMs == null ? null : toNumber(row.durationMs),
    eventType: row.eventType ?? 'button_click',
    pagePath: row.pagePath,
    targetHref: row.targetHref,
    createdAt: row.createdAt,
  }));
}

export async function deleteAllButtonTrackingData() {
  await ensureButtonTrackingTable();

  await sql`
    DELETE FROM button_tracking_events
  `;
}

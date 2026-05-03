import { clerkClient } from '@clerk/nextjs/server';

import { sql } from '@/lib/db';

export type EmailTrackingRow = {
  trackingId: string;
  recipientEmail: string | null;
  firstName: string | null;
  subject: string | null;
  campaignLabel: string | null;
  sentAt: string | null;
  openCount: number;
  clickCount: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  lastClickedUrl: string | null;
  firstOpenIp: string | null;
  lastOpenIp: string | null;
  lastUserAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailTrackingRecipientInsight = {
  recipientEmail: string;
  displayName: string | null;
  accountCreatedAt: string | null;
  firstTrackedAt: string | null;
  lastTrackedAt: string | null;
  totalEmailsSent: number;
  totalRemindersSent: number;
  totalOpens: number;
  openedEmails: number;
  emailsBeforeAccountCreation: number;
  reminderCountBeforeAccountCreation: number;
  emailsAfterAccountCreation: number;
  unnecessaryReminderCount: number;
  convertedAfterFirstEmail: boolean;
  convertedAfterReminder: boolean;
  alreadyHadAccountBeforeFirstEmail: boolean;
  hasAccount: boolean;
};

export type EmailTrackingSummary = {
  totalTracked: number;
  totalOpened: number;
  totalPending: number;
  totalOpens: number;
  openRate: number;
  totalClicked: number;
  totalClicks: number;
  clickRate: number;
  totalRecipients: number;
  recipientsWithAccount: number;
  recipientsCreatedAfterFirstEmail: number;
  recipientsCreatedAfterReminder: number;
  recipientsAlreadyHadAccount: number;
  unnecessaryReminderEmails: number;
  recipientsWithUnnecessaryReminders: number;
  averageEmailsBeforeAccountCreation: number;
};

type EmailTrackingDbRow = {
  trackingId: string;
  recipientEmail: string | null;
  firstName: string | null;
  subject: string | null;
  campaignLabel: string | null;
  sentAt: string | null;
  openCount: number | string | null;
  clickCount: number | string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  lastClickedUrl: string | null;
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
  totalClicked: number | string | null;
  totalClicks: number | string | null;
};

type LocalUserDbRow = {
  id: string;
  name: string | null;
  role: string | null;
  createdAt: string;
};

type LocalUserWithEmail = LocalUserDbRow & {
  email: string | null;
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

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() || null;
  return normalized || null;
}

function getTrackedAt(row: Pick<EmailTrackingRow, 'sentAt' | 'createdAt'>) {
  return row.sentAt || row.createdAt;
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
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
    clickCount: toNumber(row.clickCount),
    firstOpenedAt: row.firstOpenedAt,
    lastOpenedAt: row.lastOpenedAt,
    firstClickedAt: row.firstClickedAt,
    lastClickedAt: row.lastClickedAt,
    lastClickedUrl: row.lastClickedUrl,
    firstOpenIp: row.firstOpenIp,
    lastOpenIp: row.lastOpenIp,
    lastUserAgent: row.lastUserAgent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getClerk() {
  const anyClient = clerkClient as unknown as (() => Promise<any>) | any;
  return typeof anyClient === 'function' ? anyClient() : anyClient;
}

async function listLocalUsersWithEmails() {
  const userRows = (await sql`
    SELECT
      id,
      name,
      role,
      "createdAt"::text AS "createdAt"
    FROM "User"
    ORDER BY "createdAt" ASC NULLS LAST, id ASC
  `) as LocalUserDbRow[];

  const clerkUserIds = userRows.map((row) => row.id).filter(Boolean);
  if (clerkUserIds.length === 0) {
    return [] as LocalUserWithEmail[];
  }

  const emailByUserId: Record<string, string | null> = {};

  try {
    const clerk = await getClerk();

    for (let index = 0; index < clerkUserIds.length; index += 100) {
      const chunk = clerkUserIds.slice(index, index + 100);
      const response = await clerk.users.getUserList({
        userId: chunk,
        limit: chunk.length,
      });

      for (const user of response.data as Array<{
        id: string;
        primaryEmailAddressId?: string | null;
        emailAddresses: Array<{ id: string; emailAddress: string }>;
      }>) {
        const primaryEmail =
          user.emailAddresses.find(
            (entry) => entry.id === user.primaryEmailAddressId,
          )?.emailAddress ??
          user.emailAddresses[0]?.emailAddress ??
          null;

        emailByUserId[user.id] = normalizeEmail(primaryEmail);
      }
    }
  } catch (error) {
    console.error('[email-tracking] failed to load Clerk emails', error);
  }

  return userRows.map((row) => ({
    ...row,
    email: emailByUserId[row.id] ?? null,
  }));
}

function buildRecipientInsights(rows: EmailTrackingRow[], users: LocalUserWithEmail[]) {
  const usersByEmail = new Map<string, LocalUserWithEmail>();

  for (const user of users) {
    const email = normalizeEmail(user.email);
    if (!email) {
      continue;
    }

    const existing = usersByEmail.get(email);
    const userCreatedAt = toTimestamp(user.createdAt);
    const existingCreatedAt = toTimestamp(existing?.createdAt ?? null);

    if (!existing || (userCreatedAt ?? Infinity) < (existingCreatedAt ?? Infinity)) {
      usersByEmail.set(email, user);
    }
  }

  const rowsByRecipient = new Map<string, EmailTrackingRow[]>();

  for (const row of rows) {
    const recipientEmail = normalizeEmail(row.recipientEmail);
    if (!recipientEmail) {
      continue;
    }

    const bucket = rowsByRecipient.get(recipientEmail);
    if (bucket) {
      bucket.push(row);
    } else {
      rowsByRecipient.set(recipientEmail, [row]);
    }
  }

  const recipientInsights: EmailTrackingRecipientInsight[] = [];

  for (const [recipientEmail, recipientRows] of rowsByRecipient.entries()) {
    const sortedRows = [...recipientRows].sort((left, right) => {
      const leftTimestamp = toTimestamp(getTrackedAt(left)) ?? 0;
      const rightTimestamp = toTimestamp(getTrackedAt(right)) ?? 0;
      return leftTimestamp - rightTimestamp;
    });

    const matchedUser = usersByEmail.get(recipientEmail);
    const accountCreatedAt = matchedUser?.createdAt ?? null;
    const accountCreatedTimestamp = toTimestamp(accountCreatedAt);
    const firstTrackedAt = getTrackedAt(sortedRows[0]) ?? null;
    const firstTrackedTimestamp = toTimestamp(firstTrackedAt);
    const lastTrackedAt = getTrackedAt(sortedRows[sortedRows.length - 1]) ?? null;

    let emailsBeforeAccountCreation = 0;
    let emailsAfterAccountCreation = 0;
    let unnecessaryReminderCount = 0;

    for (let index = 0; index < sortedRows.length; index += 1) {
      const trackedAt = getTrackedAt(sortedRows[index]);
      const trackedTimestamp = toTimestamp(trackedAt);
      const sentAfterAccountCreation =
        accountCreatedTimestamp !== null &&
        trackedTimestamp !== null &&
        trackedTimestamp >= accountCreatedTimestamp;

      if (sentAfterAccountCreation) {
        emailsAfterAccountCreation += 1;

        if (index > 0) {
          unnecessaryReminderCount += 1;
        }
      } else if (accountCreatedTimestamp !== null) {
        emailsBeforeAccountCreation += 1;
      }
    }

    if (accountCreatedTimestamp === null) {
      emailsBeforeAccountCreation = 0;
      emailsAfterAccountCreation = 0;
      unnecessaryReminderCount = 0;
    }

    const totalEmailsSent = sortedRows.length;
    const totalRemindersSent = Math.max(totalEmailsSent - 1, 0);
    const totalOpens = sortedRows.reduce((sum, row) => sum + row.openCount, 0);
    const openedEmails = sortedRows.filter((row) => row.openCount > 0).length;
    const reminderCountBeforeAccountCreation =
      accountCreatedTimestamp === null
        ? 0
        : Math.max(emailsBeforeAccountCreation - 1, 0);

    recipientInsights.push({
      recipientEmail,
      displayName:
        sortedRows.find((row) => row.firstName?.trim())?.firstName?.trim() ??
        matchedUser?.name ??
        null,
      accountCreatedAt,
      firstTrackedAt,
      lastTrackedAt,
      totalEmailsSent,
      totalRemindersSent,
      totalOpens,
      openedEmails,
      emailsBeforeAccountCreation,
      reminderCountBeforeAccountCreation,
      emailsAfterAccountCreation,
      unnecessaryReminderCount,
      convertedAfterFirstEmail:
        accountCreatedTimestamp !== null && emailsBeforeAccountCreation >= 1,
      convertedAfterReminder:
        accountCreatedTimestamp !== null && reminderCountBeforeAccountCreation >= 1,
      alreadyHadAccountBeforeFirstEmail:
        accountCreatedTimestamp !== null &&
        firstTrackedTimestamp !== null &&
        accountCreatedTimestamp <= firstTrackedTimestamp,
      hasAccount: accountCreatedTimestamp !== null,
    });
  }

  recipientInsights.sort((left, right) => {
    if (right.unnecessaryReminderCount !== left.unnecessaryReminderCount) {
      return right.unnecessaryReminderCount - left.unnecessaryReminderCount;
    }

    if (right.reminderCountBeforeAccountCreation !== left.reminderCountBeforeAccountCreation) {
      return right.reminderCountBeforeAccountCreation - left.reminderCountBeforeAccountCreation;
    }

    return (toTimestamp(right.lastTrackedAt) ?? 0) - (toTimestamp(left.lastTrackedAt) ?? 0);
  });

  return recipientInsights;
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
          click_count integer NOT NULL DEFAULT 0,
          first_opened_at timestamptz,
          last_opened_at timestamptz,
          first_clicked_at timestamptz,
          last_clicked_at timestamptz,
          last_clicked_url text,
          first_open_ip text,
          last_open_ip text,
          last_user_agent text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await sql`
        ALTER TABLE IF EXISTS email_tracking
        ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0
      `;

      await sql`
        ALTER TABLE IF EXISTS email_tracking
        ADD COLUMN IF NOT EXISTS first_clicked_at timestamptz
      `;

      await sql`
        ALTER TABLE IF EXISTS email_tracking
        ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz
      `;

      await sql`
        ALTER TABLE IF EXISTS email_tracking
        ADD COLUMN IF NOT EXISTS last_clicked_url text
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
        CREATE INDEX IF NOT EXISTS email_tracking_last_clicked_idx
          ON email_tracking (last_clicked_at DESC NULLS LAST)
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
      click_count AS "clickCount",
      first_opened_at::text AS "firstOpenedAt",
      last_opened_at::text AS "lastOpenedAt",
      first_clicked_at::text AS "firstClickedAt",
      last_clicked_at::text AS "lastClickedAt",
      last_clicked_url AS "lastClickedUrl",
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
      click_count AS "clickCount",
      first_opened_at::text AS "firstOpenedAt",
      last_opened_at::text AS "lastOpenedAt",
      first_clicked_at::text AS "firstClickedAt",
      last_clicked_at::text AS "lastClickedAt",
      last_clicked_url AS "lastClickedUrl",
      first_open_ip AS "firstOpenIp",
      last_open_ip AS "lastOpenIp",
      last_user_agent AS "lastUserAgent",
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
  `;

  return mapTrackingRow(rows[0] as EmailTrackingDbRow);
}

export async function recordTrackedEmailClick(params: {
  trackingId: string;
  targetUrl?: string | null;
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
  const targetUrl = params.targetUrl?.trim() || null;

  const rows = await sql`
    INSERT INTO email_tracking (
      tracking_id,
      recipient_email,
      sent_at,
      click_count,
      first_clicked_at,
      last_clicked_at,
      last_clicked_url,
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
      ${targetUrl},
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
      click_count = email_tracking.click_count + 1,
      first_clicked_at = COALESCE(email_tracking.first_clicked_at, now()),
      last_clicked_at = now(),
      last_clicked_url = EXCLUDED.last_clicked_url,
      last_open_ip = COALESCE(EXCLUDED.last_open_ip, email_tracking.last_open_ip),
      last_user_agent = COALESCE(EXCLUDED.last_user_agent, email_tracking.last_user_agent),
      updated_at = now()
    RETURNING
      tracking_id AS "trackingId",
      recipient_email AS "recipientEmail",
      first_name AS "firstName",
      subject,
      campaign_label AS "campaignLabel",
      sent_at::text AS "sentAt",
      open_count AS "openCount",
      click_count AS "clickCount",
      first_opened_at::text AS "firstOpenedAt",
      last_opened_at::text AS "lastOpenedAt",
      first_clicked_at::text AS "firstClickedAt",
      last_clicked_at::text AS "lastClickedAt",
      last_clicked_url AS "lastClickedUrl",
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

  const [summaryRows, trackingRows, localUsers] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS "totalTracked",
        COUNT(*) FILTER (WHERE open_count > 0)::int AS "totalOpened",
        COALESCE(SUM(open_count), 0)::int AS "totalOpens",
        COUNT(*) FILTER (WHERE click_count > 0)::int AS "totalClicked",
        COALESCE(SUM(click_count), 0)::int AS "totalClicks"
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
        click_count AS "clickCount",
        first_opened_at::text AS "firstOpenedAt",
        last_opened_at::text AS "lastOpenedAt",
        first_clicked_at::text AS "firstClickedAt",
        last_clicked_at::text AS "lastClickedAt",
        last_clicked_url AS "lastClickedUrl",
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
    listLocalUsersWithEmails(),
  ]);

  const mappedRows = trackingRows.map((row) => mapTrackingRow(row as EmailTrackingDbRow));
  const recipientInsights = buildRecipientInsights(mappedRows, localUsers);

  const summaryRow = (summaryRows[0] as EmailTrackingSummaryRow | undefined) ?? {
    totalTracked: 0,
    totalOpened: 0,
    totalOpens: 0,
    totalClicked: 0,
    totalClicks: 0,
  };

  const totalTracked = toNumber(summaryRow.totalTracked);
  const totalOpened = toNumber(summaryRow.totalOpened);
  const totalOpens = toNumber(summaryRow.totalOpens);
  const totalClicked = toNumber(summaryRow.totalClicked);
  const totalClicks = toNumber(summaryRow.totalClicks);
  const totalPending = Math.max(totalTracked - totalOpened, 0);
  const recipientsWithAccount = recipientInsights.filter((row) => row.hasAccount).length;
  const recipientsCreatedAfterFirstEmail = recipientInsights.filter(
    (row) => row.convertedAfterFirstEmail,
  ).length;
  const recipientsCreatedAfterReminder = recipientInsights.filter(
    (row) => row.convertedAfterReminder,
  ).length;
  const recipientsAlreadyHadAccount = recipientInsights.filter(
    (row) => row.alreadyHadAccountBeforeFirstEmail,
  ).length;
  const unnecessaryReminderEmails = recipientInsights.reduce(
    (sum, row) => sum + row.unnecessaryReminderCount,
    0,
  );
  const recipientsWithUnnecessaryReminders = recipientInsights.filter(
    (row) => row.unnecessaryReminderCount > 0,
  ).length;

  const convertedRecipientRows = recipientInsights.filter(
    (row) => row.hasAccount && row.emailsBeforeAccountCreation > 0,
  );
  const averageEmailsBeforeAccountCreation =
    convertedRecipientRows.length > 0
      ? roundToOneDecimal(
          convertedRecipientRows.reduce(
            (sum, row) => sum + row.emailsBeforeAccountCreation,
            0,
          ) / convertedRecipientRows.length,
        )
      : 0;

  const summary: EmailTrackingSummary = {
    totalTracked,
    totalOpened,
    totalPending,
    totalOpens,
    openRate: totalTracked > 0 ? Math.round((totalOpened / totalTracked) * 100) : 0,
    totalClicked,
    totalClicks,
    clickRate: totalTracked > 0 ? Math.round((totalClicked / totalTracked) * 100) : 0,
    totalRecipients: recipientInsights.length,
    recipientsWithAccount,
    recipientsCreatedAfterFirstEmail,
    recipientsCreatedAfterReminder,
    recipientsAlreadyHadAccount,
    unnecessaryReminderEmails,
    recipientsWithUnnecessaryReminders,
    averageEmailsBeforeAccountCreation,
  };

  return {
    summary,
    recipientInsights,
    rows: mappedRows,
  };
}

export async function deleteAllEmailTrackingData() {
  await ensureEmailTrackingTable();

  await sql`
    DELETE FROM email_tracking
  `;
}

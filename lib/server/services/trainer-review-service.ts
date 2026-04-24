import { sql } from '@/lib/db';

type ReviewRecord = {
  id: string;
  rating: number;
  comment: string | null;
};

type ReviewAccessRow = {
  id: string;
  date: string;
  endTime: string;
  clientUserId: string;
  dogsitterUserId: string;
  userRole: string;
};

type ReviewResult =
  | { ok: true; status: number; body: Record<string, unknown> }
  | { ok: false; status: number; body: { error: string; detail?: string } };

let ensureTrainerReviewsTablePromise: Promise<void> | null = null;

type ColumnTypeRow = {
  udt_name: string | null;
};

async function ensureTrainerReviewsSlotIdColumn() {
  await sql`
    ALTER TABLE IF EXISTS trainer_reviews
    DROP CONSTRAINT IF EXISTS trainer_reviews_slot_id_fkey
  `;

  const columnRows = await sql`
    SELECT udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trainer_reviews'
      AND column_name = 'slot_id'
    LIMIT 1
  `;

  const slotIdColumn = (columnRows[0] as ColumnTypeRow | undefined)?.udt_name ?? null;
  if (slotIdColumn === 'text' || slotIdColumn === 'varchar' || slotIdColumn === 'bpchar') {
    return;
  }

  await sql`
    ALTER TABLE trainer_reviews
    ALTER COLUMN slot_id TYPE text
    USING slot_id::text
  `;
}

async function ensureTrainerReviewsTable() {
  if (!ensureTrainerReviewsTablePromise) {
    ensureTrainerReviewsTablePromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS trainer_reviews (
          id uuid PRIMARY KEY,
          instructor_user_id text NOT NULL,
          client_user_id text NOT NULL,
          slot_id text,
          rating integer NOT NULL,
          comment text
        )
      `;

      await sql`
        ALTER TABLE trainer_reviews
        ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT TRUE
      `;

      await sql`
        ALTER TABLE trainer_reviews
        ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()
      `;

      await sql`
        ALTER TABLE trainer_reviews
        ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
      `;

      await ensureTrainerReviewsSlotIdColumn();

      await sql`
        CREATE INDEX IF NOT EXISTS trainer_reviews_instructor_idx
          ON trainer_reviews (instructor_user_id, created_at DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS trainer_reviews_client_idx
          ON trainer_reviews (client_user_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS trainer_reviews_published_idx
          ON trainer_reviews (is_published, created_at DESC)
      `;

      await sql`
        DELETE FROM trainer_reviews tr
        USING trainer_reviews duplicate
        WHERE tr.slot_id IS NOT NULL
          AND duplicate.slot_id = tr.slot_id
          AND (
            duplicate.created_at > tr.created_at
            OR (
              duplicate.created_at = tr.created_at
              AND duplicate.id::text > tr.id::text
            )
          )
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS trainer_reviews_slot_unique_idx
          ON trainer_reviews (slot_id)
          WHERE slot_id IS NOT NULL
      `;
    })().catch((error) => {
      ensureTrainerReviewsTablePromise = null;
      throw error;
    });
  }

  await ensureTrainerReviewsTablePromise;
}

function parseParisSlotEnd(dateIso: string, endTime: string) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hours, minutes] = endTime.split(':').map(Number);

  return new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hours || 0,
    minutes || 0,
    0,
    0,
  );
}

async function getReviewAccessRow(slotId: string): Promise<ReviewAccessRow | null> {
  const rows = await sql`
    SELECT
      s.id,
      s."date"::text AS "date",
      s."endTime" AS "endTime",
      s."clientUserId" AS "clientUserId",
      s."dogsitterUserId" AS "dogsitterUserId",
      u.role AS "userRole"
    FROM "Slot" s
    JOIN "User" u
      ON u.id = s."clientUserId"
    WHERE s.id = ${slotId}
    LIMIT 1
  `;

  return (rows[0] as ReviewAccessRow | undefined) ?? null;
}

async function getReviewBySlotId(slotId: string): Promise<ReviewRecord | null> {
  const rows = await sql`
    SELECT
      id,
      rating,
      comment
    FROM trainer_reviews
    WHERE slot_id = ${slotId}
    LIMIT 1
  `;

  return (rows[0] as ReviewRecord | undefined) ?? null;
}

function isRecoverableReviewStorageError(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes('trainer_reviews') ||
    message.includes('does not exist') ||
    message.includes('permission denied') ||
    message.includes('column') ||
    message.includes('relation')
  );
}

export async function getSlotReview(params: {
  slotId: string;
  userId: string;
}): Promise<ReviewResult> {
  let accessRow: ReviewAccessRow | null = null;

  try {
    accessRow = await getReviewAccessRow(params.slotId);
  } catch (error) {
    console.error('[trainer-review] GET access lookup failed:', error);
    return {
      ok: false,
      status: 503,
      body: {
        error: 'REVIEWS_STORAGE_UNAVAILABLE',
        detail:
          error instanceof Error ? error.message : 'Review storage unavailable',
      },
    };
  }

  if (!accessRow) {
    return {
      ok: false,
      status: 404,
      body: { error: 'SLOT_NOT_FOUND' },
    };
  }

  if (accessRow.clientUserId !== params.userId) {
    return {
      ok: false,
      status: 403,
      body: { error: 'FORBIDDEN_REVIEW_ACCESS' },
    };
  }

  if (accessRow.userRole !== 'student') {
    return {
      ok: false,
      status: 403,
      body: { error: 'ONLY_CLIENT_CAN_REVIEW' },
    };
  }

  const canReview =
    parseParisSlotEnd(accessRow.date, accessRow.endTime).getTime() <= Date.now();
  let review: ReviewRecord | null = null;

  try {
    await ensureTrainerReviewsTable();
    review = await getReviewBySlotId(params.slotId);
  } catch (error) {
    if (!isRecoverableReviewStorageError(error)) {
      throw error;
    }

    console.error('[trainer-review] GET review storage unavailable:', error);
    review = null;
  }

  return {
    ok: true,
    status: 200,
    body: {
      canReview,
      review,
    },
  };
}

export async function upsertSlotReview(params: {
  slotId: string;
  userId: string;
  rating: number;
  comment: string | null;
}): Promise<ReviewResult> {
  let accessRow: ReviewAccessRow | null = null;

  try {
    accessRow = await getReviewAccessRow(params.slotId);
  } catch (error) {
    console.error('[trainer-review] PUT access lookup failed:', error);
    return {
      ok: false,
      status: 503,
      body: {
        error: 'REVIEWS_STORAGE_UNAVAILABLE',
        detail:
          error instanceof Error ? error.message : 'Review storage unavailable',
      },
    };
  }

  if (!accessRow) {
    return {
      ok: false,
      status: 404,
      body: { error: 'SLOT_NOT_FOUND' },
    };
  }

  if (accessRow.clientUserId !== params.userId) {
    return {
      ok: false,
      status: 403,
      body: { error: 'FORBIDDEN_REVIEW_ACCESS' },
    };
  }

  if (accessRow.userRole !== 'student') {
    return {
      ok: false,
      status: 403,
      body: { error: 'ONLY_CLIENT_CAN_REVIEW' },
    };
  }

  const slotEnded =
    parseParisSlotEnd(accessRow.date, accessRow.endTime).getTime() <= Date.now();
  if (!slotEnded) {
    return {
      ok: false,
      status: 400,
      body: { error: 'REVIEW_NOT_AVAILABLE_YET' },
    };
  }

  try {
    await ensureTrainerReviewsTable();
  } catch (error) {
    console.error('[trainer-review] PUT review storage unavailable:', error);
    return {
      ok: false,
      status: 503,
      body: {
        error: 'REVIEWS_STORAGE_UNAVAILABLE',
        detail:
          error instanceof Error ? error.message : 'Review storage unavailable',
      },
    };
  }

  let rows: unknown[] = [];

  try {
    const existingReview = await getReviewBySlotId(params.slotId);

    rows = existingReview
      ? await sql`
          UPDATE trainer_reviews
          SET
            rating = ${params.rating},
            comment = ${params.comment},
            is_published = TRUE,
            updated_at = now()
          WHERE id = ${existingReview.id}::uuid
          RETURNING
            id,
            rating,
            comment
        `
      : await sql`
          INSERT INTO trainer_reviews (
            id,
            instructor_user_id,
            client_user_id,
            slot_id,
            rating,
            comment,
            is_published,
            created_at,
            updated_at
          )
          VALUES (
            ${crypto.randomUUID()}::uuid,
            ${accessRow.dogsitterUserId},
            ${accessRow.clientUserId},
            ${params.slotId},
            ${params.rating},
            ${params.comment},
            TRUE,
            now(),
            now()
          )
          RETURNING
            id,
            rating,
            comment
        `;
  } catch (error) {
    console.error('[trainer-review] PUT persistence failed:', error);
    return {
      ok: false,
      status: 503,
      body: {
        error: 'REVIEWS_STORAGE_UNAVAILABLE',
        detail:
          error instanceof Error ? error.message : 'Review storage unavailable',
      },
    };
  }

  return {
    ok: true,
    status: 200,
    body: {
      review: (rows[0] as ReviewRecord | undefined) ?? null,
    },
  };
}

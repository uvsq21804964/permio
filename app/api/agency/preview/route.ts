import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

import { requireUser } from '@/lib/api/auth-server';
import { sql } from '@/lib/db';
import { getAgencyByJoinCode } from '@/lib/server/repositories/agency-repository';
import { getFirstAgencyInstructor } from '@/lib/server/repositories/user-repository';

type TrainerBookingStatsRow = {
  clientsCount: number | string | null;
  coursesCount: number | string | null;
};

type TrainerReviewStatsRow = {
  averageRating: number | string | null;
  reviewsCount: number | string | null;
};

type TrainerReviewRow = {
  id: string;
  rating: number | string;
  comment: string | null;
  clientName: string | null;
};

function buildTrainerDisplayName(params: {
  fallbackName: string | null | undefined;
  clerkUser:
    | {
        firstName?: string | null;
        lastName?: string | null;
        username?: string | null;
        emailAddresses?: Array<{ emailAddress?: string | null }>;
      }
    | null;
}) {
  const fallbackName = params.fallbackName?.trim();
  if (fallbackName) {
    return fallbackName;
  }

  const clerkName = [
    params.clerkUser?.firstName?.trim(),
    params.clerkUser?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (clerkName) {
    return clerkName;
  }

  const username = params.clerkUser?.username?.trim();
  if (username) {
    return username;
  }

  const primaryEmail = params.clerkUser?.emailAddresses?.[0]?.emailAddress?.trim();
  return primaryEmail || null;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

async function loadTrainerBookingStats(instructorUserId: string) {
  const rows = await sql`
    SELECT
      COUNT(*)::int AS "coursesCount",
      COUNT(DISTINCT "clientUserId")::int AS "clientsCount"
    FROM "Slot"
    WHERE "dogsitterUserId" = ${instructorUserId}
  `;

  const row = (rows?.[0] ?? null) as TrainerBookingStatsRow | null;
  return {
    clientsCount: toNumber(row?.clientsCount),
    coursesCount: toNumber(row?.coursesCount),
  };
}

async function loadTrainerReviewStats(instructorUserId: string) {
  try {
    const rows = await sql`
      SELECT
        ROUND(AVG(rating)::numeric, 1) AS "averageRating",
        COUNT(*)::int AS "reviewsCount"
      FROM trainer_reviews
      WHERE instructor_user_id = ${instructorUserId}
        AND is_published = TRUE
    `;

    const row = (rows?.[0] ?? null) as TrainerReviewStatsRow | null;
    return {
      averageRating:
        row?.averageRating == null ? null : Number(row.averageRating),
      reviewsCount: toNumber(row?.reviewsCount),
    };
  } catch {
    return {
      averageRating: null,
      reviewsCount: 0,
    };
  }
}

async function loadTrainerReviews(instructorUserId: string) {
  try {
    const rows = await sql`
      SELECT
        r.id::text AS id,
        r.rating AS rating,
        r.comment AS comment,
        client."name" AS "clientName"
      FROM trainer_reviews r
      LEFT JOIN "User" client
        ON client.id = r.client_user_id
      WHERE r.instructor_user_id = ${instructorUserId}
        AND r.is_published = TRUE
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 3
    `;

    return (rows as TrainerReviewRow[]).map((row) => ({
      id: row.id,
      rating: toNumber(row.rating),
      comment: row.comment?.trim() || null,
      clientName: row.clientName?.trim() || null,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { auth, response } = requireUser(req, {
    treatPendingAsSignedOut: false,
  });
  if (!auth) {
    return response;
  }

  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase() ?? '';
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const agency = await getAgencyByJoinCode(code);
  if (!agency) {
    return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
  }

  const instructor = await getFirstAgencyInstructor(agency.id);
  if (!instructor) {
    return NextResponse.json({
      agency: {
        id: agency.id,
        name: agency.name,
      },
      trainer: null,
    });
  }

  let clerkUser:
    | {
        firstName?: string | null;
        lastName?: string | null;
        username?: string | null;
        imageUrl?: string | null;
        emailAddresses?: Array<{ emailAddress?: string | null }>;
      }
    | null = null;

  try {
    const clerk = await clerkClient();
    clerkUser = await clerk.users.getUser(instructor.id);
  } catch {
    clerkUser = null;
  }

  const [bookingStats, reviewStats, reviews] = await Promise.all([
    loadTrainerBookingStats(instructor.id),
    loadTrainerReviewStats(instructor.id),
    loadTrainerReviews(instructor.id),
  ]);

  return NextResponse.json({
    agency: {
      id: agency.id,
      name: agency.name,
    },
    trainer: {
      id: instructor.id,
      name: buildTrainerDisplayName({
        fallbackName: instructor.name,
        clerkUser,
      }),
      imageUrl: clerkUser?.imageUrl ?? null,
      stats: {
        clientsCount: bookingStats.clientsCount,
        coursesCount: bookingStats.coursesCount,
        averageRating: reviewStats.averageRating,
        reviewsCount: reviewStats.reviewsCount,
      },
      reviews,
    },
  });
}

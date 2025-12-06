// import { type NextRequest, NextResponse } from "next/server"
// import { mockDb } from "@/lib/mock-db"

// export async function GET() {
//   try {
//     const slots = await mockDb.lessonSlot.findMany({
//       include: {
//         instructor: {
//           select: {
//             name: true,
//           },
//         },
//       },
//       orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
//     })

//     return NextResponse.json(slots)
//   } catch (error) {
//     console.error("[v0] Error fetching slots:", error)
//     return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     const { instructorId, dayOfWeek, startTime, endTime, status } = body

//     const slot = await mockDb.lessonSlot.create({
//       data: {
//         instructorId,
//         dayOfWeek,
//         startTime,
//         endTime,
//         status: status || "available",
//       },
//       include: {
//         instructor: {
//           select: {
//             name: true,
//           },
//         },
//       },
//     })

//     return NextResponse.json(slot, { status: 201 })
//   } catch (error) {
//     console.error("[v0] Error creating slot:", error)
//     return NextResponse.json({ error: "Failed to create slot" }, { status: 500 })
//   }
// }

// app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { timeToMinutes } from '@/lib/api/time';

type DbUserRow = {
  id: string;
  name: string | null;
  role: string;
  agencyId: string | null;

  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  google_place_id: string | null;
  raw_input: string | null;
  address_label: string | null;
  is_primary: boolean | null;
};

type BookingAddressPayload = {
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  googlePlaceId?: string;
};

type CreateSlotBody = {
  serviceId: number;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  bookingAddress?: BookingAddressPayload; // ⬅️ nouveau
};

/**
 * GET /api/slots
 * Renvoie les slots liés à l'utilisateur courant (en tant que client ou dogsitter)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slots = await sql`
      SELECT
        id,
        "dogsitterUserId",
        "clientUserId",
        "serviceId",
        "date"::date::text AS "date",
        "startTime",
        "endTime",
        "durationMinutes"
      FROM "Slot"
      WHERE "clientUserId" = ${userId}
         OR "dogsitterUserId" = ${userId}
      ORDER BY "date", "startTime"
    `;

    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error('[GET /api/slots] Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/slots
 * Crée un nouveau Slot dans la table "Slot" à partir du créneau sélectionné
 * et du service choisi dans BookPage.
 *
 * Body attendu:
 * {
 *   serviceId: number,
 *   date: "YYYY-MM-DD",
 *   startTime: "HH:MM",   // créneau SERVICE (pas la fenêtre entière)
 *   endTime: "HH:MM"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: CreateSlotBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'INVALID_JSON_BODY' }, { status: 400 });
    }

    const { serviceId, date, startTime, endTime, bookingAddress } = body || {};

    if (
      !serviceId ||
      typeof serviceId !== 'number' ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: 'MISSING_OR_INVALID_FIELDS' },
        { status: 400 }
      );
    }

    const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (durationMinutes <= 0) {
      return NextResponse.json(
        { error: 'INVALID_TIME_RANGE' },
        { status: 400 }
      );
    }

    // 1) Récupérer l'utilisateur courant (client)
    const [me] = (await sql/* sql */ `
      SELECT
        id,
        name,
        role,
        "agencyId" as "agencyId",
        formatted_address,
        lat,
        lng,
        street,
        street_number,
        postal_code,
        city,
        country,
        country_code,
        google_place_id,
        raw_input,
        address_label,
        is_primary
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `) as DbUserRow[];

    if (!me) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // 2) Trouver le moniteur (dogsitter) de la même agence
    let instructor: DbUserRow | null = null;

    if (me.role === 'instructor') {
      instructor = me;
    } else {
      const [foundInstructor] = (await sql/* sql */ `
        SELECT
          id,
          name,
          role,
          "agencyId" as "agencyId",
          formatted_address,
          lat,
          lng,
          street,
          street_number,
          postal_code,
          city,
          country,
          country_code,
          google_place_id,
          raw_input,
          address_label,
          is_primary
        FROM "User"
        WHERE "agencyId" = ${me.agencyId}
          AND role = 'instructor'
        LIMIT 1
      `) as DbUserRow[];

      instructor = foundInstructor || null;
    }

    if (!instructor) {
      return NextResponse.json(
        { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
        { status: 400 }
      );
    }

    // 3) Déterminer la source de l'adresse :
    //    - si bookingAddress est fourni, on l'utilise (adresse ponctuelle)
    //    - sinon, on utilise l'adresse du profil (me)
    const addressSource = bookingAddress
      ? {
          formatted_address: bookingAddress.formattedAddress,
          lat: bookingAddress.lat,
          lng: bookingAddress.lng,
          street: bookingAddress.street || null,
          street_number: bookingAddress.streetNumber || null,
          postal_code: bookingAddress.postalCode || null,
          city: bookingAddress.city || null,
          country: bookingAddress.country || null,
          country_code: bookingAddress.countryCode || null,
          google_place_id: bookingAddress.googlePlaceId ?? null,
          raw_input: bookingAddress.formattedAddress,
          // label : on peut reprendre celui du profil (ex: "Domicile")
          address_label: me.address_label,
          // adresse ponctuelle -> pas "primary"
          is_primary: false,
        }
      : {
          formatted_address: me.formatted_address,
          lat: me.lat,
          lng: me.lng,
          street: me.street,
          street_number: me.street_number,
          postal_code: me.postal_code,
          city: me.city,
          country: me.country,
          country_code: me.country_code,
          google_place_id: me.google_place_id,
          raw_input: me.raw_input,
          address_label: me.address_label,
          is_primary: me.is_primary ?? true,
        };

    // 3) Créer le Slot dans la vraie table "Slot"
    try {
      const [created] = await sql`
  INSERT INTO "Slot" (
    "dogsitterUserId",
    "clientUserId",
    "serviceId",
    "date",
    "startTime",
    "endTime",
    "durationMinutes",
    -- bloc d'adresse (client ou adresse ponctuelle)
    formatted_address,
    lat,
    lng,
    street,
    street_number,
    postal_code,
    city,
    country,
    country_code,
    google_place_id,
    raw_input,
    address_label,
    is_primary
  )
  VALUES (
    ${instructor.id},
    ${me.id},
    ${serviceId},
    ${date}::date,
    ${startTime},
    ${endTime},
    ${durationMinutes},
    ${addressSource.formatted_address},
    ${addressSource.lat},
    ${addressSource.lng},
    ${addressSource.street},
    ${addressSource.street_number},
    ${addressSource.postal_code},
    ${addressSource.city},
    ${addressSource.country},
    ${addressSource.country_code},
    ${addressSource.google_place_id},
    ${addressSource.raw_input},
    ${addressSource.address_label},
    ${addressSource.is_primary}
  )
  RETURNING
    id,
    "dogsitterUserId",
    "clientUserId",
    "serviceId",
    "date"::date::text AS "date",
    "startTime",
    "endTime",
    "durationMinutes"
`;

      return NextResponse.json({ slot: created }, { status: 201 });
    } catch (err: any) {
      // Conflit sur l'unicité du slot (index slot_unique_slot_idx)
      if (err?.code === '23505') {
        return NextResponse.json(
          { error: 'SLOT_ALREADY_EXISTS' },
          { status: 409 }
        );
      }
      console.error('[POST /api/slots] insert error:', err);
      return NextResponse.json(
        { error: 'FAILED_TO_CREATE_SLOT' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[POST /api/slots] error:', err);
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        detail: err?.message,
      },
      { status: 500 }
    );
  }
}

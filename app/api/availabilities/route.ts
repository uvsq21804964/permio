import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const doRangesOverlapOrAdjacent = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)

  return start1Min <= end2Min && start2Min <= end1Min
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    let availabilities
    if (userId) {
      availabilities = await sql`
        SELECT 
          a.id, 
          a."userId", 
          a."dayOfWeek", 
          a."startTime", 
          a."endTime", 
          a."createdAt", 
          a."updatedAt",
          json_build_object('name', u.name, 'role', u.role) as user
        FROM "Availability" a
        JOIN "User" u ON a."userId" = u.id
        WHERE a."userId" = ${userId}
        ORDER BY a."dayOfWeek" ASC, a."startTime" ASC
      `
    } else {
      availabilities = await sql`
        SELECT 
          a.id, 
          a."userId", 
          a."dayOfWeek", 
          a."startTime", 
          a."endTime", 
          a."createdAt", 
          a."updatedAt",
          json_build_object('name', u.name, 'role', u.role) as user
        FROM "Availability" a
        JOIN "User" u ON a."userId" = u.id
        ORDER BY a."dayOfWeek" ASC, a."startTime" ASC
      `
    }

    return NextResponse.json(availabilities)
  } catch (error) {
    console.error("[v0] Error fetching availabilities:", error)
    return NextResponse.json({ error: "Failed to fetch availabilities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, dayOfWeek, startTime, endTime } = body

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    if (endMinutes <= startMinutes) {
      return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début" }, { status: 400 })
    }

    if (startMinutes < 8 * 60 || endMinutes > 20 * 60) {
      return NextResponse.json({ error: "Les horaires doivent être entre 8h00 et 20h00" }, { status: 400 })
    }

    const existingAvailabilities = await sql`
      SELECT id, "userId", "dayOfWeek", "startTime", "endTime"
      FROM "Availability"
      WHERE "userId" = ${userId} AND "dayOfWeek" = ${dayOfWeek}
    `

    const overlapping = existingAvailabilities.filter((avail: any) =>
      doRangesOverlapOrAdjacent(startTime, endTime, avail.startTime, avail.endTime),
    )

    let finalStartTime = startTime
    let finalEndTime = endTime

    if (overlapping.length > 0) {
      const allTimes = [
        { start: startTime, end: endTime },
        ...overlapping.map((a: any) => ({ start: a.startTime, end: a.endTime })),
      ]

      const startMinutes = Math.min(...allTimes.map((t) => timeToMinutes(t.start)))
      const endMinutes = Math.max(...allTimes.map((t) => timeToMinutes(t.end)))

      const startHours = Math.floor(startMinutes / 60)
      const startMins = startMinutes % 60
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60

      finalStartTime = `${startHours.toString().padStart(2, "0")}:${startMins.toString().padStart(2, "0")}`
      finalEndTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`

      for (const avail of overlapping) {
        await sql`DELETE FROM "Availability" WHERE id = ${avail.id}`
      }
    }

    const [availability] = await sql`
      INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}, ${dayOfWeek}, ${finalStartTime}, ${finalEndTime}, NOW(), NOW())
      RETURNING *
    `

    const [user] = await sql`
      SELECT name, role FROM "User" WHERE id = ${userId}
    `

    return NextResponse.json({ ...availability, user }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating availability:", error)
    return NextResponse.json({ error: "Failed to create availability" }, { status: 500 })
  }
}

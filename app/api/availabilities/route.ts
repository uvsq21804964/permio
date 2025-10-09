import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-db"

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const doRangesOverlapOrAdjacent = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)

  // Check if ranges overlap or are adjacent (touching)
  return start1Min <= end2Min && start2Min <= end1Min
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    const whereClause = userId ? { userId } : {}

    const availabilities = await mockDb.availability.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })

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

    const existingAvailabilities = await mockDb.availability.findMany({
      where: {
        userId,
        dayOfWeek,
      },
    })

    console.log("[v0] Found existing availabilities:", existingAvailabilities.length)

    const overlapping = existingAvailabilities.filter((avail) =>
      doRangesOverlapOrAdjacent(startTime, endTime, avail.startTime, avail.endTime),
    )

    console.log("[v0] Found overlapping availabilities:", overlapping.length)

    let finalStartTime = startTime
    let finalEndTime = endTime

    if (overlapping.length > 0) {
      // Find the earliest start time and latest end time
      const allTimes = [
        { start: startTime, end: endTime },
        ...overlapping.map((a) => ({ start: a.startTime, end: a.endTime })),
      ]

      const startMinutes = Math.min(...allTimes.map((t) => timeToMinutes(t.start)))
      const endMinutes = Math.max(...allTimes.map((t) => timeToMinutes(t.end)))

      const startHours = Math.floor(startMinutes / 60)
      const startMins = startMinutes % 60
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60

      finalStartTime = `${startHours.toString().padStart(2, "0")}:${startMins.toString().padStart(2, "0")}`
      finalEndTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`

      console.log(
        "[v0] Deleting overlapping availabilities:",
        overlapping.map((a) => a.id),
      )
      for (const avail of overlapping) {
        await mockDb.availability.delete({ where: { id: avail.id } })
        console.log("[v0] Deleted availability:", avail.id)
      }
    }

    const availability = await mockDb.availability.create({
      data: {
        userId,
        dayOfWeek,
        startTime: finalStartTime,
        endTime: finalEndTime,
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    })

    console.log("[v0] Created merged availability:", availability.id)

    return NextResponse.json(availability, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating availability:", error)
    return NextResponse.json({ error: "Failed to create availability" }, { status: 500 })
  }
}

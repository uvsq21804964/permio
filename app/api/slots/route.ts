import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-db"

export async function GET() {
  try {
    const slots = await mockDb.lessonSlot.findMany({
      include: {
        instructor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })

    return NextResponse.json(slots)
  } catch (error) {
    console.error("[v0] Error fetching slots:", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, dayOfWeek, startTime, endTime, status } = body

    const slot = await mockDb.lessonSlot.create({
      data: {
        instructorId,
        dayOfWeek,
        startTime,
        endTime,
        status: status || "available",
      },
      include: {
        instructor: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(slot, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating slot:", error)
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 })
  }
}

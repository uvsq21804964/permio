import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOptimalSchedule } from "@/lib/scheduler"

export async function POST() {
  try {
    console.log("[v0] Starting schedule generation...")

    const [students, instructors, availabilities, slots] = await Promise.all([
      prisma.user.findMany({ where: { role: "student" } }),
      prisma.user.findMany({ where: { role: "instructor" } }),
      prisma.availability.findMany(),
      prisma.lessonSlot.findMany(),
    ])

    console.log("[v0] Fetched data:", {
      students: students.length,
      instructors: instructors.length,
      availabilities: availabilities.length,
      slots: slots.length,
    })

    const availableSlots = slots.filter((s) => s.status === "available")
    console.log("[v0] Available slots:", availableSlots.length)

    const result = generateOptimalSchedule(students, instructors, availabilities, availableSlots)
    console.log("[v0] Schedule generated:", {
      assignments: result.assignments.length,
      unmatched: result.unmatchedStudents.length,
    })

    await prisma.assignment.deleteMany()

    const createdAssignments = await Promise.all(
      result.assignments.map((assignment) =>
        prisma.assignment.create({
          data: {
            studentId: assignment.studentId,
            slotId: assignment.slotId,
            instructorId: assignment.instructorId,
          },
        }),
      ),
    )

    const assignmentsWithRelations = await prisma.assignment.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        slot: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    })

    console.log("[v0] Assignments created:", assignmentsWithRelations.length)

    return NextResponse.json({
      assignments: assignmentsWithRelations,
      unmatchedStudents: result.unmatchedStudents,
      stats: result.stats,
    })
  } catch (error) {
    console.error("[v0] Error generating schedule:", error)
    return NextResponse.json(
      {
        error: "Failed to generate schedule",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

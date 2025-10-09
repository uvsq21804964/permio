import { NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-db"
import { generateOptimalSchedule } from "@/lib/scheduler"

export async function POST() {
  try {
    console.log("[v0] Starting schedule generation...")

    // Fetch all data needed for scheduling
    const [students, instructors, availabilities, slots] = await Promise.all([
      mockDb.user.findMany({ where: { role: "student" } }),
      mockDb.user.findMany({ where: { role: "instructor" } }),
      mockDb.availability.findMany(),
      mockDb.lessonSlot.findMany(),
    ])

    console.log("[v0] Fetched data:", {
      students: students.length,
      instructors: instructors.length,
      availabilities: availabilities.length,
      slots: slots.length,
    })

    // Filter available slots
    const availableSlots = slots.filter((s) => s.status === "available")
    console.log("[v0] Available slots:", availableSlots.length)

    // Run the scheduling algorithm
    const result = generateOptimalSchedule(students, instructors, availabilities, availableSlots)
    console.log("[v0] Schedule generated:", {
      assignments: result.assignments.length,
      unmatched: result.unmatchedStudents.length,
    })

    // Clear existing assignments
    await mockDb.assignment.deleteMany()

    // Create new assignments and fetch full data
    const createdAssignments = await Promise.all(
      result.assignments.map((assignment) =>
        mockDb.assignment.create({
          data: {
            studentId: assignment.studentId,
            slotId: assignment.slotId,
          },
        }),
      ),
    )

    const assignmentsWithRelations = await mockDb.assignment.findMany({ include: true })

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

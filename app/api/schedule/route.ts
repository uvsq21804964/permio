import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateOptimalSchedule } from "@/lib/scheduler"

export async function POST() {
  try {
    console.log("[v0] Starting schedule generation...")

    // Fetch students
    const studentsResult = await sql`
      SELECT id, name, role 
      FROM "User" 
      WHERE role = 'student'
    `

    // Fetch instructors
    const instructorsResult = await sql`
      SELECT id, name, role 
      FROM "User" 
      WHERE role = 'instructor'
    `

    // Fetch all availabilities
    const availabilitiesResult = await sql`
      SELECT id, "userId", "dayOfWeek", "startTime", "endTime"
      FROM "Availability"
    `

    console.log("[v0] Fetched data:", {
      students: studentsResult.length,
      instructors: instructorsResult.length,
      availabilities: availabilitiesResult.length,
    })

    const result = generateOptimalSchedule(
      studentsResult as any[],
      instructorsResult as any[],
      availabilitiesResult as any[],
    )

    console.log("[v0] Schedule generated:", {
      matches: result.matches.length,
      unmatched: result.unmatchedStudents.length,
    })

    return NextResponse.json({
      matches: result.matches,
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

type User = {
  id: string
  name: string
  role: string
}

type Availability = {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

type Match = {
  studentId: string
  studentName: string
  instructorId: string
  instructorName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  duration: number
}

type ScheduleResult = {
  matches: Match[]
  unmatchedStudents: Array<{ id: string; name: string }>
  stats: {
    totalStudents: number
    matchedStudents: number
    totalInstructors: number
    totalMatches: number
  }
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Calculate overlap between two time ranges
 * Returns null if no overlap, or { start, end } if there is overlap
 */
function calculateOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): { start: string; end: string; duration: number } | null {
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)

  // Find overlap
  const overlapStart = Math.max(start1Min, start2Min)
  const overlapEnd = Math.min(end1Min, end2Min)

  // No overlap if start >= end
  if (overlapStart >= overlapEnd) {
    return null
  }

  // Convert back to time string
  const startHours = Math.floor(overlapStart / 60)
  const startMinutes = overlapStart % 60
  const endHours = Math.floor(overlapEnd / 60)
  const endMinutes = overlapEnd % 60

  return {
    start: `${String(startHours).padStart(2, "0")}:${String(startMinutes).padStart(2, "0")}`,
    end: `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`,
    duration: overlapEnd - overlapStart,
  }
}

/**
 * Generate optimal schedule by matching students with instructors based on overlapping availabilities
 */
export function generateOptimalSchedule(
  students: User[],
  instructors: User[],
  availabilities: Availability[],
): ScheduleResult {
  const matches: Match[] = []
  const matchedStudentIds = new Set<string>()

  // Group availabilities by user
  const availabilityMap = new Map<string, Availability[]>()
  for (const avail of availabilities) {
    if (!availabilityMap.has(avail.userId)) {
      availabilityMap.set(avail.userId, [])
    }
    availabilityMap.get(avail.userId)!.push(avail)
  }

  // Sort students by number of availabilities (fewer first = harder to match)
  const sortedStudents = [...students].sort((a, b) => {
    const aAvails = availabilityMap.get(a.id)?.length || 0
    const bAvails = availabilityMap.get(b.id)?.length || 0
    return aAvails - bAvails
  })

  // Try to match each student with instructors
  for (const student of sortedStudents) {
    const studentAvails = availabilityMap.get(student.id) || []

    // Try each instructor
    for (const instructor of instructors) {
      const instructorAvails = availabilityMap.get(instructor.id) || []

      // Check for overlapping availabilities
      for (const studentAvail of studentAvails) {
        for (const instructorAvail of instructorAvails) {
          // Must be same day
          if (studentAvail.dayOfWeek !== instructorAvail.dayOfWeek) {
            continue
          }

          // Calculate overlap
          const overlap = calculateOverlap(
            studentAvail.startTime,
            studentAvail.endTime,
            instructorAvail.startTime,
            instructorAvail.endTime,
          )

          if (overlap) {
            // Found a match!
            matches.push({
              studentId: student.id,
              studentName: student.name,
              instructorId: instructor.id,
              instructorName: instructor.name,
              dayOfWeek: studentAvail.dayOfWeek,
              startTime: overlap.start,
              endTime: overlap.end,
              duration: overlap.duration,
            })

            matchedStudentIds.add(student.id)
            // Break after first match for this student
            break
          }
        }
        if (matchedStudentIds.has(student.id)) break
      }
      if (matchedStudentIds.has(student.id)) break
    }
  }

  // Find unmatched students
  const unmatchedStudents = students
    .filter((student) => !matchedStudentIds.has(student.id))
    .map((student) => ({
      id: student.id,
      name: student.name,
    }))

  // Calculate statistics
  const stats = {
    totalStudents: students.length,
    matchedStudents: matchedStudentIds.size,
    totalInstructors: instructors.length,
    totalMatches: matches.length,
  }

  return {
    matches,
    unmatchedStudents,
    stats,
  }
}

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

type LessonSlot = {
  id: string
  instructorId: string // Changed from userId to instructorId
  dayOfWeek: number
  startTime: string
  endTime: string // Changed from duration to endTime
  status: string
}

type Assignment = {
  studentId: string
  slotId: string
  instructorId: string
}

type ScheduleResult = {
  assignments: Assignment[]
  unmatchedStudents: Array<{ id: string; name: string }>
  stats: {
    totalStudents: number
    matchedStudents: number
    totalSlots: number
    usedSlots: number
  }
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

/**
 * Check if a student's availability overlaps with an instructor's slot
 */
function hasOverlap(studentAvail: Availability, slot: LessonSlot): boolean {
  // Must be same day of week
  if (studentAvail.dayOfWeek !== slot.dayOfWeek) {
    return false
  }

  const studentStart = timeToMinutes(studentAvail.startTime)
  const studentEnd = timeToMinutes(studentAvail.endTime)
  const slotStart = timeToMinutes(slot.startTime)
  const slotEnd = timeToMinutes(slot.endTime) // Use endTime instead of calculating from duration

  // Check if there's any overlap
  return studentStart < slotEnd && studentEnd > slotStart
}

/**
 * Generate optimal schedule using greedy matching algorithm
 */
export function generateOptimalSchedule(
  students: User[],
  instructors: User[],
  availabilities: Availability[],
  slots: LessonSlot[],
): ScheduleResult {
  const assignments: Assignment[] = []
  const matchedStudentIds = new Set<string>()
  const usedSlotIds = new Set<string>()

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

  // Try to match each student to a slot
  for (const student of sortedStudents) {
    const studentAvails = availabilityMap.get(student.id) || []

    // Try to find a matching slot
    let matched = false
    for (const slot of slots) {
      // Skip if slot already used
      if (usedSlotIds.has(slot.id)) {
        continue
      }

      // Check if student has availability that overlaps with this slot
      const hasMatch = studentAvails.some((avail) => hasOverlap(avail, slot))

      if (hasMatch) {
        // Create assignment
        assignments.push({
          studentId: student.id,
          slotId: slot.id,
          instructorId: slot.instructorId, // Use instructorId from slot
        })

        matchedStudentIds.add(student.id)
        usedSlotIds.add(slot.id)
        matched = true
        break
      }
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
    totalSlots: slots.length,
    usedSlots: usedSlotIds.size,
  }

  return {
    assignments,
    unmatchedStudents,
    stats,
  }
}

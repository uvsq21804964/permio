// Mock database for development without Prisma connection
// This allows the app to work immediately without database setup

type User = {
  id: string
  name: string
  role: string
  createdAt: Date
}

type Availability = {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  createdAt: Date
  user?: { name: string; role: string }
}

type LessonSlot = {
  id: string
  instructorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  status: string
  createdAt: Date
  instructor?: { name: string }
}

type Assignment = {
  id: string
  studentId: string
  slotId: string
  createdAt: Date
  student?: { name: string }
  slot?: LessonSlot
}

// In-memory storage
const db = {
  users: [] as User[],
  availabilities: [] as Availability[],
  lessonSlots: [] as LessonSlot[],
  assignments: [] as Assignment[],
}

// Initialize with sample data
function initializeData() {
  if (db.users.length === 0) {
    // Add sample users
    db.users.push(
      {
        id: "1",
        name: "Marie Dupont",
        role: "instructor",
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Jean Martin",
        role: "instructor",
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "Sophie Bernard",
        role: "student",
        createdAt: new Date(),
      },
      {
        id: "4",
        name: "Lucas Petit",
        role: "student",
        createdAt: new Date(),
      },
    )
  }
}

// Initialize on module load
initializeData()

// Mock Prisma client API
export const mockDb = {
  users: db.users,
  availabilities: db.availabilities,
  lessonSlots: db.lessonSlots,
  assignments: db.assignments,

  user: {
    findMany: async (options?: { where?: { role?: string }; orderBy?: any }) => {
      let users = [...db.users]
      if (options?.where?.role) {
        users = users.filter((u) => u.role === options.where.role)
      }
      return users
    },
    create: async (options: { data: { name: string; role: string } }) => {
      const user: User = {
        id: String(Date.now()),
        name: options.data.name,
        role: options.data.role,
        createdAt: new Date(),
      }
      db.users.push(user)
      return user
    },
  },
  availability: {
    findMany: async (options?: {
      where?: { userId?: string; dayOfWeek?: number }
      include?: any
      orderBy?: any
    }) => {
      let availabilities = [...db.availabilities]

      // Apply where filters
      if (options?.where?.userId) {
        availabilities = availabilities.filter((a) => a.userId === options.where!.userId)
      }
      if (options?.where?.dayOfWeek !== undefined) {
        availabilities = availabilities.filter((a) => a.dayOfWeek === options.where!.dayOfWeek)
      }

      // Add user data if requested
      return availabilities.map((a) => {
        const user = db.users.find((u) => u.id === a.userId)
        return {
          ...a,
          user: user ? { name: user.name, role: user.role } : undefined,
        }
      })
    },
    create: async (options: {
      data: { userId: string; dayOfWeek: number; startTime: string; endTime: string }
      include?: any
    }) => {
      const availability: Availability = {
        id: String(Date.now()),
        userId: options.data.userId,
        dayOfWeek: options.data.dayOfWeek,
        startTime: options.data.startTime,
        endTime: options.data.endTime,
        createdAt: new Date(),
      }
      db.availabilities.push(availability)

      const user = db.users.find((u) => u.id === availability.userId)
      return {
        ...availability,
        user: user ? { name: user.name, role: user.role } : undefined,
      }
    },
    delete: async (options: { where: { id: string } }) => {
      const index = db.availabilities.findIndex((a) => a.id === options.where.id)
      if (index !== -1) {
        const deleted = db.availabilities[index]
        db.availabilities.splice(index, 1)
        return deleted
      }
      throw new Error("Availability not found")
    },
  },
  lessonSlot: {
    findMany: async (options?: { include?: any; orderBy?: any }) => {
      const slots = db.lessonSlots.map((s) => {
        const instructor = db.users.find((u) => u.id === s.instructorId)
        return {
          ...s,
          instructor: instructor ? { name: instructor.name } : undefined,
        }
      })
      return slots
    },
    create: async (options: {
      data: { instructorId: string; dayOfWeek: number; startTime: string; endTime: string; status: string }
      include?: any
    }) => {
      const slot: LessonSlot = {
        id: String(Date.now()),
        instructorId: options.data.instructorId,
        dayOfWeek: options.data.dayOfWeek,
        startTime: options.data.startTime,
        endTime: options.data.endTime,
        status: options.data.status,
        createdAt: new Date(),
      }
      db.lessonSlots.push(slot)

      const instructor = db.users.find((u) => u.id === slot.instructorId)
      return {
        ...slot,
        instructor: instructor ? { name: instructor.name } : undefined,
      }
    },
    delete: async (options: { where: { id: string } }) => {
      const index = db.lessonSlots.findIndex((s) => s.id === options.where.id)
      if (index !== -1) {
        const deleted = db.lessonSlots[index]
        db.lessonSlots.splice(index, 1)
        return deleted
      }
      throw new Error("Lesson slot not found")
    },
  },
  assignment: {
    findMany: async (options?: { include?: any }) => {
      const assignments = db.assignments.map((a) => {
        const student = db.users.find((u) => u.id === a.studentId)
        const slot = db.lessonSlots.find((s) => s.id === a.slotId)
        const instructor = slot ? db.users.find((u) => u.id === slot.instructorId) : undefined

        const duration = slot
          ? (() => {
              const start = slot.startTime.split(":").map(Number)
              const end = slot.endTime.split(":").map(Number)
              return end[0] * 60 + end[1] - (start[0] * 60 + start[1])
            })()
          : 0

        return {
          ...a,
          student: student ? { name: student.name } : undefined,
          slot: slot
            ? {
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                duration, // Add calculated duration for frontend
                user: instructor ? { name: instructor.name } : undefined,
              }
            : undefined,
        }
      })
      return assignments
    },
    deleteMany: async () => {
      const count = db.assignments.length
      db.assignments = []
      return { count }
    },
    create: async (options: { data: { studentId: string; slotId: string } }) => {
      const assignment: Assignment = {
        id: String(Date.now() + Math.random()), // Add random to avoid ID collisions
        studentId: options.data.studentId,
        slotId: options.data.slotId,
        createdAt: new Date(),
      }
      db.assignments.push(assignment)
      return assignment
    },
  },
}

-- Create tables based on Prisma schema

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

CREATE TABLE IF NOT EXISTS "Availability" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Availability_userId_idx" ON "Availability"("userId");
CREATE INDEX IF NOT EXISTS "Availability_dayOfWeek_idx" ON "Availability"("dayOfWeek");

CREATE TABLE IF NOT EXISTS "LessonSlot" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LessonSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LessonSlot_userId_idx" ON "LessonSlot"("userId");
CREATE INDEX IF NOT EXISTS "LessonSlot_dayOfWeek_idx" ON "LessonSlot"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "LessonSlot_status_idx" ON "LessonSlot"("status");

CREATE TABLE IF NOT EXISTS "Assignment" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Assignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Assignment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "LessonSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Assignment_studentId_idx" ON "Assignment"("studentId");
CREATE INDEX IF NOT EXISTS "Assignment_slotId_idx" ON "Assignment"("slotId");
CREATE INDEX IF NOT EXISTS "Assignment_instructorId_idx" ON "Assignment"("instructorId");
CREATE INDEX IF NOT EXISTS "Assignment_status_idx" ON "Assignment"("status");

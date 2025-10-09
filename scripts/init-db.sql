-- Initialize database with sample data for testing

-- Create sample instructors
INSERT INTO "User" (id, name, role, "createdAt", "updatedAt")
VALUES 
  ('instructor-1', 'Marie Dupont', 'instructor', NOW(), NOW()),
  ('instructor-2', 'Jean Martin', 'instructor', NOW(), NOW());

-- Create sample students
INSERT INTO "User" (id, name, role, "createdAt", "updatedAt")
VALUES 
  ('student-1', 'Sophie Bernard', 'student', NOW(), NOW()),
  ('student-2', 'Lucas Petit', 'student', NOW(), NOW()),
  ('student-3', 'Emma Dubois', 'student', NOW(), NOW());

-- Create sample availabilities for instructors
-- Marie Dupont: Monday 9:00-17:00, Wednesday 9:00-17:00
INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
VALUES 
  ('avail-1', 'instructor-1', 0, '09:00', '17:00', NOW(), NOW()),
  ('avail-2', 'instructor-1', 2, '09:00', '17:00', NOW(), NOW());

-- Jean Martin: Tuesday 10:00-18:00, Thursday 10:00-18:00
INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
VALUES 
  ('avail-3', 'instructor-2', 1, '10:00', '18:00', NOW(), NOW()),
  ('avail-4', 'instructor-2', 3, '10:00', '18:00', NOW(), NOW());

-- Create sample availabilities for students
-- Sophie Bernard: Monday 14:00-18:00, Wednesday 14:00-18:00
INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
VALUES 
  ('avail-5', 'student-1', 0, '14:00', '18:00', NOW(), NOW()),
  ('avail-6', 'student-1', 2, '14:00', '18:00', NOW(), NOW());

-- Lucas Petit: Tuesday 10:00-12:00, Thursday 15:00-18:00
INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
VALUES 
  ('avail-7', 'student-2', 1, '10:00', '12:00', NOW(), NOW()),
  ('avail-8', 'student-2', 3, '15:00', '18:00', NOW(), NOW());

-- Emma Dubois: Monday 9:00-12:00, Wednesday 9:00-12:00
INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
VALUES 
  ('avail-9', 'student-3', 0, '09:00', '12:00', NOW(), NOW()),
  ('avail-10', 'student-3', 2, '09:00', '12:00', NOW(), NOW());

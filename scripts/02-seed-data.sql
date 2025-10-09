-- Seed database with sample data

-- Create sample instructors
INSERT INTO "User" (id, name, role, "createdAt", "updatedAt")
VALUES 
  ('instructor-1', 'Marie Dupont', 'instructor', NOW(), NOW()),
  ('instructor-2', 'Jean Martin', 'instructor', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample students
INSERT INTO "User" (id, name, role, "createdAt", "updatedAt")
VALUES 
  ('student-1', 'Sophie Bernard', 'student', NOW(), NOW()),
  ('student-2', 'Lucas Petit', 'student', NOW(), NOW()),
  ('student-3', 'Emma Dubois', 'student', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

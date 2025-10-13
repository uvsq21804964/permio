// types/schedule.ts
export const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;

export type Match = {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number; // 0..6
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  duration: number; // minutes
};

export type ScheduleResult = {
  matches: Match[];
  unmatchedStudents: Array<{ id: string; name: string }>;
  stats: {
    totalStudents: number;
    matchedStudents: number;
    totalInstructors: number;
    totalMatches: number;
  };
};

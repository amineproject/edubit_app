import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'GURU' | 'ADMIN' | 'SISWA'
  nip: text('nip'),
  nis: text('nis'),
  classId: text('class_id'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Classes table
export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  className: text('class_name').notNull(),
  level: text('level'),
  academicYear: text('academic_year'),
});

// Subjects table
export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  subjectName: text('subject_name').notNull(),
  code: text('code'),
  icon: text('icon'),
});

// Subject Classes junction
export const subjectClasses = pgTable('subject_classes', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  classId: text('class_id').notNull(),
});

// Announcements table
export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetClassId: text('target_class_id').notNull(), // 'ALL' or class_id
  authorName: text('author_name').notNull(),
  startDate: text('start_date'),
  badge: text('badge'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Materials table
export const materials = pgTable('materials', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  classId: text('class_id').notNull(), // 'ALL' or class_id
  title: text('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  type: text('type'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Assignments table
export const assignments = pgTable('assignments', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  classId: text('class_id').notNull(), // 'ALL' or class_id
  title: text('title').notNull(),
  description: text('description').notNull(),
  dueDate: text('due_date'),
  maxScore: integer('max_score').default(100),
  createdAt: timestamp('created_at').defaultNow(),
});

// Evaluations & Submissions table
export const evaluations = pgTable('evaluations', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  nis: text('nis'),
  classId: text('class_id'),
  isCollected: boolean('is_collected').default(true),
  submittedAt: timestamp('submitted_at').defaultNow(),
  submissionText: text('submission_text'),
  submissionUrl: text('submission_url'),
  grade: integer('grade'),
  teacherNotes: text('teacher_notes'),
  gradedAt: timestamp('graded_at'),
});

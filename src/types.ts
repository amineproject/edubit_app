export type UserRole = 'GURU' | 'ADMIN' | 'SISWA';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  nip?: string;
  nis?: string;
  class_id?: string;
  phone?: string;
  created_at: string;
}

export interface ClassItem {
  id: string;
  class_name: string;
  level?: string;
  academic_year?: string;
}

export interface SubjectItem {
  id: string;
  subject_name: string;
  code?: string;
  icon?: string;
}

export interface SubjectClass {
  id: string;
  subject_id: string;
  class_id: string;
}

export interface StudentProfile {
  id: string; // user_id
  nis: string;
  full_name: string;
  class_id: string;
  email: string;
  username: string;
  phone?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_class_id: string; // 'ALL' or specific class_id
  author_name: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  badge?: string;
}

export interface Material {
  id: string;
  subject_id: string;
  class_id: string; // 'ALL' or specific class_id
  title: string;
  description?: string;
  url: string;
  type?: 'pdf' | 'video' | 'link' | 'doc';
  created_at: string;
}

export interface Assignment {
  id: string;
  subject_id: string;
  class_id: string; // 'ALL' or specific class_id
  title: string;
  description: string;
  due_date: string;
  max_score?: number;
  created_at: string;
}

export interface Evaluation {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  nis?: string;
  class_id?: string;
  is_collected: boolean;
  submitted_at?: string;
  submission_text?: string;
  submission_url?: string;
  grade?: number | null;
  status?: 'TUNTAS' | 'REMIDIAL' | 'BELUM';
  teacher_notes?: string | null;
  graded_at?: string;
}

export interface AppDataResponse {
  classes: ClassItem[];
  subjects: SubjectItem[];
  subjectClasses: SubjectClass[];
  announcements: Announcement[];
  materials: Material[];
  assignments: Assignment[];
  evaluations: Evaluation[];
  students: StudentProfile[];
  currentUser: User;
}

export interface DecodedJwt {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  class_id?: string;
  nis?: string;
  iat: number;
  exp: number;
}

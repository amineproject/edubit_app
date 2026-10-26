import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ugvcywndinfqiukbrgig.supabase.co';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_rnhioflH1PPtZAT2c5JelQ_Km70aX0O';

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkSupabaseStatus() {
  try {
    const { data, error } = await supabaseServer.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === 'PGRST205') {
        return {
          connected: true,
          tablesCreated: false,
          message: 'Terhubung ke Supabase. Tabel belum dibuat di schema cache (perlu jalankan skrip SQL di Supabase SQL Editor).'
        };
      }
      return {
        connected: false,
        tablesCreated: false,
        message: error.message
      };
    }
    return {
      connected: true,
      tablesCreated: true,
      message: 'Terhubung ke Supabase & tabel aktif!'
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesCreated: false,
      message: err.message || 'Gagal menghubungi Supabase'
    };
  }
}

export function getSupabaseSqlSchema() {
  return `-- ========================================================
-- SKRIP SQL EDUBITS UNTUK SUPABASE SQL EDITOR
-- Salin dan jalankan skrip ini di:
-- https://supabase.com/dashboard/project/ugvcywndinfqiukbrgig/sql/new
-- ========================================================

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  nip TEXT,
  nis TEXT,
  class_id TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  level TEXT,
  academic_year TEXT
);

-- 3. Tabel Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  subject_name TEXT NOT NULL,
  code TEXT,
  icon TEXT
);

-- 4. Tabel Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_class_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  start_date TEXT,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TEXT,
  max_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Evaluations
CREATE TABLE IF NOT EXISTS public.evaluations (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  nis TEXT,
  class_id TEXT,
  is_collected BOOLEAN DEFAULT TRUE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submission_text TEXT,
  submission_url TEXT,
  grade INTEGER,
  teacher_notes TEXT,
  graded_at TIMESTAMPTZ
);

-- Aktifkan Row Level Security (RLS) dengan kebijakan Publik/Anon
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses untuk Anon/Publishable Key
CREATE POLICY "Akses baca tulis publik users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses baca tulis publik classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses baca tulis publik subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses baca tulis publik announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses baca tulis publik materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses baca tulis publik assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses baca tulis publik evaluations" ON public.evaluations FOR ALL USING (true) WITH CHECK (true);

-- Data Awal Guru Admin & Siswa Demo
INSERT INTO public.users (id, username, email, password, full_name, role, nip, phone)
VALUES ('usr-guru-1', 'aminwahyudi48', 'aminwahyudi48@guru.smp.belajar.id', '1412', 'Amin Wahyudi, S.Pd., M.Kom.', 'GURU', '198507152010011008', '0812-3456-7890')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, username, email, password, full_name, role, nis, class_id, phone)
VALUES ('usr-siswa-1', 'budi.santoso', 'budi.santoso@siswa.smp.belajar.id', 'siswa123', 'Budi Santoso', 'SISWA', '20240101', 'cls-9a', '0857-1122-3344')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.classes (id, class_name, level, academic_year) VALUES
  ('cls-9a', 'Kelas IX-A', 'Kelas 9', '2025/2026'),
  ('cls-9b', 'Kelas IX-B', 'Kelas 9', '2025/2026'),
  ('cls-8a', 'Kelas VIII-A', 'Kelas 8', '2025/2026'),
  ('cls-8b', 'Kelas VIII-B', 'Kelas 8', '2025/2026'),
  ('cls-7a', 'Kelas VII-A', 'Kelas 7', '2025/2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subjects (id, subject_name, code, icon) VALUES
  ('sbj-inf', 'Informatika & Pemrograman', 'INF-01', '💻'),
  ('sbj-mat', 'Matematika Terapan', 'MAT-02', '📐'),
  ('sbj-ipa', 'Ilmu Pengetahuan Alam', 'IPA-03', '🔬'),
  ('sbj-ing', 'Bahasa Inggris', 'ING-04', '🌍'),
  ('sbj-ind', 'Bahasa Indonesia', 'IND-05', '📚')
ON CONFLICT (id) DO NOTHING;
`;
}

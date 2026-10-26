import { db } from './index.ts';
import {
  users,
  classes,
  subjects,
  subjectClasses,
  announcements,
  materials,
  assignments,
  evaluations
} from './schema.ts';
import { eq, or } from 'drizzle-orm';

// Initial Seeding in PostgreSQL
export async function seedInitialDataIfNeeded() {
  try {
    const existingUsers = await db.select().from(users);
    const hasAdmin = existingUsers.some(u => u.email === 'aminwahyudi48@guru.smp.belajar.id');

    if (!hasAdmin) {
      console.log('[PostgreSQL] Seeding admin teacher account...');
      await db.insert(users).values({
        id: 'usr-guru-1',
        username: 'aminwahyudi48',
        email: 'aminwahyudi48@guru.smp.belajar.id',
        password: '1412',
        fullName: 'Amin Wahyudi, S.Pd., M.Kom.',
        role: 'GURU',
        nip: '198507152010011008',
        phone: '0812-3456-7890',
        createdAt: new Date('2026-01-10')
      });
    }

    const hasStudent1 = existingUsers.some(u => u.username === 'budi.santoso');
    if (!hasStudent1) {
      console.log('[PostgreSQL] Seeding default student account...');
      await db.insert(users).values({
        id: 'usr-siswa-1',
        username: 'budi.santoso',
        email: 'budi.santoso@siswa.smp.belajar.id',
        password: 'siswa123',
        fullName: 'Budi Santoso',
        role: 'SISWA',
        nis: '20240101',
        classId: 'cls-9a',
        phone: '0857-1122-3344',
        createdAt: new Date('2026-02-01')
      });
    }

    // Classes
    const existingClasses = await db.select().from(classes);
    if (existingClasses.length === 0) {
      console.log('[PostgreSQL] Seeding classes...');
      await db.insert(classes).values([
        { id: 'cls-9a', className: 'Kelas IX-A', level: 'Kelas 9', academicYear: '2025/2026' },
        { id: 'cls-9b', className: 'Kelas IX-B', level: 'Kelas 9', academicYear: '2025/2026' },
        { id: 'cls-8a', className: 'Kelas VIII-A', level: 'Kelas 8', academicYear: '2025/2026' },
        { id: 'cls-8b', className: 'Kelas VIII-B', level: 'Kelas 8', academicYear: '2025/2026' },
        { id: 'cls-7a', className: 'Kelas VII-A', level: 'Kelas 7', academicYear: '2025/2026' }
      ]);
    }

    // Subjects
    const existingSubjects = await db.select().from(subjects);
    if (existingSubjects.length === 0) {
      console.log('[PostgreSQL] Seeding subjects...');
      await db.insert(subjects).values([
        { id: 'sbj-inf', subjectName: 'Informatika & Pemrograman', code: 'INF-01', icon: '💻' },
        { id: 'sbj-mat', subjectName: 'Matematika Terapan', code: 'MAT-02', icon: '📐' },
        { id: 'sbj-ipa', subjectName: 'Ilmu Pengetahuan Alam', code: 'IPA-03', icon: '🔬' },
        { id: 'sbj-ing', subjectName: 'Bahasa Inggris', code: 'ING-04', icon: '🌍' },
        { id: 'sbj-ind', subjectName: 'Bahasa Indonesia', code: 'IND-05', icon: '📚' }
      ]);
    }

    // Announcements
    const existingAnn = await db.select().from(announcements);
    if (existingAnn.length === 0) {
      console.log('[PostgreSQL] Seeding announcements...');
      await db.insert(announcements).values([
        {
          id: 'ann-1',
          title: '📢 Jadwal Penilaian Tengah Semester (PTS) Genap',
          content: 'Diberitahukan kepada seluruh siswa bahwa PTS Genap akan dimulai tanggal 10 November 2026. Harap persiapkan diri dan periksa kelengkapan tugas.',
          targetClassId: 'ALL',
          authorName: 'Amin Wahyudi, S.Pd., M.Kom.',
          startDate: '2026-10-25',
          badge: 'PENTING'
        },
        {
          id: 'ann-2',
          title: '💻 Praktikum Algoritma Pemrograman di Lab Komputer 1',
          content: 'Khusus siswa Kelas IX-A, hari Rabu depan praktikum modul Looping & Array akan diadakan di Lab Komputer 1 mulai pukul 08.00 WIB.',
          targetClassId: 'cls-9a',
          authorName: 'Amin Wahyudi, S.Pd., M.Kom.',
          startDate: '2026-10-26',
          badge: 'KELAS IX-A'
        }
      ]);
    }

    // Materials
    const existingMaterials = await db.select().from(materials);
    if (existingMaterials.length === 0) {
      console.log('[PostgreSQL] Seeding materials...');
      await db.insert(materials).values([
        {
          id: 'mat-1',
          subjectId: 'sbj-inf',
          classId: 'cls-9a',
          title: 'Pengenalan Logika Pemrograman & Algoritma Dasar',
          description: 'Materi pengantar struktur dasar algoritma, flowchart, dan pseudocode untuk siswa kelas 9.',
          url: 'https://docs.google.com/presentation/d/edubits-sample-materi-1',
          type: 'pdf'
        },
        {
          id: 'mat-2',
          subjectId: 'sbj-inf',
          classId: 'ALL',
          title: 'Panduan Keamanan Siber & Etika Digital untuk Siswa',
          description: 'Dasar-dasar privasi internet, perlindungan data pribadi, dan pencegahan phishing di sekolah.',
          url: 'https://youtube.com/watch?v=edubits-cybersecurity-kids',
          type: 'video'
        },
        {
          id: 'mat-3',
          subjectId: 'sbj-mat',
          classId: 'cls-9a',
          title: 'Rumus Persamaan Kuadrat & Contoh Soal Pembahasan',
          description: 'Bahan bacaan ringkas dan latihan mandiri persamaan kuadrat tingkat SMP.',
          url: 'https://drive.google.com/file/d/edubits-matematika-9a',
          type: 'doc'
        }
      ]);
    }

    // Assignments
    const existingAssignments = await db.select().from(assignments);
    if (existingAssignments.length === 0) {
      console.log('[PostgreSQL] Seeding assignments...');
      await db.insert(assignments).values([
        {
          id: 'asg-1',
          subjectId: 'sbj-inf',
          classId: 'cls-9a',
          title: 'Tugas 01: Membuat Flowchart Algoritma Pemesanan Kantin',
          description: 'Buatlah bagan alir (flowchart) lengkap dengan percabangan (decision) dan pengulangan. Kumpulkan dalam format link gambar atau dokumen Google Docs.',
          dueDate: '2026-11-05',
          maxScore: 100
        },
        {
          id: 'asg-2',
          subjectId: 'sbj-mat',
          classId: 'cls-9a',
          title: 'Tugas 02: Latihan Mandiri Menyelesaikan Akar Kuadrat',
          description: 'Kerjakan soal no 1-5 pada buku paket hal 45. Tuliskan langkah pengerjaan di buku tulis lalu kumpulkan foto/link.',
          dueDate: '2026-11-02',
          maxScore: 100
        }
      ]);
    }
  } catch (error) {
    console.error('[PostgreSQL Seed Warning]', error);
  }
}

// User repository
export async function findUserByLoginIdentifier(identifier: string) {
  try {
    const clean = identifier.trim().toLowerCase();
    const rows = await db
      .select()
      .from(users)
      .where(or(eq(users.email, clean), eq(users.username, clean), eq(users.nis, clean)));
    return rows[0] || null;
  } catch (err) {
    console.error('Database query failed (findUserByLoginIdentifier):', err);
    throw new Error('Gagal mengambil data user dari database', { cause: err });
  }
}

export async function findUserById(id: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] || null;
  } catch (err) {
    console.error('Database query failed (findUserById):', err);
    throw new Error('Gagal mengambil data user', { cause: err });
  }
}

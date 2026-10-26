import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  users,
  classes,
  subjects,
  subjectClasses,
  announcements,
  materials,
  assignments,
  evaluations
} from './src/db/schema.ts';
import {
  seedInitialDataIfNeeded,
  findUserByLoginIdentifier,
  findUserById
} from './src/db/repository.ts';
import { eq, or } from 'drizzle-orm';
import {
  supabaseServer,
  checkSupabaseStatus,
  getSupabaseSqlSchema,
  SUPABASE_URL
} from './src/lib/server-supabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'edubits-jwt-secret-key-smp-belajar-id-2026';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: 'GURU' | 'ADMIN' | 'SISWA';
    class_id?: string;
    nis?: string;
    nip?: string;
  };
}

// JWT Authentication Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token otentikasi tidak ditemukan. Silakan login kembali.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Sesi token tidak valid atau telah kedaluwarsa. Silakan login ulang.'
      });
    }
    req.user = decoded;
    next();
  });
}

// Role Authorization Middleware
function requireRoles(allowedRoles: Array<'GURU' | 'ADMIN' | 'SISWA'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak! Fitur ini hanya dapat diakses oleh peran: ${allowedRoles.join(', ')}.`
      });
    }
    next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize and seed PostgreSQL data
  await seedInitialDataIfNeeded();

  // -------------------------------------------------------------
  // SUPABASE INTEGRATION ROUTES
  // -------------------------------------------------------------

  app.get('/api/supabase/status', async (req: Request, res: Response) => {
    const status = await checkSupabaseStatus();
    return res.json({
      success: true,
      url: SUPABASE_URL,
      ...status
    });
  });

  app.get('/api/supabase/schema', (req: Request, res: Response) => {
    return res.json({
      success: true,
      url: SUPABASE_URL,
      sql: getSupabaseSqlSchema()
    });
  });

  // -------------------------------------------------------------
  // AUTH ROUTES
  // -------------------------------------------------------------

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username / Email dan Password wajib diisi!'
        });
      }

      const cleanInput = String(username).trim();
      const cleanPass = String(password).trim();

      const user = await findUserByLoginIdentifier(cleanInput);

      if (!user || user.password !== cleanPass) {
        return res.status(401).json({
          success: false,
          message: 'Email / Username atau Password salah! Periksa kembali kredensial Anda.'
        });
      }

      // Generate JWT Token
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        class_id: user.classId || '',
        nis: user.nis || '',
        nip: user.nip || ''
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        message: `Login berhasil! Selamat datang, ${user.fullName}`,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          class_id: user.classId,
          nis: user.nis,
          nip: user.nip,
          phone: user.phone,
          created_at: user.createdAt
        }
      });
    } catch (err: any) {
      console.error('Error in /api/auth/login:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem database.' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          class_id: user.classId,
          nis: user.nis,
          nip: user.nip,
          phone: user.phone,
          created_at: user.createdAt
        },
        jwtPayload: req.user
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal mengambil profil user' });
    }
  });

  // -------------------------------------------------------------
  // CORE APP DATA ROUTE (Filtered by Role and Class via PostgreSQL)
  // -------------------------------------------------------------

  app.get('/api/data', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user!;
      const isTeacher = currentUser.role === 'GURU' || currentUser.role === 'ADMIN';
      const studentClassId = currentUser.class_id || '';

      const [
        allClasses,
        allSubjects,
        allSubjectClasses,
        allAnnouncements,
        allMaterials,
        allAssignments,
        allEvaluations,
        allUsers
      ] = await Promise.all([
        db.select().from(classes),
        db.select().from(subjects),
        db.select().from(subjectClasses),
        db.select().from(announcements),
        db.select().from(materials),
        db.select().from(assignments),
        db.select().from(evaluations),
        db.select().from(users)
      ]);

      const belongsToClass = (savedClassIds: string, targetId: string) => {
        const raw = String(savedClassIds || '').trim();
        if (!raw || raw === 'ALL') return true;
        return raw.split(',').map(x => x.trim()).includes(targetId);
      };

      // Subjects followed by student's class
      const linkedSubjectIds = new Set<string>();
      if (!isTeacher && studentClassId) {
        allSubjectClasses
          .filter(sc => sc.classId === studentClassId)
          .forEach(sc => linkedSubjectIds.add(sc.subjectId));

        if (linkedSubjectIds.size === 0) {
          // Fallback to subjects that have assignments/materials for this class
          allMaterials.filter(m => belongsToClass(m.classId, studentClassId)).forEach(m => linkedSubjectIds.add(m.subjectId));
          allAssignments.filter(a => belongsToClass(a.classId, studentClassId)).forEach(a => linkedSubjectIds.add(a.subjectId));
        }
      }

      // Announcements (Hanya yang relevan dengan kelas siswa atau ALL)
      const filteredAnnouncements = allAnnouncements
        .filter(a => {
          if (isTeacher) return true;
          return a.targetClassId === 'ALL' || a.targetClassId === studentClassId;
        })
        .map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          target_class_id: a.targetClassId,
          author_name: a.authorName,
          start_date: a.startDate || '',
          badge: a.badge || undefined,
          created_at: a.createdAt?.toISOString() || new Date().toISOString()
        }));

      // Materials (Hanya tampil materi mapel yang diikuti saja)
      const filteredMaterials = allMaterials
        .filter(m => {
          if (isTeacher) return true;
          const classMatch = belongsToClass(m.classId, studentClassId);
          const subjectMatch = linkedSubjectIds.size === 0 || linkedSubjectIds.has(m.subjectId);
          return classMatch && subjectMatch;
        })
        .map(m => ({
          id: m.id,
          subject_id: m.subjectId,
          class_id: m.classId,
          title: m.title,
          description: m.description || '',
          url: m.url,
          type: (m.type as any) || 'pdf',
          created_at: m.createdAt?.toISOString() || new Date().toISOString()
        }));

      // Assignments (Hanya tampil tugas mapel yang diikuti)
      const filteredAssignments = allAssignments
        .filter(a => {
          if (isTeacher) return true;
          const classMatch = belongsToClass(a.classId, studentClassId);
          const subjectMatch = linkedSubjectIds.size === 0 || linkedSubjectIds.has(a.subjectId);
          return classMatch && subjectMatch;
        })
        .map(a => ({
          id: a.id,
          subject_id: a.subjectId,
          class_id: a.classId,
          title: a.title,
          description: a.description,
          due_date: a.dueDate || '',
          max_score: isTeacher ? (a.maxScore || 100) : undefined,
          created_at: a.createdAt?.toISOString() || new Date().toISOString()
        }));

      // Evaluations (Status Kualitatif: TUNTAS, REMIDIAL, atau BELUM - Tanpa Angka untuk Siswa)
      const filteredEvaluations = (isTeacher
        ? allEvaluations
        : allEvaluations.filter(e => e.studentId === currentUser.id)
      ).map(e => {
        let statusVal: 'TUNTAS' | 'REMIDIAL' | 'BELUM' = 'BELUM';
        if (e.grade !== null && e.grade !== undefined) {
          statusVal = e.grade >= 75 ? 'TUNTAS' : 'REMIDIAL';
        }
        return {
          id: e.id,
          assignment_id: e.assignmentId,
          student_id: e.studentId,
          student_name: e.studentName,
          nis: e.nis || undefined,
          class_id: e.classId || undefined,
          is_collected: e.isCollected ?? true,
          submitted_at: e.submittedAt?.toISOString(),
          submission_text: e.submissionText || undefined,
          submission_url: e.submissionUrl || undefined,
          grade: isTeacher ? e.grade : null, // Tidak menampilkan angka untuk siswa
          status: statusVal,
          teacher_notes: e.teacherNotes || undefined,
          graded_at: e.gradedAt?.toISOString()
        };
      });

      // Students
      const studentUsers = allUsers.filter(u => u.role === 'SISWA');
      const filteredStudents = studentUsers
        .filter(s => isTeacher || s.classId === studentClassId)
        .map(s => ({
          id: s.id,
          nis: s.nis || '-',
          full_name: s.fullName,
          class_id: s.classId || '',
          email: s.email,
          username: s.username,
          phone: s.phone || undefined,
          created_at: s.createdAt?.toISOString() || new Date().toISOString()
        }));

      // Format Classes
      const formattedClasses = allClasses.map(c => ({
        id: c.id,
        class_name: c.className,
        level: c.level || undefined,
        academic_year: c.academicYear || undefined
      }));

      // Format Subjects (Hanya mapel yang diikuti)
      let formattedSubjects = allSubjects.map(s => ({
        id: s.id,
        subject_name: s.subjectName,
        code: s.code || undefined,
        icon: s.icon || undefined
      }));

      if (!isTeacher && linkedSubjectIds.size > 0) {
        formattedSubjects = formattedSubjects.filter(s => linkedSubjectIds.has(s.id));
      }

      return res.json({
        success: true,
        classes: formattedClasses,
        subjects: formattedSubjects,
        subjectClasses: allSubjectClasses.map(sc => ({ id: sc.id, subject_id: sc.subjectId, class_id: sc.classId })),
        announcements: filteredAnnouncements,
        materials: filteredMaterials,
        assignments: filteredAssignments,
        evaluations: filteredEvaluations,
        students: filteredStudents,
        currentUser: {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          full_name: currentUser.full_name,
          role: currentUser.role,
          class_id: currentUser.class_id,
          nis: currentUser.nis,
          nip: currentUser.nip
        }
      });
    } catch (err: any) {
      console.error('Error in /api/data:', err);
      return res.status(500).json({ success: false, message: 'Gagal memuat data pembelajaran dari database.' });
    }
  });

  // -------------------------------------------------------------
  // STUDENT MANAGEMENT (Guru / Admin Only - PostgreSQL)
  // -------------------------------------------------------------

  app.post('/api/students', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { username, email, password, full_name, nis, class_id, phone } = req.body;

      if (!full_name || !password || !nis || !class_id) {
        return res.status(400).json({
          success: false,
          message: 'Nama lengkap, NIS, Kelas, dan Password wajib diisi!'
        });
      }

      const cleanNis = String(nis).trim();
      const cleanUsername = username ? String(username).trim().toLowerCase() : cleanNis;
      const cleanEmail = email ? String(email).trim().toLowerCase() : `${cleanUsername}@siswa.smp.belajar.id`;

      const existing = await db
        .select()
        .from(users)
        .where(or(eq(users.nis, cleanNis), eq(users.username, cleanUsername), eq(users.email, cleanEmail)));

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'NIS, Username, atau Email sudah terdaftar untuk siswa lain!'
        });
      }

      const newStudentUser = {
        id: `usr-siswa-${Date.now()}`,
        username: cleanUsername,
        email: cleanEmail,
        password: String(password).trim(),
        fullName: String(full_name).trim(),
        role: 'SISWA',
        nis: cleanNis,
        classId: String(class_id).trim(),
        phone: phone ? String(phone).trim() : null
      };

      await db.insert(users).values(newStudentUser);

      // Asynchronously mirror to Supabase users table
      (async () => {
        try {
          const { error } = await supabaseServer.from('users').insert({
            id: newStudentUser.id,
            username: newStudentUser.username,
            email: newStudentUser.email,
            password: newStudentUser.password,
            full_name: newStudentUser.fullName,
            role: newStudentUser.role,
            nis: newStudentUser.nis,
            class_id: newStudentUser.classId,
            phone: newStudentUser.phone
          });
          if (error && error.code !== 'PGRST205') {
            console.warn('[Supabase Sync]:', error.message);
          }
        } catch (_) {}
      })();

      return res.status(201).json({
        success: true,
        message: `Akun Siswa "${newStudentUser.fullName}" (NIS: ${newStudentUser.nis}) berhasil dibuat di database!`,
        student: newStudentUser
      });
    } catch (err: any) {
      console.error('Error creating student:', err);
      return res.status(500).json({ success: false, message: 'Gagal membuat akun siswa di database' });
    }
  });

  app.put('/api/students/:id', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { full_name, nis, class_id, password, email, phone } = req.body;

      const updateData: any = {};
      if (full_name) updateData.fullName = String(full_name).trim();
      if (nis) updateData.nis = String(nis).trim();
      if (class_id) updateData.classId = String(class_id).trim();
      if (email) updateData.email = String(email).trim().toLowerCase();
      if (phone !== undefined) updateData.phone = String(phone).trim();
      if (password && String(password).trim()) {
        updateData.password = String(password).trim();
      }

      await db.update(users).set(updateData).where(eq(users.id, id));

      return res.json({
        success: true,
        message: 'Data akun siswa berhasil diperbarui'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal memperbarui data siswa' });
    }
  });

  app.delete('/api/students/:id', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(users).where(eq(users.id, id));
      await db.delete(evaluations).where(eq(evaluations.studentId, id));

      return res.json({
        success: true,
        message: 'Akun siswa telah dihapus dari database.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menghapus siswa' });
    }
  });

  // -------------------------------------------------------------
  // MATERIALS MANAGEMENT
  // -------------------------------------------------------------

  app.post('/api/materials', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { subject_id, class_id, title, description, url, type } = req.body;
      if (!subject_id || !title) {
        return res.status(400).json({ success: false, message: 'Mata pelajaran dan Judul materi wajib diisi!' });
      }

      const newMaterial = {
        id: `mat-${Date.now()}`,
        subjectId: String(subject_id).trim(),
        classId: class_id ? String(class_id).trim() : 'ALL',
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        url: url ? String(url).trim() : '',
        type: (type as string) || 'pdf'
      };

      await db.insert(materials).values(newMaterial);

      return res.status(201).json({
        success: true,
        message: 'Materi pembelajaran berhasil ditambahkan!',
        material: newMaterial
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menyimpan materi ke database' });
    }
  });

  app.delete('/api/materials/:id', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(materials).where(eq(materials.id, id));
      return res.json({ success: true, message: 'Materi berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menghapus materi' });
    }
  });

  // -------------------------------------------------------------
  // ASSIGNMENTS MANAGEMENT
  // -------------------------------------------------------------

  app.post('/api/assignments', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { subject_id, class_id, title, description, due_date, max_score } = req.body;
      if (!subject_id || !title || !description) {
        return res.status(400).json({ success: false, message: 'Mata pelajaran, Judul, dan Deskripsi tugas wajib diisi!' });
      }

      const newAssignment = {
        id: `asg-${Date.now()}`,
        subjectId: String(subject_id).trim(),
        classId: class_id ? String(class_id).trim() : 'ALL',
        title: String(title).trim(),
        description: String(description).trim(),
        dueDate: due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        maxScore: max_score ? Number(max_score) : 100
      };

      await db.insert(assignments).values(newAssignment);

      return res.status(201).json({
        success: true,
        message: 'Tugas baru berhasil dibuat!',
        assignment: newAssignment
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal membuat tugas di database' });
    }
  });

  app.delete('/api/assignments/:id', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(assignments).where(eq(assignments.id, id));
      await db.delete(evaluations).where(eq(evaluations.assignmentId, id));
      return res.json({ success: true, message: 'Tugas berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menghapus tugas' });
    }
  });

  // -------------------------------------------------------------
  // SUBMISSIONS & EVALUATIONS
  // -------------------------------------------------------------

  app.post('/api/submissions', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { assignment_id, submission_text, submission_url } = req.body;
      const currentUser = req.user!;

      if (!assignment_id) {
        return res.status(400).json({ success: false, message: 'ID Tugas tidak valid' });
      }

      const existing = await db
        .select()
        .from(evaluations)
        .where(
          or(
            eq(evaluations.assignmentId, String(assignment_id))
          )
        );

      const studentEval = existing.find(e => e.studentId === currentUser.id);

      if (studentEval) {
        await db
          .update(evaluations)
          .set({
            submissionText: submission_text || studentEval.submissionText,
            submissionUrl: submission_url || studentEval.submissionUrl,
            isCollected: true,
            submittedAt: new Date()
          })
          .where(eq(evaluations.id, studentEval.id));

        return res.json({
          success: true,
          message: 'Tugas Anda berhasil diperbarui!'
        });
      }

      const newEval = {
        id: `eval-${Date.now()}`,
        assignmentId: String(assignment_id),
        studentId: currentUser.id,
        studentName: currentUser.full_name,
        nis: currentUser.nis || '',
        classId: currentUser.class_id || '',
        isCollected: true,
        submittedAt: new Date(),
        submissionText: submission_text ? String(submission_text).trim() : null,
        submissionUrl: submission_url ? String(submission_url).trim() : null,
        grade: null,
        teacherNotes: null
      };

      await db.insert(evaluations).values(newEval);

      return res.status(201).json({
        success: true,
        message: 'Tugas berhasil dikumpulkan ke Guru!',
        evaluation: newEval
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal mengumpulkan tugas' });
    }
  });

  app.post('/api/evaluations/grade', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { evaluation_id, assignment_id, student_id, grade, status, teacher_notes } = req.body;

      let computedGrade = grade !== undefined && grade !== '' ? Number(grade) : null;
      if (status === 'TUNTAS' && (computedGrade === null || computedGrade < 75)) {
        computedGrade = 85;
      } else if (status === 'REMIDIAL') {
        computedGrade = 60;
      } else if (status === 'BELUM') {
        computedGrade = null;
      }

      if (evaluation_id) {
        await db
          .update(evaluations)
          .set({
            grade: computedGrade,
            teacherNotes: teacher_notes ? String(teacher_notes).trim() : null,
            gradedAt: new Date()
          })
          .where(eq(evaluations.id, evaluation_id));

        return res.json({ success: true, message: 'Status evaluasi berhasil diperbarui!' });
      }

      if (assignment_id && student_id) {
        const student = await findUserById(student_id);
        const newEval = {
          id: `eval-${Date.now()}`,
          assignmentId: String(assignment_id),
          studentId: String(student_id),
          studentName: student ? student.fullName : 'Siswa',
          nis: student?.nis || '',
          classId: student?.classId || '',
          isCollected: true,
          submittedAt: new Date(),
          grade: computedGrade,
          teacherNotes: teacher_notes ? String(teacher_notes).trim() : null,
          gradedAt: new Date()
        };
        await db.insert(evaluations).values(newEval);
        return res.json({ success: true, message: 'Status evaluasi berhasil disimpan!' });
      }

      return res.status(400).json({ success: false, message: 'Parameter penilaian tidak lengkap' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menyimpan penilaian' });
    }
  });

  // -------------------------------------------------------------
  // ANNOUNCEMENTS MANAGEMENT
  // -------------------------------------------------------------

  app.post('/api/announcements', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { title, content, target_class_id, badge } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Judul dan isi pengumuman wajib diisi!' });
      }

      const newAnn = {
        id: `ann-${Date.now()}`,
        title: String(title).trim(),
        content: String(content).trim(),
        targetClassId: target_class_id ? String(target_class_id).trim() : 'ALL',
        authorName: req.user?.full_name || 'Admin Guru',
        startDate: new Date().toISOString().split('T')[0],
        badge: badge ? String(badge).trim() : (target_class_id === 'ALL' ? 'UMUM' : 'KELAS')
      };

      await db.insert(announcements).values(newAnn);

      return res.status(201).json({
        success: true,
        message: 'Pengumuman baru berhasil dipublikasikan!',
        announcement: newAnn
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal membuat pengumuman' });
    }
  });

  app.delete('/api/announcements/:id', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(announcements).where(eq(announcements.id, id));
      return res.json({ success: true, message: 'Pengumuman berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menghapus pengumuman' });
    }
  });

  // -------------------------------------------------------------
  // CLASSES & SUBJECTS MANAGEMENT
  // -------------------------------------------------------------

  app.post('/api/classes', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { class_name, level, academic_year } = req.body;
      if (!class_name) {
        return res.status(400).json({ success: false, message: 'Nama kelas wajib diisi!' });
      }

      const newClass = {
        id: `cls-${Date.now()}`,
        className: String(class_name).trim(),
        level: level ? String(level).trim() : 'Tingkat SMP',
        academicYear: academic_year ? String(academic_year).trim() : '2025/2026'
      };

      await db.insert(classes).values(newClass);

      return res.status(201).json({
        success: true,
        message: `Kelas "${newClass.className}" berhasil ditambahkan!`,
        newClass
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menambah kelas' });
    }
  });

  app.post('/api/subjects', authenticateToken, requireRoles(['GURU', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const { subject_name, code, icon } = req.body;
      if (!subject_name) {
        return res.status(400).json({ success: false, message: 'Nama mata pelajaran wajib diisi!' });
      }

      const newSubject = {
        id: `sbj-${Date.now()}`,
        subjectName: String(subject_name).trim(),
        code: code ? String(code).trim().toUpperCase() : 'MAPEL',
        icon: icon ? String(icon).trim() : '📖'
      };

      await db.insert(subjects).values(newSubject);

      return res.status(201).json({
        success: true,
        message: `Mata pelajaran "${newSubject.subjectName}" berhasil ditambahkan!`,
        newSubject
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal menambah mata pelajaran' });
    }
  });

  app.post('/api/reset-data', async (req: Request, res: Response) => {
    try {
      await seedInitialDataIfNeeded();
      return res.json({ success: true, message: 'Data telah disinkronkan dengan database PostgreSQL!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Gagal reset data' });
    }
  });

  // -------------------------------------------------------------
  // VITE / STATIC INTEGRATION
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Edubits Server] Terhubung ke PostgreSQL pada http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});

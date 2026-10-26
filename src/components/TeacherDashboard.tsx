import React, { useState } from 'react';
import { AppDataResponse, Assignment, Material, Announcement, Evaluation, User, ClassItem, SubjectItem } from '../types';
import { api } from '../lib/api';
import { Modal } from './Modal';
import {
  Users,
  BookOpen,
  FileText,
  Bell,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  ExternalLink,
  Award,
  Search,
  Filter,
  Copy,
  Check,
  FolderPlus,
  ShieldAlert,
  Send,
  MessageSquare,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface TeacherDashboardProps {
  appData: AppDataResponse;
  onRefreshData: () => Promise<void>;
  currentUser: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  appData,
  onRefreshData,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'materials' | 'assignments' | 'announcements' | 'classes'>('overview');

  // Filter & Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group expand states
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'mat-group-0': true,
    'asg-group-0': true
  });

  // Modal states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);

  // Forms states
  const [studentForm, setStudentForm] = useState({
    id: '',
    full_name: '',
    nis: '',
    class_id: appData.classes[0]?.id || 'cls-9a',
    username: '',
    email: '',
    password: 'siswa123',
    phone: ''
  });
  const [isEditingStudent, setIsEditingStudent] = useState(false);

  const [materialForm, setMaterialForm] = useState({
    subject_id: appData.subjects[0]?.id || 'sbj-inf',
    class_id: 'ALL',
    title: '',
    description: '',
    url: '',
    type: 'pdf' as 'pdf' | 'video' | 'link' | 'doc'
  });

  const [assignmentForm, setAssignmentForm] = useState({
    subject_id: appData.subjects[0]?.id || 'sbj-inf',
    class_id: 'ALL',
    title: '',
    description: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    max_score: 100
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    target_class_id: 'ALL',
    badge: 'PENTING'
  });

  const [classForm, setClassForm] = useState({
    class_name: '',
    level: 'Kelas 9',
    academic_year: '2025/2026'
  });

  const [subjectForm, setSubjectForm] = useState({
    subject_name: '',
    code: '',
    icon: '📚'
  });

  const [gradingData, setGradingData] = useState<{
    evaluation_id?: string;
    assignment_id: string;
    student_id: string;
    student_name: string;
    assignment_title: string;
    submission_text?: string;
    submission_url?: string;
    grade: number | string;
    status: 'TUNTAS' | 'REMIDIAL' | 'BELUM';
    teacher_notes: string;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleCopyCredentials = (s: any) => {
    const text = `KREDENSIAL LOGIN EDUBITS:\nNama: ${s.full_name}\nNIS: ${s.nis}\nEmail: ${s.email}\nPassword: siswa123`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Student CRUD
  const handleOpenAddStudent = () => {
    setIsEditingStudent(false);
    setStudentForm({
      id: '',
      full_name: '',
      nis: `202401${String(appData.students.length + 1).padStart(2, '0')}`,
      class_id: appData.classes[0]?.id || 'cls-9a',
      username: '',
      email: '',
      password: 'siswa123',
      phone: ''
    });
    setActionMsg(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (s: any) => {
    setIsEditingStudent(true);
    setStudentForm({
      id: s.id,
      full_name: s.full_name,
      nis: s.nis,
      class_id: s.class_id,
      username: s.username,
      email: s.email,
      password: '',
      phone: s.phone || ''
    });
    setActionMsg(null);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMsg(null);

    try {
      if (isEditingStudent) {
        await api.updateStudent(studentForm.id, studentForm);
        setActionMsg({ type: 'success', text: `Data siswa "${studentForm.full_name}" berhasil diperbarui!` });
      } else {
        await api.createStudent(studentForm);
        setActionMsg({ type: 'success', text: `Akun siswa baru "${studentForm.full_name}" berhasil dibuat!` });
      }
      await onRefreshData();
      setTimeout(() => setIsStudentModalOpen(false), 900);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Gagal menyimpan siswa' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus akun siswa "${name}"?`)) return;
    try {
      await api.deleteStudent(id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus siswa');
    }
  };

  // Material CRUD
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.addMaterial(materialForm);
      await onRefreshData();
      setIsMaterialModalOpen(false);
      setMaterialForm({
        subject_id: appData.subjects[0]?.id || 'sbj-inf',
        class_id: 'ALL',
        title: '',
        description: '',
        url: '',
        type: 'pdf'
      });
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan materi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm('Hapus materi pembelajaran ini?')) return;
    try {
      await api.deleteMaterial(id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus materi');
    }
  };

  // Assignment CRUD
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.addAssignment(assignmentForm);
      await onRefreshData();
      setIsAssignmentModalOpen(false);
      setAssignmentForm({
        subject_id: appData.subjects[0]?.id || 'sbj-inf',
        class_id: 'ALL',
        title: '',
        description: '',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        max_score: 100
      });
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tugas');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Hapus tugas ini beserta seluruh riwayat pengumpulannya?')) return;
    try {
      await api.deleteAssignment(id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tugas');
    }
  };

  // Grading
  const handleOpenGrading = (asg: Assignment, student: any, evalItem?: Evaluation) => {
    let initialStatus: 'TUNTAS' | 'REMIDIAL' | 'BELUM' = 'TUNTAS';
    let initialGrade = 85;

    if (evalItem) {
      if (evalItem.status) {
        initialStatus = evalItem.status;
      } else if (evalItem.grade !== null && evalItem.grade !== undefined) {
        initialStatus = evalItem.grade >= 75 ? 'TUNTAS' : 'REMIDIAL';
      } else {
        initialStatus = 'BELUM';
      }
      initialGrade = evalItem.grade !== undefined && evalItem.grade !== null ? evalItem.grade : (initialStatus === 'TUNTAS' ? 85 : 60);
    }

    setGradingData({
      evaluation_id: evalItem?.id,
      assignment_id: asg.id,
      student_id: student.id,
      student_name: student.full_name,
      assignment_title: asg.title,
      submission_text: evalItem?.submission_text,
      submission_url: evalItem?.submission_url,
      grade: initialGrade,
      status: initialStatus,
      teacher_notes: evalItem?.teacher_notes || (initialStatus === 'TUNTAS' ? 'Tugas telah dikumpulkan langsung dan dinilai TUNTAS.' : '')
    });
    setGradingModalOpen(true);
  };

  const handleSaveGrading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingData) return;
    setActionLoading(true);

    try {
      await api.gradeEvaluation({
        evaluation_id: gradingData.evaluation_id,
        assignment_id: gradingData.assignment_id,
        student_id: gradingData.student_id,
        grade: Number(gradingData.grade),
        status: gradingData.status,
        teacher_notes: gradingData.teacher_notes
      });
      await onRefreshData();
      setGradingModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan nilai');
    } finally {
      setActionLoading(false);
    }
  };

  // Announcements CRUD
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.addAnnouncement(announcementForm);
      await onRefreshData();
      setIsAnnouncementModalOpen(false);
      setAnnouncementForm({
        title: '',
        content: '',
        target_class_id: 'ALL',
        badge: 'PENTING'
      });
    } catch (err: any) {
      alert(err.message || 'Gagal mempublikasikan pengumuman');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Hapus pengumuman ini?')) return;
    try {
      await api.deleteAnnouncement(id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengumuman');
    }
  };

  // Classes & Subjects
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addClass(classForm);
      await onRefreshData();
      setIsClassModalOpen(false);
      setClassForm({ class_name: '', level: 'Kelas 9', academic_year: '2025/2026' });
    } catch (err: any) {
      alert(err.message || 'Gagal menambah kelas');
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addSubject(subjectForm);
      await onRefreshData();
      setIsSubjectModalOpen(false);
      setSubjectForm({ subject_name: '', code: '', icon: '📚' });
    } catch (err: any) {
      alert(err.message || 'Gagal menambah mata pelajaran');
    }
  };

  // Filtered students
  const filteredStudents = appData.students.filter(s => {
    const matchSearch =
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchClass = studentClassFilter === 'ALL' || s.class_id === studentClassFilter;
    return matchSearch && matchClass;
  });

  // Calculate pending grading submissions
  const pendingGradingCount = appData.evaluations.filter(e => e.is_collected && (e.grade === null || e.grade === undefined)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Teacher Welcome Header */}
      <div className="pixel-box bg-white p-4 sm:p-6 shadow-pixel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-amber-400 border-3 border-black flex items-center justify-center font-pixel text-xl shadow-pixel-sm">
              👨‍🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-pixel text-slate-900">
                  PANEL GURU & ADMIN UTAMA
                </h1>
                <span className="bg-amber-300 text-black text-[9px] font-pixel px-2 py-0.5 rounded border border-black">
                  ADMINISTRATOR
                </span>
              </div>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                {currentUser.full_name} | NIP: {currentUser.nip || '-'}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddStudent}
            className="pixel-btn bg-[#FFDE59] hover:bg-yellow-400 text-black py-2 px-3 text-xs gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ BUAT AKUN SISWA BARU</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pixel-btn py-2 px-3 text-[10px] sm:text-xs gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-[#FFDE59] text-black'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>RINGKASAN</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pixel-btn py-2 px-3 text-[10px] sm:text-xs gap-1.5 ${
            activeTab === 'students'
              ? 'bg-purple-300 text-black'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>MANAJEMEN SISWA ({appData.students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`pixel-btn py-2 px-3 text-[10px] sm:text-xs gap-1.5 ${
            activeTab === 'materials'
              ? 'bg-blue-300 text-black'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>MATERI PELAJARAN ({appData.materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pixel-btn py-2 px-3 text-[10px] sm:text-xs gap-1.5 ${
            activeTab === 'assignments'
              ? 'bg-emerald-300 text-black'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>TUGAS & PENILAIAN ({appData.assignments.length})</span>
          {pendingGradingCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-1 rounded-full font-mono">
              {pendingGradingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`pixel-btn py-2 px-3 text-[10px] sm:text-xs gap-1.5 ${
            activeTab === 'announcements'
              ? 'bg-yellow-300 text-black'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>PENGUMUMAN ({appData.announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`pixel-btn py-2 px-3 text-[10px] sm:text-xs gap-1.5 ${
            activeTab === 'classes'
              ? 'bg-rose-300 text-black'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>KELAS & MAPEL</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB: OVERVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="pixel-box bg-white p-4 shadow-pixel">
              <span className="text-[10px] font-pixel text-slate-500 block">TOTAL SISWA</span>
              <div className="font-pixel text-2xl text-purple-700 mt-1">
                {appData.students.length}
              </div>
              <span className="text-[10px] font-mono text-slate-600 block mt-1">
                Terdaftar di sistem
              </span>
            </div>

            <div className="pixel-box bg-white p-4 shadow-pixel">
              <span className="text-[10px] font-pixel text-slate-500 block">TOTAL MATERI</span>
              <div className="font-pixel text-2xl text-blue-700 mt-1">
                {appData.materials.length}
              </div>
              <span className="text-[10px] font-mono text-slate-600 block mt-1">
                Modul di seluruh mapel
              </span>
            </div>

            <div className="pixel-box bg-white p-4 shadow-pixel">
              <span className="text-[10px] font-pixel text-slate-500 block">TOTAL TUGAS</span>
              <div className="font-pixel text-2xl text-emerald-700 mt-1">
                {appData.assignments.length}
              </div>
              <span className="text-[10px] font-mono text-slate-600 block mt-1">
                Tugas aktif dibagikan
              </span>
            </div>

            <div className="pixel-box bg-white p-4 shadow-pixel">
              <span className="text-[10px] font-pixel text-slate-500 block">PENGUMPULAN TUGAS</span>
              <div className="font-pixel text-2xl text-amber-600 mt-1">
                {appData.evaluations.length}
              </div>
              <span className="text-[10px] font-mono text-slate-600 block mt-1">
                {pendingGradingCount} perlu dinilai
              </span>
            </div>
          </div>

          {/* Quick Actions & Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pixel-box bg-[#FFFDF5] p-5 shadow-pixel space-y-3">
              <h3 className="font-pixel text-xs text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AKSI CEPAT GURU (ADMIN UTAMA)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleOpenAddStudent}
                  className="pixel-btn bg-white hover:bg-slate-50 text-black py-2.5 px-3 text-[10px] justify-start gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>+ Tambah Akun Siswa</span>
                </button>

                <button
                  onClick={() => setIsMaterialModalOpen(true)}
                  className="pixel-btn bg-white hover:bg-slate-50 text-black py-2.5 px-3 text-[10px] justify-start gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Tambah Materi Mapel</span>
                </button>

                <button
                  onClick={() => setIsAssignmentModalOpen(true)}
                  className="pixel-btn bg-white hover:bg-slate-50 text-black py-2.5 px-3 text-[10px] justify-start gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Buat Tugas Baru</span>
                </button>

                <button
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="pixel-btn bg-white hover:bg-slate-50 text-black py-2.5 px-3 text-[10px] justify-start gap-2"
                >
                  <Bell className="w-3.5 h-3.5 text-yellow-600" />
                  <span>+ Buat Pengumuman</span>
                </button>
              </div>
            </div>

            <div className="pixel-box bg-white p-5 shadow-pixel space-y-3">
              <h3 className="font-pixel text-xs text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                STATUS AKADEMIK & KELAS
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                  <span className="text-slate-500 text-[10px] block">TAHUN AJARAN</span>
                  <strong className="text-slate-900">2025/2026</strong>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                  <span className="text-slate-500 text-[10px] block">TOTAL KELAS</span>
                  <strong className="text-slate-900">{appData.classes.length} Rombel</strong>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                  <span className="text-slate-500 text-[10px] block">MATA PELAJARAN</span>
                  <strong className="text-slate-900">{appData.subjects.length} Mapel</strong>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                  <span className="text-slate-500 text-[10px] block">PENGUMUMAN</span>
                  <strong className="text-slate-900">{appData.announcements.length} Aktif</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: MANAJEMEN SISWA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                DAFTAR AKUN SISWA (DIBUAT OLEH GURU)
              </h2>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                Hanya guru yang berhak mendaftarkan dan mengelola akun siswa.
              </p>
            </div>

            <button
              onClick={handleOpenAddStudent}
              className="pixel-btn bg-[#FFDE59] text-black py-2 px-3 text-xs gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>TAMBAH SISWA BARU</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="pixel-box bg-white p-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Cari nama, NIS, atau email..."
                className="w-full pixel-input pl-9 text-xs font-mono py-1.5"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={studentClassFilter}
                onChange={(e) => setStudentClassFilter(e.target.value)}
                className="pixel-input text-xs font-mono py-1.5"
              >
                <option value="ALL">Semua Kelas ({appData.students.length})</option>
                {appData.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Table / Cards */}
          <div className="pixel-box bg-white overflow-x-auto shadow-pixel">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#FFDE59] border-b-3 border-black text-black font-pixel text-[10px]">
                  <th className="p-3">NIS</th>
                  <th className="p-3">NAMA LENGKAP</th>
                  <th className="p-3">KELAS</th>
                  <th className="p-3">USERNAME / EMAIL</th>
                  <th className="p-3">TUGAS DIKUMPULKAN</th>
                  <th className="p-3 text-center">AKSI & KREDENSIAL</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 font-pixel text-xs">
                      TIDAK ADA SISWA DITEMUKAN
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const studentClass = appData.classes.find(c => c.id === s.class_id);
                    const studentEvals = appData.evaluations.filter(e => e.student_id === s.id);

                    return (
                      <tr key={s.id} className="hover:bg-amber-50/60 transition-colors">
                        <td className="p-3 font-bold text-black font-pixel text-[11px]">
                          {s.nis}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {s.full_name}
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-pixel px-2 py-0.5 rounded border border-black">
                            {studentClass?.class_name || s.class_id}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>{s.email}</div>
                          <div className="text-[10px] text-slate-400">user: {s.username}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-black">{studentEvals.length} Tugas</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Copy credentials button */}
                            <button
                              onClick={() => handleCopyCredentials(s)}
                              className="p-1.5 bg-white hover:bg-slate-100 rounded border border-black shadow-pixel-sm text-[10px] flex items-center gap-1"
                              title="Salin kredensial untuk diberikan kepada siswa"
                            >
                              {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                              <span className="text-[9px] font-pixel hidden lg:inline">
                                {copiedId === s.id ? 'TERSALIN' : 'KREDENSIAL'}
                              </span>
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="p-1.5 bg-white hover:bg-slate-100 rounded border border-black shadow-pixel-sm text-blue-600"
                              title="Edit Siswa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteStudent(s.id, s.full_name)}
                              className="p-1.5 bg-white hover:bg-red-50 rounded border border-black shadow-pixel-sm text-red-600"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: MATERI PELAJARAN (Grouped by Mapel) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                MATERI PEMBELAJARAN (DIKELOMPOKKAN PER MAPEL)
              </h2>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                Struktur sesuai fungsi aslinya: Modul diorganisasi berdasarkan Mata Pelajaran.
              </p>
            </div>

            <button
              onClick={() => setIsMaterialModalOpen(true)}
              className="pixel-btn bg-[#FFDE59] text-black py-2 px-3 text-xs gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ TAMBAH MATERI BARU</span>
            </button>
          </div>

          {/* Grouped Materials list */}
          <div className="space-y-4">
            {appData.subjects.map((subj, idx) => {
              const subjMaterials = appData.materials.filter(
                m => String(m.subject_id) === String(subj.id)
              );
              const groupId = `mat-group-${idx}`;
              const isExpanded = expandedGroups[groupId] !== false;

              return (
                <div key={subj.id} className="pixel-box bg-white overflow-hidden shadow-pixel">
                  <div
                    onClick={() => toggleGroup(groupId)}
                    className="p-3 bg-[#FFDE59] border-b-4 border-black flex justify-between items-center cursor-pointer hover:bg-yellow-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{subj.icon || '📘'}</span>
                      <span className="font-pixel text-xs text-black">
                        MAPEL: {subj.subject_name} ({subjMaterials.length} Materi)
                      </span>
                    </div>
                    <span className="font-pixel text-xs text-black">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="p-3 space-y-3 bg-[#FFFDF5]">
                      {subjMaterials.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 font-mono">
                          Belum ada materi untuk mata pelajaran ini. Klik "+ Tambah Materi Baru".
                        </p>
                      ) : (
                        subjMaterials.map(m => {
                          const targetClass = appData.classes.find(c => c.id === m.class_id);
                          const classLabel = m.class_id === 'ALL' ? 'Semua Kelas' : (targetClass?.class_name || m.class_id);

                          return (
                            <div
                              key={m.id}
                              className="p-3 bg-white border-2 border-black rounded shadow-pixel-sm space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-pixel text-slate-900">
                                      {m.title}
                                    </h4>
                                    <span className="text-[9px] font-pixel px-1.5 py-0.2 rounded border border-black bg-purple-100">
                                      {classLabel}
                                    </span>
                                  </div>
                                  {m.description && (
                                    <p className="text-xs font-mono text-slate-600 mt-1">
                                      {m.description}
                                    </p>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteMaterial(m.id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded"
                                  title="Hapus Materi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] font-mono text-slate-500">
                                  Dibuat: {new Date(m.created_at).toLocaleDateString('id-ID')}
                                </span>
                                {m.url && (
                                  <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pixel-btn bg-[#2563EB] hover:bg-blue-700 text-white text-[9px] py-1 px-3 gap-1"
                                  >
                                    <span>BUKA TAUTAN MATERI</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: TUGAS & PENILAIAN (Grouped by Mapel & Submissions) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                TUGAS & PENILAIAN SISWA (GRADING HUB)
              </h2>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                Periksa pengumpulan tugas siswa, berikan nilai numerik (0-100) dan catatan evaluasi guru.
              </p>
            </div>

            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="pixel-btn bg-emerald-400 hover:bg-emerald-500 text-black py-2 px-3 text-xs gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ BUAT TUGAS BARU</span>
            </button>
          </div>

          <div className="space-y-4">
            {appData.subjects.map((subj, idx) => {
              const subjAssignments = appData.assignments.filter(
                a => String(a.subject_id) === String(subj.id)
              );
              const groupId = `asg-group-${idx}`;
              const isExpanded = expandedGroups[groupId] !== false;

              return (
                <div key={subj.id} className="pixel-box bg-white overflow-hidden shadow-pixel">
                  <div
                    onClick={() => toggleGroup(groupId)}
                    className="p-3 bg-emerald-500 text-white border-b-4 border-black flex justify-between items-center cursor-pointer hover:bg-emerald-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-xs">
                        📝 MAPEL: {subj.subject_name} ({subjAssignments.length} Tugas)
                      </span>
                    </div>
                    <span className="font-pixel text-xs text-white">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="p-3 space-y-4 bg-[#F8FAFC]">
                      {subjAssignments.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 font-mono">
                          Belum ada tugas untuk mata pelajaran ini.
                        </p>
                      ) : (
                        subjAssignments.map(asg => {
                          const targetClass = appData.classes.find(c => c.id === asg.class_id);
                          const classLabel = asg.class_id === 'ALL' ? 'Semua Kelas' : (targetClass?.class_name || asg.class_id);
                          const submissions = appData.evaluations.filter(e => e.assignment_id === asg.id);

                          return (
                            <div
                              key={asg.id}
                              className="p-4 bg-white border-2 border-black rounded shadow-pixel-sm space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-pixel text-slate-900">
                                      {asg.title}
                                    </h4>
                                    <span className="text-[9px] font-pixel px-2 py-0.5 rounded border border-black bg-yellow-200">
                                      {classLabel}
                                    </span>
                                  </div>
                                  <p className="text-xs font-mono text-slate-700 mt-1">
                                    {asg.description}
                                  </p>
                                  <div className="text-[10px] font-mono text-amber-800 font-bold mt-1">
                                    Batas Waktu: {asg.due_date ? new Date(asg.due_date).toLocaleDateString('id-ID') : '-'}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteAssignment(asg.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Hapus Tugas"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Submissions Section */}
                              <div className="pt-2 border-t-2 border-black space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="text-[11px] font-pixel text-slate-800 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-blue-600" />
                                    STATUS EVALUASI SISWA:
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-600">
                                    (Tugas dikumpulkan langsung ke guru secara fisik)
                                  </span>
                                </div>

                                {(() => {
                                  const targetStudents = asg.class_id === 'ALL'
                                    ? appData.students
                                    : appData.students.filter(s => s.class_id === asg.class_id);

                                  if (targetStudents.length === 0) {
                                    return (
                                      <div className="p-3 bg-slate-50 border border-dashed border-slate-400 rounded text-xs font-mono text-slate-500 text-center">
                                        Belum ada siswa terdaftar pada kelas tugas ini.
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {targetStudents.map(student => {
                                        const sub = appData.evaluations.find(
                                          e => e.assignment_id === asg.id && e.student_id === student.id
                                        );
                                        const status = sub?.status || (sub?.grade !== null && sub?.grade !== undefined ? (sub.grade >= 75 ? 'TUNTAS' : 'REMIDIAL') : 'BELUM');

                                        const badgeColor = status === 'TUNTAS'
                                          ? 'bg-emerald-500 text-white'
                                          : status === 'REMIDIAL'
                                          ? 'bg-red-500 text-white'
                                          : 'bg-amber-300 text-black';

                                        return (
                                          <div
                                            key={student.id}
                                            className="p-3 bg-white border-2 border-black rounded shadow-pixel-sm space-y-1.5 font-mono text-xs"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <strong className="text-slate-900 truncate">
                                                {student.full_name} <span className="font-normal text-slate-600">(NIS: {student.nis || '-'})</span>
                                              </strong>
                                              <span className={`font-pixel text-[9px] px-2 py-0.5 rounded border border-black ${badgeColor}`}>
                                                {status}
                                              </span>
                                            </div>

                                            {sub?.teacher_notes && (
                                              <div className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200">
                                                <em>"{sub.teacher_notes}"</em>
                                              </div>
                                            )}

                                            <div className="pt-1 flex items-center justify-between">
                                              <span className="text-[10px] text-slate-500">
                                                {sub ? `Internal: ${sub.grade ?? '-'}/100` : 'Belum dievaluasi'}
                                              </span>
                                              <button
                                                onClick={() => handleOpenGrading(asg, { id: student.id, full_name: student.full_name, nis: student.nis }, sub)}
                                                className="pixel-btn bg-amber-100 hover:bg-yellow-200 text-black text-[9px] py-1 px-2.5 gap-1"
                                              >
                                                <Award className="w-3 h-3 text-amber-700" />
                                                <span>{sub ? 'UBAH EVALUASI' : 'BERI EVALUASI (TUNTAS/REMIDIAL)'}</span>
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: PENGUMUMAN */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-yellow-600" />
                PENGUMUMAN SEKOLAH & KELAS
              </h2>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                Pengumuman dapat ditujukan untuk seluruh sekolah (ALL) atau kelas tertentu.
              </p>
            </div>

            <button
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="pixel-btn bg-yellow-300 text-black py-2 px-3 text-xs gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ BUAT PENGUMUMAN</span>
            </button>
          </div>

          <div className="space-y-3">
            {appData.announcements.map((ann) => (
              <div
                key={ann.id}
                className="pixel-box bg-white p-4 space-y-2 shadow-pixel"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-pixel text-xs sm:text-sm text-slate-900">
                      {ann.title}
                    </h3>
                    <span className="text-[9px] font-pixel px-2 py-0.5 rounded border border-black bg-yellow-200">
                      {ann.badge || (ann.target_class_id === 'ALL' ? 'UMUM' : 'KELAS')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                  <span>Author: <strong className="text-slate-800">{ann.author_name}</strong></span>
                  <span>{new Date(ann.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: KELAS & MAPEL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Classes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-pixel text-xs text-slate-900">
                DAFTAR KELAS ({appData.classes.length})
              </h3>
              <button
                onClick={() => setIsClassModalOpen(true)}
                className="pixel-btn bg-white hover:bg-slate-100 text-black py-1.5 px-2.5 text-[10px] gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ KELAS</span>
              </button>
            </div>

            <div className="space-y-2">
              {appData.classes.map(c => {
                const count = appData.students.filter(s => s.class_id === c.id).length;
                return (
                  <div key={c.id} className="p-3 bg-white border-2 border-black rounded shadow-pixel-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{c.class_name}</h4>
                      <p className="text-[11px] font-mono text-slate-500">
                        {c.level || 'Tingkat SMP'} | TA: {c.academic_year || '2025/2026'}
                      </p>
                    </div>
                    <span className="font-pixel text-[10px] bg-emerald-100 border border-black px-2 py-0.5 rounded">
                      {count} SISWA
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-pixel text-xs text-slate-900">
                MATA PELAJARAN ({appData.subjects.length})
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="pixel-btn bg-white hover:bg-slate-100 text-black py-1.5 px-2.5 text-[10px] gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ MAPEL</span>
              </button>
            </div>

            <div className="space-y-2">
              {appData.subjects.map(subj => {
                const matCount = appData.materials.filter(m => m.subject_id === subj.id).length;
                const asgCount = appData.assignments.filter(a => a.subject_id === subj.id).length;

                return (
                  <div key={subj.id} className="p-3 bg-white border-2 border-black rounded shadow-pixel-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{subj.icon || '📖'}</span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{subj.subject_name}</h4>
                        <p className="text-[11px] font-mono text-slate-500">
                          Kode: {subj.code || 'MAPEL'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-600">
                      <div>{matCount} Materi</div>
                      <div>{asgCount} Tugas</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT STUDENT ACCOUNT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={isEditingStudent ? 'EDIT DATA SISWA' : 'BUAT AKUN SISWA BARU (GURU)'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          {actionMsg && (
            <div className={`p-3 rounded border text-xs font-mono ${
              actionMsg.type === 'success' ? 'bg-green-100 border-green-700 text-green-900' : 'bg-red-100 border-red-700 text-red-900'
            }`}>
              {actionMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">
                NAMA LENGKAP SISWA: *
              </label>
              <input
                type="text"
                required
                value={studentForm.full_name}
                onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                placeholder="Contoh: Rian Pratama"
                className="w-full pixel-input text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">
                NOMOR INDUK SISWA (NIS): *
              </label>
              <input
                type="text"
                required
                value={studentForm.nis}
                onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value })}
                placeholder="Contoh: 20240105"
                className="w-full pixel-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">
                KELAS SISWA: *
              </label>
              <select
                required
                value={studentForm.class_id}
                onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              >
                {appData.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">
                PASSWORD AKUN: *
              </label>
              <input
                type="text"
                required={!isEditingStudent}
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder={isEditingStudent ? '(Kosongkan jika tidak diubah)' : 'Password awal siswa'}
                className="w-full pixel-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">
              EMAIL / USERNAME SISWA (OPSIONAL):
            </label>
            <input
              type="text"
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              placeholder="Otomatis dari NIS atau username@siswa.smp.belajar.id"
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
              className="pixel-btn bg-white text-black px-4 py-2 text-xs"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="pixel-btn bg-[#FFDE59] text-black px-5 py-2 text-xs font-pixel disabled:opacity-50"
            >
              {actionLoading ? 'MENYIMPAN...' : isEditingStudent ? 'SIMPAN PERUBAHAN' : 'BUAT AKUN SISWA 🚀'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD MATERIAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        title="TAMBAH MATERI PEMBELAJARAN"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">MATA PELAJARAN: *</label>
              <select
                required
                value={materialForm.subject_id}
                onChange={(e) => setMaterialForm({ ...materialForm, subject_id: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              >
                {appData.subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.subject_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">TARGET KELAS: *</label>
              <select
                required
                value={materialForm.class_id}
                onChange={(e) => setMaterialForm({ ...materialForm, class_id: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              >
                <option value="ALL">Semua Kelas</option>
                {appData.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">JUDUL MATERI: *</label>
            <input
              type="text"
              required
              value={materialForm.title}
              onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
              placeholder="Contoh: Modul Pemrograman Looping dan Array"
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">DESKRIPSI RINGKAS:</label>
            <textarea
              rows={2}
              value={materialForm.description}
              onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
              placeholder="Penjelasan ringkas tentang isi modul ini..."
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-pixel text-slate-800">URL TAUTAN MATERI: *</label>
              <input
                type="url"
                required
                value={materialForm.url}
                onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                placeholder="https://drive.google.com/... atau https://youtube.com/..."
                className="w-full pixel-input text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">TIPE FORMAT:</label>
              <select
                value={materialForm.type}
                onChange={(e: any) => setMaterialForm({ ...materialForm, type: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              >
                <option value="pdf">PDF Dokumen</option>
                <option value="video">Video Pembelajaran</option>
                <option value="doc">Google Docs / Slide</option>
                <option value="link">Tautan Web</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMaterialModalOpen(false)}
              className="pixel-btn bg-white text-black px-4 py-2 text-xs"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="pixel-btn bg-blue-400 hover:bg-blue-500 text-black px-5 py-2 text-xs font-pixel"
            >
              SIMPAN MATERI 📘
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD ASSIGNMENT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="BUAT TUGAS BARU"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">MATA PELAJARAN: *</label>
              <select
                required
                value={assignmentForm.subject_id}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, subject_id: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              >
                {appData.subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.subject_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">TARGET KELAS: *</label>
              <select
                required
                value={assignmentForm.class_id}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              >
                <option value="ALL">Semua Kelas</option>
                {appData.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">JUDUL TUGAS: *</label>
            <input
              type="text"
              required
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              placeholder="Contoh: Tugas 03: Desain Flowchart Algoritma"
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">PETUNJUK PENGERJAAN: *</label>
            <textarea
              rows={3}
              required
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              placeholder="Tuliskan instruksi lengkap untuk dikerjakan siswa..."
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">BATAS WAKTU (DEADLINE):</label>
              <input
                type="date"
                required
                value={assignmentForm.due_date}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">SKOR MAKSIMAL:</label>
              <input
                type="number"
                min={10}
                max={100}
                value={assignmentForm.max_score}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, max_score: Number(e.target.value) })}
                className="w-full pixel-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignmentModalOpen(false)}
              className="pixel-btn bg-white text-black px-4 py-2 text-xs"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="pixel-btn bg-emerald-400 hover:bg-emerald-500 text-black px-5 py-2 text-xs font-pixel"
            >
              BAGIKAN TUGAS ������
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: GRADING / EVALUASI GURU */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={gradingModalOpen}
        onClose={() => setGradingModalOpen(false)}
        title="BERI NILAI & EVALUASI GURU"
      >
        {gradingData && (
          <form onSubmit={handleSaveGrading} className="space-y-4">
            <div className="p-3 bg-amber-50 border-2 border-black rounded space-y-1 font-mono text-xs">
              <p><strong>Tugas:</strong> {gradingData.assignment_title}</p>
              <p><strong>Siswa:</strong> {gradingData.student_name}</p>
              {gradingData.submission_text && (
                <div className="mt-2 bg-white p-2 rounded border border-slate-300">
                  <span className="text-slate-500 text-[10px] block">Jawaban Siswa:</span>
                  <p className="text-slate-900 italic">"{gradingData.submission_text}"</p>
                </div>
              )}
              {gradingData.submission_url && (
                <p className="pt-1">
                  <strong>Lampiran Link:</strong>{' '}
                  <a
                    href={gradingData.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    {gradingData.submission_url}
                  </a>
                </p>
              )}
            </div>

            {/* Pilihan Status Kualitatif Sesuai Arahan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-pixel text-slate-800">
                PILIH HASIL STATUS EVALUASI SISWA: *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGradingData({
                    ...gradingData,
                    status: 'TUNTAS',
                    grade: 85,
                    teacher_notes: gradingData.teacher_notes || 'Tugas telah diperiksa dan dinyatakan TUNTAS.'
                  })}
                  className={`pixel-btn py-2 px-2 text-xs flex flex-col items-center gap-1 transition-all ${
                    gradingData.status === 'TUNTAS'
                      ? 'bg-emerald-500 text-white shadow-pixel'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  <span className="font-pixel text-xs">✔️ TUNTAS</span>
                  <span className="text-[9px] font-mono">Memenuhi KKM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGradingData({
                    ...gradingData,
                    status: 'REMIDIAL',
                    grade: 60,
                    teacher_notes: gradingData.teacher_notes || 'Perlu perbaikan/remidial pada bagian materi yang belum dikuasai.'
                  })}
                  className={`pixel-btn py-2 px-2 text-xs flex flex-col items-center gap-1 transition-all ${
                    gradingData.status === 'REMIDIAL'
                      ? 'bg-red-500 text-white shadow-pixel'
                      : 'bg-red-50 text-red-900 hover:bg-red-100'
                  }`}
                >
                  <span className="font-pixel text-xs">⚠️ REMIDIAL</span>
                  <span className="text-[9px] font-mono">Perlu Perbaikan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGradingData({
                    ...gradingData,
                    status: 'BELUM',
                    grade: 0,
                    teacher_notes: gradingData.teacher_notes || 'Tugas belum diserahkan secara fisik kepada guru.'
                  })}
                  className={`pixel-btn py-2 px-2 text-xs flex flex-col items-center gap-1 transition-all ${
                    gradingData.status === 'BELUM'
                      ? 'bg-amber-400 text-black shadow-pixel'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <span className="font-pixel text-xs">⏳ BELUM</span>
                  <span className="text-[9px] font-mono">Belum Mengumpulkan</span>
                </button>
              </div>

              <div className="p-2 bg-blue-50 border border-blue-400 rounded text-[11px] font-mono text-blue-900">
                💡 <strong>Catatan Sistem:</strong> Pada akun Siswa <strong>TIDAK AKAN</strong> menampilkan skor angka, melainkan hanya status kualitatif (<strong>{gradingData.status}</strong>) dan catatan evaluasi guru di bawah ini.
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">
                NILAI INTERNAL GURU (0 - 100): *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={gradingData.grade}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  let st = gradingData.status;
                  if (val >= 75) st = 'TUNTAS';
                  else if (val > 0) st = 'REMIDIAL';
                  setGradingData({ ...gradingData, grade: e.target.value, status: st });
                }}
                className="w-full pixel-input text-base font-pixel"
              />
              <span className="text-[10px] font-mono text-slate-500 block">
                (Nilai angka ini hanya diarsipkan untuk rekap guru, disembunyikan dari siswa)
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">
                CATATAN & EVALUASI GURU:
              </label>
              <textarea
                rows={3}
                value={gradingData.teacher_notes}
                onChange={(e) => setGradingData({ ...gradingData, teacher_notes: e.target.value })}
                placeholder="Tuliskan umpan balik konstruktif untuk siswa..."
                className="w-full pixel-input text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGradingModalOpen(false)}
                className="pixel-btn bg-white text-black px-4 py-2 text-xs"
              >
                BATAL
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="pixel-btn bg-[#FFDE59] text-black px-5 py-2 text-xs font-pixel"
              >
                SIMPAN PENILAIAN ⭐
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD ANNOUNCEMENT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        title="BUAT PENGUMUMAN BARU"
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">JUDUL PENGUMUMAN: *</label>
            <input
              type="text"
              required
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              placeholder="Contoh: Jadwal Ujian Praktik Komputer"
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">TARGET KELAS:</label>
              <select
                value={announcementForm.target_class_id}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, target_class_id: e.target.value })}
                className="w-full pixel-input text-xs font-mono"
              >
                <option value="ALL">Semua Kelas (Umum)</option>
                {appData.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">BADGE LABEL:</label>
              <input
                type="text"
                value={announcementForm.badge}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, badge: e.target.value })}
                placeholder="PENTING / INFO / UJIAN"
                className="w-full pixel-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">ISI PENGUMUMAN: *</label>
            <textarea
              rows={4}
              required
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              placeholder="Tuliskan detail pengumuman..."
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAnnouncementModalOpen(false)}
              className="pixel-btn bg-white text-black px-4 py-2 text-xs"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="pixel-btn bg-yellow-300 text-black px-5 py-2 text-xs font-pixel"
            >
              PUBLIKASIKAN 📢
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD CLASS */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="TAMBAH KELAS BARU"
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">NAMA KELAS: *</label>
            <input
              type="text"
              required
              value={classForm.class_name}
              onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
              placeholder="Contoh: Kelas IX-C"
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">TINGKAT:</label>
              <input
                type="text"
                value={classForm.level}
                onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                placeholder="Kelas 9"
                className="w-full pixel-input text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">TAHUN AJARAN:</label>
              <input
                type="text"
                value={classForm.academic_year}
                onChange={(e) => setClassForm({ ...classForm, academic_year: e.target.value })}
                placeholder="2025/2026"
                className="w-full pixel-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsClassModalOpen(false)}
              className="pixel-btn bg-white text-black px-4 py-2 text-xs"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="pixel-btn bg-[#FFDE59] text-black px-5 py-2 text-xs font-pixel"
            >
              TAMBAH KELAS 🏫
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD SUBJECT */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="TAMBAH MATA PELAJARAN BARU"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-800">NAMA MATA PELAJARAN: *</label>
            <input
              type="text"
              required
              value={subjectForm.subject_name}
              onChange={(e) => setSubjectForm({ ...subjectForm, subject_name: e.target.value })}
              placeholder="Contoh: Pendidikan Seni & Budaya"
              className="w-full pixel-input text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">KODE MAPEL:</label>
              <input
                type="text"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                placeholder="SNB-06"
                className="w-full pixel-input text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-800">IKON EMOJI:</label>
              <input
                type="text"
                value={subjectForm.icon}
                onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })}
                placeholder="🎨"
                className="w-full pixel-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="pixel-btn bg-white text-black px-4 py-2 text-xs"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="pixel-btn bg-[#FFDE59] text-black px-5 py-2 text-xs font-pixel"
            >
              TAMBAH MAPEL 📘
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

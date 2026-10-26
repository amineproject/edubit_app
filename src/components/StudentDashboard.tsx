import React, { useState } from 'react';
import { AppDataResponse, Assignment, Material, Announcement, Evaluation, User } from '../types';
import { 
  BookOpen, 
  FileText, 
  Bell, 
  ExternalLink, 
  User as UserIcon, 
  Award, 
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info
} from 'lucide-react';

interface StudentDashboardProps {
  appData: AppDataResponse;
  onRefreshData: () => Promise<void>;
  currentUser: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  appData,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'materi' | 'tugas' | 'pengumuman' | 'profil'>('materi');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'mat-0': true,
    'asg-0': true
  });

  const studentClass = appData.classes.find(c => c.id === currentUser.class_id);
  const studentClassName = studentClass ? studentClass.class_name : 'Kelas Belum Ditentukan';
  const studentClassId = currentUser.class_id || '';

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // 1. Tentukan Mata Pelajaran yang diikuti siswa
  const linkedSubjectIdSet = new Set(
    (appData.subjectClasses || [])
      .filter(sc => sc.class_id === studentClassId)
      .map(sc => sc.subject_id)
  );

  const followedSubjects = appData.subjects.filter(s => {
    if (linkedSubjectIdSet.size > 0) {
      return linkedSubjectIdSet.has(s.id);
    }
    // Fallback: cek jika ada materi atau tugas kelas ini pada mapel tersebut
    return (
      appData.materials.some(m => String(m.subject_id) === String(s.id) && (m.class_id === 'ALL' || m.class_id === studentClassId)) ||
      appData.assignments.some(a => String(a.subject_id) === String(s.id) && (a.class_id === 'ALL' || a.class_id === studentClassId))
    );
  });

  const followedSubjectIdSet = new Set(followedSubjects.map(s => s.id));

  // 2. Filter Materi: HANYA tampil materi mapel yang diikuti saja & untuk kelas siswa/ALL
  const studentMaterials = appData.materials.filter(m => {
    const rawClass = String(m.class_id || '').trim();
    const classMatch = !rawClass || rawClass === 'ALL' || rawClass.split(',').map(x => x.trim()).includes(studentClassId);
    const subjectMatch = followedSubjectIdSet.size === 0 || followedSubjectIdSet.has(m.subject_id);
    return classMatch && subjectMatch;
  });

  // 3. Filter Tugas: HANYA tampil tugas mapel yang diikuti & untuk kelas siswa/ALL
  const studentAssignments = appData.assignments.filter(a => {
    const rawClass = String(a.class_id || '').trim();
    const classMatch = !rawClass || rawClass === 'ALL' || rawClass.split(',').map(x => x.trim()).includes(studentClassId);
    const subjectMatch = followedSubjectIdSet.size === 0 || followedSubjectIdSet.has(a.subject_id);
    return classMatch && subjectMatch;
  });

  // 4. Filter Pengumuman: HANYA tampil pengumuman untuk kelas siswa atau ALL
  const studentAnnouncements = appData.announcements.filter(ann => {
    const raw = String(ann.target_class_id || '').trim();
    return !raw || raw === 'ALL' || raw === studentClassId;
  });

  // Helper untuk menentukan status evaluasi (TUNTAS / REMIDIAL / BELUM - Tanpa Angka)
  const getStatusBadge = (evalData?: Evaluation) => {
    if (!evalData) {
      return {
        label: 'BELUM',
        badgeClass: 'bg-amber-300 text-black border-black',
        icon: <Clock className="w-3 h-3" />
      };
    }

    if (evalData.status === 'TUNTAS' || (typeof evalData.grade === 'number' && evalData.grade >= 75)) {
      return {
        label: 'TUNTAS',
        badgeClass: 'bg-emerald-500 text-white border-black',
        icon: <CheckCircle2 className="w-3 h-3 text-white" />
      };
    }

    if (evalData.status === 'REMIDIAL' || (typeof evalData.grade === 'number' && evalData.grade < 75 && evalData.grade > 0)) {
      return {
        label: 'REMIDIAL',
        badgeClass: 'bg-red-500 text-white border-black',
        icon: <AlertTriangle className="w-3 h-3 text-white" />
      };
    }

    return {
      label: 'BELUM',
      badgeClass: 'bg-amber-300 text-black border-black',
      icon: <Clock className="w-3 h-3" />
    };
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Student Welcome Header Card */}
      <div className="pixel-box bg-white p-3.5 sm:p-5 shadow-pixel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-emerald-400 border-2 sm:border-3 border-black flex items-center justify-center font-pixel text-lg sm:text-xl shadow-pixel-sm shrink-0">
              🎒
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-pixel text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-none">
                  HALO, {currentUser.full_name}!
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[8px] sm:text-[9px] font-pixel px-1.5 py-0.5 rounded border border-black shrink-0">
                  SISWA
                </span>
                <span className="bg-blue-100 text-blue-900 text-[8px] sm:text-[9px] font-pixel px-1.5 py-0.5 rounded border border-black shrink-0">
                  READ ONLY
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-mono text-slate-600 mt-0.5 truncate">
                NIS: <span className="font-bold text-black">{currentUser.nis || '-'}</span> &bull;{' '}
                Kelas: <span className="font-bold text-black">{studentClassName}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto shrink-0">
            <div className="bg-amber-100 border-2 border-black rounded py-1 px-2.5 text-center min-w-[65px] sm:min-w-[75px]">
              <div className="font-pixel text-[11px] sm:text-xs text-amber-950">{studentMaterials.length}</div>
              <div className="text-[8px] sm:text-[9px] font-mono font-bold text-slate-700">MATERI</div>
            </div>
            <div className="bg-emerald-100 border-2 border-black rounded py-1 px-2.5 text-center min-w-[65px] sm:min-w-[75px]">
              <div className="font-pixel text-[11px] sm:text-xs text-emerald-950">{studentAssignments.length}</div>
              <div className="text-[8px] sm:text-[9px] font-mono font-bold text-slate-700">TUGAS</div>
            </div>
            <div className="bg-blue-100 border-2 border-black rounded py-1 px-2.5 text-center min-w-[65px] sm:min-w-[75px]">
              <div className="font-pixel text-[11px] sm:text-xs text-blue-950">{studentAnnouncements.length}</div>
              <div className="text-[8px] sm:text-[9px] font-mono font-bold text-slate-700">INFO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Navigation Tabs - Horizontally scrollable on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b-2 border-black no-scrollbar snap-x">
        <button
          onClick={() => setActiveTab('materi')}
          className={`pixel-btn py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-[9px] sm:text-xs gap-1.5 shrink-0 snap-start whitespace-nowrap cursor-pointer ${
            activeTab === 'materi'
              ? 'bg-[#FFDE59] text-black shadow-pixel-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Materi Mapel ({studentMaterials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`pixel-btn py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-[9px] sm:text-xs gap-1.5 shrink-0 snap-start whitespace-nowrap cursor-pointer ${
            activeTab === 'tugas'
              ? 'bg-emerald-400 text-black shadow-pixel-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tugas & Status ({studentAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pengumuman')}
          className={`pixel-btn py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-[9px] sm:text-xs gap-1.5 shrink-0 snap-start whitespace-nowrap cursor-pointer ${
            activeTab === 'pengumuman'
              ? 'bg-blue-400 text-black shadow-pixel-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Pengumuman ({studentAnnouncements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profil')}
          className={`pixel-btn py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-[9px] sm:text-xs gap-1.5 shrink-0 snap-start whitespace-nowrap cursor-pointer ${
            activeTab === 'profil'
              ? 'bg-purple-300 text-black shadow-pixel-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Kartu & Profil</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: MATERI PELAJARAN (HANYA MAPEL YANG DIIKUTI) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'materi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              MATERI PEMBELAJARAN MAPEL ({studentClassName})
            </h2>
            <span className="text-[10px] font-mono text-slate-600">
              {studentMaterials.length} Modul Tersedia
            </span>
          </div>

          {studentMaterials.length === 0 ? (
            <div className="pixel-box bg-white p-8 text-center space-y-2">
              <p className="font-pixel text-xs text-slate-500">
                BELUM ADA MATERI UNTUK MATA PELAJARAN INI
              </p>
              <p className="text-xs text-slate-600 font-mono">
                Guru mata pelajaran belum mengunggah modul untuk kelas Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {followedSubjects.map((subj, idx) => {
                const subjMaterials = studentMaterials.filter(
                  m => String(m.subject_id) === String(subj.id)
                );
                if (subjMaterials.length === 0) return null;

                const groupId = `mat-${idx}`;
                const isExpanded = expandedGroups[groupId] !== false;

                return (
                  <div key={subj.id} className="pixel-box bg-white overflow-hidden shadow-pixel">
                    {/* Header Mapel */}
                    <div
                      onClick={() => toggleGroup(groupId)}
                      className="p-3 bg-[#FFDE59] border-b-4 border-black flex justify-between items-center cursor-pointer hover:bg-yellow-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{subj.icon || '📘'}</span>
                        <span className="font-pixel text-xs text-black">
                          MAPEL: {subj.subject_name} ({subjMaterials.length} Modul)
                        </span>
                      </div>
                      <span className="font-pixel text-xs text-black">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>

                    {/* Content List */}
                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-[#FFFDF5]">
                        {subjMaterials.map(m => (
                          <div
                            key={m.id}
                            className="p-3 bg-white border-2 border-black rounded shadow-pixel-sm space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-pixel">
                                  {m.title}
                                </h4>
                                {m.description && (
                                  <p className="text-xs font-mono text-slate-700 mt-1 leading-relaxed">
                                    {m.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-[9px] font-pixel px-1.5 py-0.5 rounded border border-black bg-blue-100 uppercase">
                                {m.type || 'LINK'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-mono text-slate-500">
                                Diunggah: {new Date(m.created_at).toLocaleDateString('id-ID')}
                              </span>
                              {m.url ? (
                                <a
                                  href={m.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="pixel-btn bg-[#2563EB] hover:bg-blue-700 text-white text-[9px] py-1 px-3 gap-1"
                                >
                                  <span>BUKA TAUTAN MATERI</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 italic">
                                  Tautan tidak tersedia
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: TUGAS SAYA (READ ONLY - DIKUMPULKAN LANGSUNG KE GURU) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tugas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                DAFTAR TUGAS MAPEL (READ ONLY)
              </h2>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                Pengerjaan tugas dikumpulkan langsung secara fisik kepada Guru di sekolah.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-600">
              {studentAssignments.length} Tugas Tersedia
            </span>
          </div>

          {/* Banner Pengumpulan Langsung */}
          <div className="p-3 bg-blue-50 border-2 border-blue-600 rounded flex items-start gap-2.5 shadow-pixel-sm">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs font-mono text-blue-950">
              <span className="font-bold">Informasi Pengumpulan:</span> Tugas ini bersifat <strong>READ ONLY</strong> di aplikasi. Kumpulkan lembar jawaban / dokumen tugas Anda langsung kepada Guru pengampu saat jam pelajaran di sekolah.
            </div>
          </div>

          {studentAssignments.length === 0 ? (
            <div className="pixel-box bg-white p-8 text-center space-y-2">
              <p className="font-pixel text-xs text-slate-500">
                TIDAK ADA TUGAS AKTIF SAAT INI
              </p>
              <p className="text-xs text-slate-600 font-mono">
                Semua tugas pada mata pelajaran yang Anda ikuti telah selesai.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentAssignments.map((asg) => {
                const subj = appData.subjects.find(s => s.id === asg.subject_id);
                const evalData = appData.evaluations.find(
                  e => e.assignment_id === asg.id && e.student_id === currentUser.id
                );
                const badge = getStatusBadge(evalData);

                return (
                  <div
                    key={asg.id}
                    className="pixel-box bg-white overflow-hidden shadow-pixel"
                  >
                    {/* Header Tugas */}
                    <div className="p-3 bg-emerald-500 text-white border-b-4 border-black flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-xs">
                          📝 {subj ? subj.subject_name : 'MATA PELAJARAN'}
                        </span>
                      </div>

                      {/* Status Kualitatif: TUNTAS / REMIDIAL / BELUM */}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-pixel px-2 py-0.5 rounded border flex items-center gap-1 ${badge.badgeClass}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Konten Tugas */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-pixel text-xs sm:text-sm text-slate-900">
                          {asg.title}
                        </h3>
                        <div className="font-mono text-xs text-slate-800 mt-2 bg-slate-50 p-3 rounded border border-black leading-relaxed">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">PETUNJUK PENGERJAAN:</span>
                          {asg.description}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 pt-1">
                        <span className="flex items-center gap-1 text-amber-800 font-bold">
                          <Calendar className="w-3.5 h-3.5" />
                          Batas Waktu Pengumpulan: {asg.due_date ? new Date(asg.due_date).toLocaleDateString('id-ID') : '-'}
                        </span>
                        <span className="text-slate-500 italic">
                          Dikumpulkan langsung ke guru
                        </span>
                      </div>

                      {/* Hasil Evaluasi Kualitatif Guru (Tanpa Angka) */}
                      {evalData && (
                        <div className="p-3 bg-amber-50 border-2 border-amber-600 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-pixel text-[10px] text-amber-900 flex items-center gap-1">
                              <Award className="w-4 h-4 text-amber-600" /> STATUS EVALUASI GURU:
                            </span>
                            <span className={`font-pixel text-xs px-2.5 py-0.5 rounded border ${badge.badgeClass}`}>
                              {badge.label}
                            </span>
                          </div>

                          {evalData.teacher_notes && (
                            <div className="text-xs font-mono text-slate-800 flex items-start gap-1.5 pt-1">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <p>
                                <strong className="text-black">Catatan Guru:</strong> "{evalData.teacher_notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PENGUMUMAN SISWA (HANYA KELAS YANG DIIKUTI & UMUM) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pengumuman' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              PENGUMUMAN KELAS SAYA ({studentClassName})
            </h2>
            <span className="text-[10px] font-mono text-slate-600">
              {studentAnnouncements.length} Pengumuman
            </span>
          </div>

          {studentAnnouncements.length === 0 ? (
            <div className="pixel-box bg-white p-8 text-center text-xs font-pixel text-slate-500">
              TIDAK ADA PENGUMUMAN TERBARU
            </div>
          ) : (
            <div className="space-y-3">
              {studentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="pixel-box bg-white p-4 space-y-2 shadow-pixel"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-pixel text-xs sm:text-sm text-slate-900">
                      {ann.title}
                    </h3>
                    <span className="text-[9px] font-pixel px-2 py-0.5 rounded border border-black bg-yellow-300 shrink-0">
                      {ann.badge || (ann.target_class_id === 'ALL' ? 'UMUM' : studentClassName)}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                    <span>Diposting oleh: <strong className="text-slate-800">{ann.author_name}</strong></span>
                    <span>{new Date(ann.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: PROFIL SISWA & DIGITAL STUDENT CARD */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Digital Student ID Card */}
          <div className="pixel-box bg-[#FFDE59] p-5 shadow-pixel space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-black">KARTU PELAJAR DIGITAL</span>
              </div>
              <span className="bg-black text-white text-[9px] font-pixel px-1.5 py-0.5 rounded">
                SMP BELAJAR ID
              </span>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-20 h-24 bg-white border-3 border-black rounded flex flex-col items-center justify-center shadow-pixel-sm">
                <span className="text-3xl">🎒</span>
                <span className="text-[8px] font-pixel mt-1 text-slate-700">FOTO</span>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <p>
                  <span className="text-slate-600 block text-[10px]">NAMA LENGKAP:</span>
                  <strong className="text-black text-sm">{currentUser.full_name}</strong>
                </p>
                <p>
                  <span className="text-slate-600 block text-[10px]">NOMOR INDUK SISWA (NIS):</span>
                  <strong className="text-black font-pixel text-xs">{currentUser.nis || '-'}</strong>
                </p>
                <p>
                  <span className="text-slate-600 block text-[10px]">KELAS TERDAFTAR:</span>
                  <strong className="text-black">{studentClassName}</strong>
                </p>
              </div>
            </div>

            {/* Barcode Mock */}
            <div className="pt-2 border-t-2 border-black">
              <div className="bg-white p-2 border-2 border-black rounded flex flex-col items-center">
                <div className="flex items-center gap-1 h-8">
                  {[4,2,3,1,5,2,4,3,2,5,1,3,4,2,3,5,2,1,4,3,2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-black h-full"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] text-slate-800 tracking-widest mt-1">
                  *EDUBITS-{currentUser.nis || '20240101'}*
                </span>
              </div>
            </div>
          </div>

          {/* Student Academic Information Card */}
          <div className="pixel-box bg-white p-5 shadow-pixel space-y-3">
            <h3 className="font-pixel text-xs text-slate-900 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-purple-600" />
              INFORMASI AKUN SISWA
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded flex justify-between items-center">
                <span className="text-slate-600">Email Akun:</span>
                <strong className="text-slate-900">{currentUser.email}</strong>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-300 rounded flex justify-between items-center">
                <span className="text-slate-600">Nomor Induk Siswa (NIS):</span>
                <strong className="text-slate-900 font-pixel text-[11px]">{currentUser.nis || '-'}</strong>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-300 rounded flex justify-between items-center">
                <span className="text-slate-600">Kelas Aktif:</span>
                <strong className="text-slate-900">{studentClassName}</strong>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-400 rounded flex justify-between items-center text-emerald-900">
                <span>Status Akun:</span>
                <span className="font-pixel text-[10px] bg-emerald-200 px-2 py-0.5 rounded border border-emerald-500">
                  AKTIF (READ ONLY)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

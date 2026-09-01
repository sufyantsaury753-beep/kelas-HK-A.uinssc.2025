'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
  Printer,
  Trash2,
  Lock,
  ExternalLink,
  Users,
  FileText,
  FolderDown,
  ChevronRight,
  ShieldAlert,
  Search,
  Check,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import {
  Course,
  AttendanceSession,
  AttendanceRecord,
  Student,
  AuthSession,
  AttendanceStatus,
  CourseMaterial,
} from '@/lib/types';
import { AttendanceBadge } from '@/components/common/Badge';
import AttendanceSheetPrint from '@/components/attendance/AttendanceSheetPrint';
import { exportSingleSessionCsv, exportMatrixAttendanceCsv } from '@/lib/exportUtils';
import confetti from 'canvas-confetti';

export default function PjDashboard() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  // Selected Course
  const [activeCourseId, setActiveCourseId] = useState<string>('');

  // Selected Session for Attendance Checking
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  // Modals
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

  // New session form
  const [newMeetingNum, setNewMeetingNum] = useState<number>(1);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState<string>('08:00');
  const [newEndTime, setNewEndTime] = useState<string>('09:40');
  const [newTopic, setNewTopic] = useState<string>('');
  const [newSelfCheckin, setNewSelfCheckin] = useState<boolean>(true);
  const [newCheckinCode, setNewCheckinCode] = useState<string>('2501');

  // New material form
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'RPS' | 'MODUL' | 'MAKALAH' | 'PPT' | 'TUGAS' | 'LINK'>('MODUL');
  const [matUrl, setMatUrl] = useState('');
  const [matDesc, setMatDesc] = useState('');

  // Search in student attendance table
  const [searchStudent, setSearchStudent] = useState('');

  useEffect(() => {
    const update = () => {
      const currentAuth = appStore.getAuth();
      if (!currentAuth) {
        router.push('/login');
        return;
      }
      setAuth(currentAuth);

      const allCourses = appStore.getCourses();
      setCourses(allCourses);
      setStudents(appStore.getStudents());
      setSessions(appStore.getSessions());
      setRecords(appStore.getRecords());
      setMaterials(appStore.getMaterials());

      // Auto-select first course assigned to this PJ if not yet set
      if (!activeCourseId) {
        const myCourse = allCourses.find((c) =>
          currentAuth.role === 'ADMIN' ||
          c.pjNims.some((pNim) => pNim.trim() === currentAuth.nim?.trim())
        );
        if (myCourse) {
          setActiveCourseId(myCourse.id);
        } else if (allCourses.length > 0) {
          setActiveCourseId(allCourses[0].id);
        }
      }
    };

    update();
    const unsub = appStore.subscribe(update);
    return () => unsub();
  }, [router, activeCourseId]);

  if (!auth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#9d5f2f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const userNim = auth.nim || '';
  const isAdmin = auth.role === 'ADMIN';

  // Strict Authorization Check: Can this user manage this active course?
  const isUserAssignedToActiveCourse =
    isAdmin ||
    (activeCourse &&
      activeCourse.pjNims.some((pNim) => pNim.trim() === userNim.trim()));

  const activeCourseSessions = sessions
    .filter((s) => s.courseId === activeCourse?.id)
    .sort((a, b) => b.meetingNumber - a.meetingNumber);

  // Default active session to the latest if not selected or invalid
  const currentSession =
    activeCourseSessions.find((s) => s.id === activeSessionId) ||
    activeCourseSessions[0] ||
    null;

  const currentRecords = currentSession
    ? records.filter((r) => r.sessionId === currentSession.id)
    : [];

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserAssignedToActiveCourse || !activeCourse) return;

    const created = appStore.createSession({
      courseId: activeCourse.id,
      meetingNumber: Number(newMeetingNum),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      topic: newTopic || `Pertemuan ke-${newMeetingNum}`,
      dosenPresent: true,
      isOpenForSelfCheckin: newSelfCheckin,
      checkinCode: newSelfCheckin ? newCheckinCode : undefined,
      createdByNim: userNim || 'ADMIN',
    });

    // Auto mark all students as HADIR or prepare records
    appStore.batchMarkAll(created.id, activeCourse.id, 'HADIR', 'PJ');

    setActiveSessionId(created.id);
    setShowNewSessionModal(false);
    setNewTopic('');
    setNewMeetingNum((prev) => prev + 1);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  const handleStatusChange = (
    studentNim: string,
    newStatus: AttendanceStatus,
    notes?: string
  ) => {
    if (!isUserAssignedToActiveCourse || !currentSession || !activeCourse) return;
    appStore.setAttendanceRecord(
      currentSession.id,
      activeCourse.id,
      studentNim,
      newStatus,
      'PJ',
      notes
    );
  };

  const handleMarkAllHadir = () => {
    if (!isUserAssignedToActiveCourse || !currentSession || !activeCourse) return;
    appStore.batchMarkAll(currentSession.id, activeCourse.id, 'HADIR', 'PJ');
  };

  const handleDeleteSession = (sessId: string) => {
    if (!isUserAssignedToActiveCourse) return;
    if (confirm('Apakah Anda yakin ingin menghapus sesi pertemuan ini beserta data presensinya?')) {
      appStore.deleteSession(sessId);
      if (activeSessionId === sessId) {
        setActiveSessionId('');
      }
    }
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserAssignedToActiveCourse || !activeCourse) return;

    appStore.addMaterial({
      courseId: activeCourse.id,
      title: matTitle,
      type: matType,
      url: matUrl,
      description: matDesc,
      uploadedBy: `PJ ${auth.name}`,
    });

    setShowAddMaterialModal(false);
    setMatTitle('');
    setMatUrl('');
    setMatDesc('');
  };

  // Student list filtered
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nim.includes(searchStudent)
  );

  // Statistics for current session
  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alpaCount = 0;

  students.forEach((st) => {
    const rec = currentRecords.find((r) => r.studentNim.trim() === st.nim.trim());
    const status = rec ? rec.status : 'ALPA';
    if (status === 'HADIR') hadirCount++;
    else if (status === 'IZIN') izinCount++;
    else if (status === 'SAKIT') sakitCount++;
    else alpaCount++;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner PJ */}
      <div className="bg-gradient-to-r from-[#9d5f2f] via-[#8c4e24] to-[#753e1f] rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-[#9d5f2f]/15 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-stone-950 flex items-center space-x-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Penanggung Jawab (PJ) Mata Kuliah</span>
            </span>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-900 text-amber-300 border border-amber-400/40">
                Mode Superadmin (Akses Semua MK)
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-2">
            Kelola Presensi & Berkas Perkuliahan HK A 2025
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-0.5">
            PJ: <span className="font-semibold text-white">{auth.name}</span>{' '}
            {auth.nim ? `(NIM: ${auth.nim})` : ''} • Fakultas Syariah, UIN Siber Syekh Nurjati Cirebon
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/mahasiswa"
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all flex items-center space-x-1.5"
          >
            <span>Beralih ke Dashboard Pribadi</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-amber-300 text-xs font-bold shadow-md transition-all"
            >
              Kembali ke Admin
            </Link>
          )}
        </div>
      </div>

      {/* Course Selector Tabs (11 Mata Kuliah) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Pilih Mata Kuliah ({courses.length})
          </h2>
          <span className="text-[11px] text-stone-500 italic">
            *PJ hanya dapat mengelola mata kuliah yang ditugaskan kepadanya.
          </span>
        </div>

        <div className="flex overflow-x-auto pb-2 gap-2.5 scrollbar-thin">
          {courses.map((c) => {
            const isAssigned =
              isAdmin ||
              c.pjNims.some((pNim) => pNim.trim() === userNim.trim());
            const isSelected = c.id === activeCourseId;

            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCourseId(c.id);
                  setActiveSessionId('');
                }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border flex items-center space-x-2 ${
                  isSelected
                    ? isAssigned
                      ? 'bg-[#9d5f2f] text-white border-[#8c4e24] shadow-md shadow-[#9d5f2f]/20'
                      : 'bg-stone-800 text-amber-300 border-stone-900'
                    : isAssigned
                    ? 'bg-white text-stone-800 border-amber-300 hover:border-[#9d5f2f] hover:bg-amber-50/50'
                    : 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                }`}
              >
                {!isAssigned && <Lock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />}
                {isAssigned && isSelected && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                )}
                <span>{c.name}</span>
                {isAssigned && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ISOLATION WARNING IF NOT AUTHORIZED */}
      {!isUserAssignedToActiveCourse && activeCourse && (
        <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-3xl text-rose-900 shadow-sm flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-200 text-rose-800 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-950 flex items-center space-x-2">
              <span>Akses Dibatasi: Anda Bukan PJ Mata Kuliah {activeCourse.name}</span>
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed max-w-3xl">
              Sesuai aturan operasional kelas HK A 2025, PJ mata kuliah lain dilarang mengintervensi atau mengubah absensi mata kuliah yang bukan tanggung jawabnya.
              Mata kuliah ini hanya dapat dikelola oleh PJ resmi bersangkutan:{' '}
              <strong>
                {students
                  .filter((s) => activeCourse.pjNims.includes(s.nim))
                  .map((s) => s.name)
                  .join(', ') || 'Belum Ditugaskan oleh Admin'}
              </strong>
              .
            </p>
            <p className="text-[11px] text-rose-700/80 pt-1">
              Silakan klik mata kuliah Anda pada daftar di atas untuk membuka sesi absensi Anda.
            </p>
          </div>
        </div>
      )}

      {/* MAIN COURSE MANAGEMENT WORKSPACE (If Authorized) */}
      {isUserAssignedToActiveCourse && activeCourse && (
        <div className="space-y-6">
          {/* Active Course Card Header */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  {activeCourse.code} • {activeCourse.sks} SKS
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  Semester {activeCourse.semester}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                {activeCourse.name}
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Dosen: <span className="font-semibold text-stone-800">{activeCourse.dosen}</span> •
                Jadwal: {activeCourse.day}, {activeCourse.time} ({activeCourse.room})
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setNewMeetingNum(activeCourseSessions.length + 1);
                  setShowNewSessionModal(true);
                }}
                className="px-4 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs font-bold shadow-md shadow-[#9d5f2f]/20 transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buka Sesi Pertemuan Baru</span>
              </button>

              <button
                onClick={() => setShowAddMaterialModal(true)}
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                <FolderDown className="w-4 h-4 text-[#9d5f2f]" />
                <span>Tambah Materi / Tugas</span>
              </button>

              <button
                onClick={() =>
                  exportMatrixAttendanceCsv(
                    activeCourse,
                    activeCourseSessions,
                    students,
                    records
                  )
                }
                title="Download Rekap Semua Pertemuan Semester ke CSV"
                className="px-3.5 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Rekap Semester (Excel)</span>
              </button>
            </div>
          </div>

          {/* Session Picker & Attendance Controls */}
          {activeCourseSessions.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-dashed border-stone-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#9d5f2f] mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-800">
                Belum Ada Sesi Pertemuan untuk {activeCourse.name}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                Sebagai Penanggung Jawab mata kuliah ini, silakan klik tombol di bawah untuk membuat
                Pertemuan ke-1 dan mulai mencatat kehadiran 30 mahasiswa kelas HK A.
              </p>
              <button
                onClick={() => {
                  setNewMeetingNum(1);
                  setShowNewSessionModal(true);
                }}
                className="px-5 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buka Sesi Pertemuan 1 Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Sessions List */}
              <div className="lg:col-span-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Daftar Pertemuan ({activeCourseSessions.length})
                  </h3>
                  <button
                    onClick={() => {
                      setNewMeetingNum(activeCourseSessions.length + 1);
                      setShowNewSessionModal(true);
                    }}
                    className="text-xs text-[#9d5f2f] hover:underline font-bold flex items-center space-x-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Baru</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {activeCourseSessions.map((sess) => {
                    const isSelected = sess.id === currentSession?.id;
                    const sessRecs = records.filter((r) => r.sessionId === sess.id);
                    const hCount = sessRecs.filter((r) => r.status === 'HADIR').length;

                    return (
                      <div
                        key={sess.id}
                        onClick={() => setActiveSessionId(sess.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50/80 border-[#9d5f2f] shadow-sm'
                            : 'bg-white border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-xs text-stone-900">
                              Pertemuan {sess.meetingNumber}
                            </span>
                            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                              {sess.date} • {sess.startTime}
                            </p>
                          </div>
                          {sess.isOpenForSelfCheckin && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Presensi Mandiri Aktif"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600 line-clamp-1 italic mt-1.5">
                          &quot;{sess.topic}&quot;
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-medium">
                          <span>{hCount} Hadir</span>
                          <span className="text-[#9d5f2f] font-semibold">
                            {isSelected ? 'Terpilih' : 'Buka'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Attendance Sheet of Selected Session */}
              {currentSession && (
                <div className="lg:col-span-3 space-y-4">
                  {/* Selected Session Card */}
                  <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#9d5f2f] text-white">
                            Pertemuan Ke-{currentSession.meetingNumber}
                          </span>
                          <span className="text-xs text-stone-500 font-mono">
                            {currentSession.date} • {currentSession.startTime} - {currentSession.endTime} WIB
                          </span>
                          {currentSession.isOpenForSelfCheckin && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Mandiri Dibuka (Kode: {currentSession.checkinCode || 'Tanpa Kode'})
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-stone-900 mt-1">
                          Topik: &quot;{currentSession.topic}&quot;
                        </h3>
                      </div>

                      {/* Export / Print Buttons for this session */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowPrintModal(true)}
                          className="px-3 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cetak / PDF Resmi</span>
                        </button>
                        <button
                          onClick={() =>
                            exportSingleSessionCsv(
                              activeCourse,
                              currentSession,
                              students,
                              records
                            )
                          }
                          className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Excel (CSV)</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSession(currentSession.id)}
                          title="Hapus Sesi Pertemuan Ini"
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats & Quick Actions Toolbar */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Counters */}
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-stone-700">Rekap:</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          {hadirCount} Hadir
                        </span>
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                          {izinCount} Izin
                        </span>
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                          {sakitCount} Sakit
                        </span>
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          {alpaCount} Alpa
                        </span>
                      </div>

                      {/* Quick Bulk Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleMarkAllHadir}
                          className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors flex items-center space-x-1 text-[11px]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Tandai Semua Hadir</span>
                        </button>

                        <button
                          onClick={() => {
                            const nextState = !currentSession.isOpenForSelfCheckin;
                            appStore.updateSession(currentSession.id, {
                              isOpenForSelfCheckin: nextState,
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-colors text-[11px] ${
                            currentSession.isOpenForSelfCheckin
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {currentSession.isOpenForSelfCheckin
                            ? 'Tutup Presensi Mandiri'
                            : 'Buka Presensi Mandiri'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student Attendance Checklist Table */}
                  <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-4">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Cari nama atau NIM..."
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f]"
                        />
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        Menampilkan {filteredStudents.length} dari {students.length} Mahasiswa
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
                            <th className="py-2.5 px-3 text-center w-10">No</th>
                            <th className="py-2.5 px-3 w-28">NIM</th>
                            <th className="py-2.5 px-3">Nama Mahasiswa</th>
                            <th className="py-2.5 px-3 text-center w-10">L/P</th>
                            <th className="py-2.5 px-3 text-center w-64">Aksi Status Kehadiran</th>
                            <th className="py-2.5 px-3">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredStudents.map((st, idx) => {
                            const rec = currentRecords.find(
                              (r) => r.studentNim.trim() === st.nim.trim()
                            );
                            const currentStatus: AttendanceStatus = rec ? rec.status : 'ALPA';

                            return (
                              <tr
                                key={st.nim}
                                className={`hover:bg-amber-50/30 transition-colors ${
                                  currentStatus === 'HADIR'
                                    ? 'bg-white'
                                    : currentStatus === 'ALPA'
                                    ? 'bg-rose-50/20'
                                    : 'bg-stone-50/40'
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center text-stone-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-semibold text-stone-800">
                                  {st.nim}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-stone-900">
                                  {st.name}
                                </td>
                                <td className="py-2.5 px-3 text-center text-stone-500">
                                  {st.gender}
                                </td>

                                {/* Interactive 4-status buttons */}
                                <td className="py-2 px-3 text-center">
                                  <div className="inline-flex rounded-xl p-1 bg-stone-100/90 border border-stone-200 space-x-1">
                                    <button
                                      onClick={() => handleStatusChange(st.nim, 'HADIR')}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        currentStatus === 'HADIR'
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-stone-200'
                                      }`}
                                    >
                                      Hadir
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(st.nim, 'IZIN')}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        currentStatus === 'IZIN'
                                          ? 'bg-blue-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-stone-200'
                                      }`}
                                    >
                                      Izin
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(st.nim, 'SAKIT')}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        currentStatus === 'SAKIT'
                                          ? 'bg-amber-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-stone-200'
                                      }`}
                                    >
                                      Sakit
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(st.nim, 'ALPA')}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        currentStatus === 'ALPA'
                                          ? 'bg-rose-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-stone-200'
                                      }`}
                                    >
                                      Alpa
                                    </button>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    placeholder="Keterangan..."
                                    defaultValue={rec?.notes || ''}
                                    onBlur={(e) =>
                                      handleStatusChange(st.nim, currentStatus, e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-[11px] rounded-lg border border-transparent hover:border-stone-200 focus:border-[#9d5f2f] focus:outline-none bg-transparent"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Buka Sesi Pertemuan Baru */}
      {showNewSessionModal && activeCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900">Buka Sesi Presensi Perkuliahan</h3>
            <p className="text-xs text-stone-500 mt-0.5 mb-4">
              Mata Kuliah: <span className="font-semibold text-[#9d5f2f]">{activeCourse.name}</span>
            </p>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pertemuan Ke</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={newMeetingNum}
                    onChange={(e) => setNewMeetingNum(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Materi / Topik Pembahasan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Rukun dan Syarat Waris, Ahli Waris Ashabah..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                  required
                />
              </div>

              {/* Self check-in toggle */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSelfCheckin}
                    onChange={(e) => setNewSelfCheckin(e.target.checked)}
                    className="rounded text-[#9d5f2f] focus:ring-[#9d5f2f]"
                  />
                  <span className="font-bold text-stone-900">
                    Buka Presensi Mandiri Mahasiswa
                  </span>
                </label>
                {newSelfCheckin && (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Kode Token Verifikasi (4-Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newCheckinCode}
                      onChange={(e) => setNewCheckinCode(e.target.value)}
                      placeholder="Contoh: 2501"
                      className="w-full px-3 py-1.5 font-mono text-center tracking-widest rounded-lg border border-amber-300 bg-white"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Bagikan kode ini ke rekan kelas yang hadir di ruangan.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="w-1/3 py-2.5 border border-stone-300 rounded-xl hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl font-bold shadow-md shadow-[#9d5f2f]/20"
                >
                  Simpan & Buka Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Materi / Tugas */}
      {showAddMaterialModal && activeCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900">Unggah Materi / Berkas Perkuliahan</h3>
            <p className="text-xs text-stone-500 mt-0.5 mb-4">
              Mata Kuliah: <span className="font-semibold text-[#9d5f2f]">{activeCourse.name}</span>
            </p>

            <form onSubmit={handleAddMaterial} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Judul Dokumen / Materi</label>
                <input
                  type="text"
                  placeholder="Contoh: Makalah Kelompok 1 - Faraidh"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Jenis Materi</label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                >
                  <option value="MODUL">Modul Bahan Ajar</option>
                  <option value="MAKALAH">Makalah Kelompok</option>
                  <option value="PPT">Slide Presentasi (PPT)</option>
                  <option value="RPS">RPS & Silabus</option>
                  <option value="TUGAS">Penugasan / Studi Kasus</option>
                  <option value="LINK">Tautan Sumber Belajar</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tautan File / Google Drive Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan atau nama pemateri..."
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="w-1/3 py-2.5 border border-stone-300 rounded-xl hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl font-bold shadow-md"
                >
                  Simpan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sheet Official View Modal */}
      {showPrintModal && activeCourse && currentSession && (
        <AttendanceSheetPrint
          course={activeCourse}
          session={currentSession}
          students={students}
          records={records}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}

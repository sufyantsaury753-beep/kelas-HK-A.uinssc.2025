'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Unlock,
  Info,
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

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

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

  // Selected Session (defaults to today's or latest)
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  // Admin bypass toggle to simulate and test attendance on any day
  const [adminSimulateOpen, setAdminSimulateOpen] = useState(false);

  // Active view tab: 'ABSENSI' | 'ARSIP' | 'MATERI'
  const [activeTab, setActiveTab] = useState<'ABSENSI' | 'ARSIP' | 'MATERI'>('ABSENSI');

  // Modals
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

  // Notification feedback
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // New session manual form
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

  // Search filter
  const [searchStudent, setSearchStudent] = useState('');

  // Real-time day & date information
  const today = useMemo(() => new Date(), []);
  const todayDayName = useMemo(() => INDONESIAN_DAYS[today.getDay()], [today]);
  const todayDateStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const todayFormatted = useMemo(
    () =>
      today.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [today]
  );

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

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => {
      setToastNotice(null);
    }, 3000);
  };

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

  // Authorization Check: PJ assigned or Superadmin
  const isUserAssignedToActiveCourse =
    isAdmin ||
    (activeCourse &&
      activeCourse.pjNims.some((pNim) => pNim.trim() === userNim.trim()));

  // Check if today is the scheduled day for the active course
  const isCourseDayToday = activeCourse
    ? activeCourse.day.toLowerCase().trim().includes(todayDayName.toLowerCase().trim())
    : false;

  // Attendance is unlocked only on the course day (or when admin explicitly enables simulation)
  const isAttendanceUnlocked = isCourseDayToday || (isAdmin && adminSimulateOpen);

  // Sessions for the active course
  const activeCourseSessions = sessions
    .filter((s) => s.courseId === activeCourse?.id)
    .sort((a, b) => b.meetingNumber - a.meetingNumber);

  // Existing session for today (if any)
  const todaySession = activeCourseSessions.find((s) => s.date === todayDateStr);

  // Current session to display: either explicitly selected, today's session, or latest session
  const currentSession =
    activeCourseSessions.find((s) => s.id === activeSessionId) ||
    todaySession ||
    activeCourseSessions[0] ||
    null;

  const currentRecords = currentSession
    ? records.filter((r) => r.sessionId === currentSession.id)
    : [];

  const handleStartTodaySessionReturn = (): AttendanceSession | null => {
    if (!activeCourse) return null;
    const existing = sessions.find(
      (s) => s.courseId === activeCourse.id && s.date === todayDateStr
    );
    if (existing) return existing;

    const nextMeetingNumber = activeCourseSessions.length + 1;
    const timeParts = activeCourse.time.replace('WIB', '').split('-');
    const startTime = timeParts[0]?.trim() || '07:30';
    const endTime = timeParts[1]?.trim() || '09:10';

    const created = appStore.createSession({
      courseId: activeCourse.id,
      meetingNumber: nextMeetingNumber,
      date: todayDateStr,
      startTime,
      endTime,
      topic: `Perkuliahan Pertemuan ke-${nextMeetingNumber}`,
      dosenPresent: true,
      isOpenForSelfCheckin: true,
      checkinCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      createdByNim: userNim || 'PJ',
    });

    appStore.batchMarkAll(created.id, activeCourse.id, 'HADIR', 'PJ');
    setActiveSessionId(created.id);
    return created;
  };

  // Mark specific student status
  const handleStatusChange = (
    studentNim: string,
    newStatus: AttendanceStatus,
    notes?: string
  ) => {
    if (!isUserAssignedToActiveCourse || !activeCourse) return;

    let targetSession: AttendanceSession | null = currentSession;
    if (!targetSession) {
      targetSession = handleStartTodaySessionReturn();
    }
    if (!targetSession) return;

    appStore.setAttendanceRecord(
      targetSession.id,
      activeCourse.id,
      studentNim,
      newStatus,
      'PJ',
      notes
    );
    showToast(`Status ${studentNim} diubah ke ${newStatus}`);
  };

  const handleMarkAllHadir = () => {
    if (!isUserAssignedToActiveCourse || !activeCourse) return;
    let targetSession: AttendanceSession | null = currentSession;
    if (!targetSession) {
      targetSession = handleStartTodaySessionReturn();
    }
    if (!targetSession) return;

    appStore.batchMarkAll(targetSession.id, activeCourse.id, 'HADIR', 'PJ');
    showToast(`Seluruh ${students.length} Mahasiswa ditandai HADIR!`);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const handleDeleteSession = (sessId: string) => {
    if (!isUserAssignedToActiveCourse) return;
    if (confirm('Apakah Anda yakin ingin menghapus sesi pertemuan ini beserta data presensinya?')) {
      appStore.deleteSession(sessId);
      if (activeSessionId === sessId) {
        setActiveSessionId('');
      }
      showToast('Sesi pertemuan berhasil dihapus.');
    }
  };

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

    appStore.batchMarkAll(created.id, activeCourse.id, 'HADIR', 'PJ');
    setShowNewSessionModal(false);
    setActiveSessionId(created.id);
    setNewTopic('');
    showToast(`Pertemuan ke-${newMeetingNum} berhasil dibuat.`);
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
    showToast('Materi perkuliahan berhasil diunggah.');
  };

  // Filtered students for attendance search
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
  let dispensasiCount = 0;

  students.forEach((st) => {
    const rec = currentRecords.find((r) => r.studentNim.trim() === st.nim.trim());
    const status = rec ? rec.status : 'ALPA';
    if (status === 'HADIR') hadirCount++;
    else if (status === 'IZIN') izinCount++;
    else if (status === 'SAKIT') sakitCount++;
    else if (status === 'DISPENSASI') dispensasiCount++;
    else alpaCount++;
  });

  return (
    <>
      <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 ${showPrintModal ? 'print:hidden' : ''}`}>
      {/* Toast Feedback */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Top Banner PJ */}
      <div className="bg-gradient-to-r from-[#9d5f2f] via-[#8c4e24] to-[#753e1f] rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-[#9d5f2f]/15 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-stone-950 flex items-center space-x-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Penanggung Jawab (PJ) Mata Kuliah</span>
            </span>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-900 text-amber-300 border border-amber-400/40">
                Mode Superadmin (Akses Semua MK)
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/25 text-amber-100 backdrop-blur-sm">
              Hari Ini: {todayFormatted}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            Kelola Presensi & Berkas Perkuliahan HK A 2025
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-0.5">
            PJ: <span className="font-semibold text-white">{auth.name}</span>{' '}
            {auth.nim ? `(NIM: ${auth.nim})` : ''} • Fakultas Syariah, UIN Siber Syekh Nurjati Cirebon
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#9d5f2f]" />
            <span>Pilih Mata Kuliah ({courses.length})</span>
          </h2>
          <span className="text-[11px] text-stone-500 italic">
            *PJ hanya dapat mengelola mata kuliah yang ditugaskan kepadanya.
          </span>
        </div>

        {/* Scrollable Course Pill Row */}
        <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 min-w-max">
            {courses.map((c) => {
              const isAssigned =
                isAdmin ||
                c.pjNims.some((pNim) => pNim.trim() === userNim.trim());
              const isSelected = c.id === activeCourseId;
              const isTodayMK = c.day.toLowerCase().trim().includes(todayDayName.toLowerCase().trim());

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCourseId(c.id);
                    setActiveSessionId('');
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border flex items-center space-x-2 ${
                    isSelected
                      ? isAssigned
                        ? 'bg-[#9d5f2f] text-white border-[#8c4e24] shadow-md shadow-[#9d5f2f]/20 scale-105'
                        : 'bg-stone-800 text-amber-300 border-stone-900 scale-105'
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
                  {isTodayMK && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase tracking-tighter shadow-xs">
                      Hari Ini
                    </span>
                  )}
                  <span className="text-[10px] opacity-75 font-normal">({c.day})</span>
                </button>
              );
            })}
          </div>
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
            <p className="text-xs text-rose-800 leading-relaxed max-w-2xl">
              Sesuai aturan keamanan sistem kelas HK A 2025, setiap Penanggung Jawab hanya diizinkan
              mengelola mata kuliah yang menjadi tanggung jawabnya.
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT FOR AUTHORIZED USER */}
      {isUserAssignedToActiveCourse && activeCourse && (
        <div className="space-y-6">
          {/* Active Course Overview Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                  {activeCourse.code} • {activeCourse.sks} SKS
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  Semester {activeCourse.semester}
                </span>
                {isCourseDayToday ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jadwal Kuliah Hari Ini ({activeCourse.day})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 border border-stone-300">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Jadwal: {activeCourse.day}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
                {activeCourse.name}
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-600 mt-1">
                <span>
                  Dosen: <strong className="text-stone-900">{activeCourse.dosen}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#9d5f2f]" />
                  <span>{activeCourse.time}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9d5f2f]" />
                  <span>{activeCourse.room}</span>
                </span>
              </div>
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAddMaterialModal(true)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                <FolderDown className="w-4 h-4 text-[#9d5f2f]" />
                <span>Unggah Materi / Tugas</span>
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
                title="Download Rekapitulasi Presensi Semester"
                className="px-3.5 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Rekap Excel Semester</span>
              </button>

              {/* Admin Test Simulation Toggle */}
              {isAdmin && (
                <button
                  onClick={() => {
                    const next = !adminSimulateOpen;
                    setAdminSimulateOpen(next);
                    showToast(
                      next
                        ? 'Mode Simulasi Admin: Form absensi dibuka paksa untuk testing.'
                        : 'Mode Simulasi Admin: Dinonaktifkan.'
                    );
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                    adminSimulateOpen
                      ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-sm'
                      : 'bg-stone-900 text-amber-300 border-stone-800 hover:bg-black'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>
                    {adminSimulateOpen ? 'Simulasi Admin Aktif' : 'Simulasi Buka Presensi (Admin)'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* TAB NAVIGATION: ABSENSI HARI INI vs ARSIP PERTEMUAN vs BERKAS MATERI */}
          <div className="flex border-b border-stone-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('ABSENSI')}
              className={`pb-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'ABSENSI'
                  ? 'border-[#9d5f2f] text-[#9d5f2f]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Presensi Mahasiswa</span>
              {isCourseDayToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ARSIP')}
              className={`pb-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'ARSIP'
                  ? 'border-[#9d5f2f] text-[#9d5f2f]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Arsip Pertemuan ({activeCourseSessions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('MATERI')}
              className={`pb-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'MATERI'
                  ? 'border-[#9d5f2f] text-[#9d5f2f]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <FolderDown className="w-4 h-4" />
              <span>Materi & Tugas ({materials.filter((m) => m.courseId === activeCourse.id).length})</span>
            </button>
          </div>

          {/* TAB 1: ABSENSI MAHASISWA */}
          {activeTab === 'ABSENSI' && (
            <div className="space-y-6">
              {/* CASE 1: ATTENDANCE LOCKED (NOT THE COURSE DAY) */}
              {!isAttendanceUnlocked ? (
                <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-stone-200/90 text-center shadow-sm space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-800 mx-auto flex items-center justify-center border border-amber-200 shadow-inner">
                    <Lock className="w-8 h-8 text-amber-700" />
                  </div>
                  <div className="max-w-xl mx-auto space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      🔒 Presensi Belum Dibuka
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-stone-900 pt-1">
                      Hanya Terbuka Pada Hari {activeCourse.day}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Mata kuliah <strong>{activeCourse.name}</strong> memiliki jadwal perkuliahan resmi
                      setiap hari <strong>{activeCourse.day}</strong> ({activeCourse.time}, {activeCourse.room}).
                    </p>
                    <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1 text-left max-w-md mx-auto mt-3">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Hari ini:</span>
                        <strong className="text-stone-800">{todayDayName}, {todayFormatted}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Jadwal Matkul:</span>
                        <strong className="text-[#9d5f2f]">Hari {activeCourse.day}</strong>
                      </div>
                      <p className="text-[11px] text-stone-500 pt-1 italic border-t border-stone-200 mt-1">
                        Sistem mengunci absensi secara otomatis agar tidak dapat diisi mendahului jadwal ataupun dimajukan untuk minggu depan.
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="pt-3">
                        <button
                          onClick={() => {
                            setAdminSimulateOpen(true);
                            showToast('Mode Uji Coba Admin diaktifkan!');
                          }}
                          className="px-4 py-2 bg-stone-900 hover:bg-black text-amber-300 text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center space-x-1.5"
                        >
                          <Unlock className="w-4 h-4 text-amber-400" />
                          <span>Buka Paksa Presensi untuk Testing (Superadmin)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* CASE 2: ATTENDANCE UNLOCKED (TODAY IS THE COURSE DAY OR ADMIN SIMULATING) */
                <div className="space-y-6">
                  {/* Attendance Session Header & Quick Controls */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Presensi Dibuka Hari Ini</span>
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#9d5f2f] text-white">
                            Pertemuan Ke-{currentSession ? currentSession.meetingNumber : activeCourseSessions.length + 1}
                          </span>
                          <span className="text-xs text-stone-500 font-mono">
                            {todayFormatted} • {activeCourse.time}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-stone-900 mt-2">
                          Lembar Absensi {students.length} Mahasiswa — {activeCourse.name}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Klik tombol status pada masing-masing mahasiswa di bawah untuk mengubah kehadiran (Hadir, Izin, Sakit, Alfa, Dispensasi).
                        </p>
                      </div>

                      {/* Export / Print / Code Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentSession && (
                          <>
                            <button
                              onClick={() => setShowPrintModal(true)}
                              className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>Cetak PDF</span>
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
                              className="px-3.5 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Unduh CSV</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setNewMeetingNum(activeCourseSessions.length + 1);
                            setShowNewSessionModal(true);
                          }}
                          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Sesi Manual</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Toolbar & Bulk Action */}
                    <div className="pt-4 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* 5 Attendance Status Counters */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-stone-600 mr-1">Rekap:</span>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center space-x-1">
                          <span>Hadir:</span>
                          <strong className="text-emerald-950 font-black">{hadirCount}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold flex items-center space-x-1">
                          <span>Izin:</span>
                          <strong className="text-blue-950 font-black">{izinCount}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center space-x-1">
                          <span>Sakit:</span>
                          <strong className="text-amber-950 font-black">{sakitCount}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold flex items-center space-x-1">
                          <span>Dispensasi:</span>
                          <strong className="text-purple-950 font-black">{dispensasiCount}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center space-x-1">
                          <span>Alfa:</span>
                          <strong className="text-rose-950 font-black">{alpaCount}</strong>
                        </span>
                      </div>

                      {/* Bulk "Mark All Hadir" Button */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleMarkAllHadir}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-700/20 flex items-center space-x-1.5 text-xs active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>Tandai Semua Hadir (1 Klik)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* KUMPULAN NAMA-NAMA 30 MAHASISWA & TOMBOL STATUS */}
                  <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Cari nama atau NIM mahasiswa..."
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] bg-stone-50/50"
                        />
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        Daftar <strong>{filteredStudents.length}</strong> Mahasiswa Terdaftar
                      </span>
                    </div>

                    {/* MOBILE CARD VIEW (Optimized for Phones) */}
                    <div className="block md:hidden divide-y divide-stone-100">
                      {filteredStudents.map((st, idx) => {
                        const rec = currentRecords.find(
                          (r) => r.studentNim.trim() === st.nim.trim()
                        );
                        const currentStatus: AttendanceStatus = rec ? rec.status : 'ALPA';

                        return (
                          <div key={st.nim} className="p-4 space-y-3 hover:bg-amber-50/20 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-mono font-bold text-stone-400">
                                    #{idx + 1}
                                  </span>
                                  <h4 className="text-sm font-black text-stone-900">{st.name}</h4>
                                </div>
                                <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                                  NIM: {st.nim} • {st.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </p>
                              </div>
                              <AttendanceBadge status={currentStatus} />
                            </div>

                            {/* 5 Status Action Buttons */}
                            <div className="grid grid-cols-5 gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.nim, 'HADIR')}
                                className={`py-2 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center justify-center ${
                                  currentStatus === 'HADIR'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-stone-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                <span>Hadir</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.nim, 'IZIN')}
                                className={`py-2 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center justify-center ${
                                  currentStatus === 'IZIN'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-stone-50 hover:bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                <span>Izin</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.nim, 'SAKIT')}
                                className={`py-2 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center justify-center ${
                                  currentStatus === 'SAKIT'
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-stone-50 hover:bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                <span>Sakit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.nim, 'DISPENSASI')}
                                className={`py-2 text-[10px] font-bold rounded-xl transition-all flex flex-col items-center justify-center ${
                                  currentStatus === 'DISPENSASI'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-stone-50 hover:bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                <span>Dispensasi</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.nim, 'ALPA')}
                                className={`py-2 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center justify-center ${
                                  currentStatus === 'ALPA'
                                    ? 'bg-rose-600 text-white shadow-md'
                                    : 'bg-stone-50 hover:bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                <span>Alfa</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
                            <th className="py-3 px-4 text-center w-12">No</th>
                            <th className="py-3 px-4 w-32">NIM</th>
                            <th className="py-3 px-4">Nama Mahasiswa</th>
                            <th className="py-3 px-3 text-center w-12">L/P</th>
                            <th className="py-3 px-4 text-center w-96">Status Kehadiran (Pilih Satu)</th>
                            <th className="py-3 px-4">Catatan Keterangan</th>
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
                                    ? 'bg-rose-50/15'
                                    : 'bg-stone-50/40'
                                }`}
                              >
                                <td className="py-3 px-4 text-center text-stone-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 font-mono font-semibold text-stone-800">
                                  {st.nim}
                                </td>
                                <td className="py-3 px-4 font-bold text-stone-900">
                                  {st.name}
                                </td>
                                <td className="py-3 px-3 text-center text-stone-500 font-semibold">
                                  {st.gender}
                                </td>

                                {/* 5 Action Buttons */}
                                <td className="py-2.5 px-4 text-center">
                                  <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(st.nim, 'HADIR')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        currentStatus === 'HADIR'
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-white'
                                      }`}
                                    >
                                      Hadir
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(st.nim, 'IZIN')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        currentStatus === 'IZIN'
                                          ? 'bg-blue-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-white'
                                      }`}
                                    >
                                      Izin
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(st.nim, 'SAKIT')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        currentStatus === 'SAKIT'
                                          ? 'bg-amber-500 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-white'
                                      }`}
                                    >
                                      Sakit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(st.nim, 'DISPENSASI')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        currentStatus === 'DISPENSASI'
                                          ? 'bg-purple-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-white'
                                      }`}
                                    >
                                      Dispensasi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(st.nim, 'ALPA')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        currentStatus === 'ALPA'
                                          ? 'bg-rose-600 text-white shadow-sm'
                                          : 'text-stone-600 hover:bg-white'
                                      }`}
                                    >
                                      Alfa
                                    </button>
                                  </div>
                                </td>

                                {/* Optional Note */}
                                <td className="py-2.5 px-4">
                                  <input
                                    type="text"
                                    placeholder="Catatan..."
                                    defaultValue={rec?.notes || ''}
                                    onBlur={(e) => {
                                      if (e.target.value !== (rec?.notes || '')) {
                                        handleStatusChange(st.nim, currentStatus, e.target.value);
                                      }
                                    }}
                                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-200 focus:border-[#9d5f2f] focus:outline-none bg-transparent"
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

          {/* TAB 2: ARSIP PERTEMUAN SEBELUMNYA */}
          {activeTab === 'ARSIP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Riwayat Semua Pertemuan ({activeCourseSessions.length})
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Arsip presensi pertemuan yang telah dilaksanakan untuk mata kuliah {activeCourse.name}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewMeetingNum(activeCourseSessions.length + 1);
                    setShowNewSessionModal(true);
                  }}
                  className="px-3.5 py-2 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pertemuan Manual</span>
                </button>
              </div>

              {activeCourseSessions.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-dashed border-stone-300 text-center space-y-3">
                  <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs text-stone-500">
                    Belum ada riwayat pertemuan perkuliahan untuk mata kuliah ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCourseSessions.map((sess) => {
                    const sessRecs = records.filter((r) => r.sessionId === sess.id);
                    const hC = sessRecs.filter((r) => r.status === 'HADIR').length;
                    const iC = sessRecs.filter((r) => r.status === 'IZIN').length;
                    const sC = sessRecs.filter((r) => r.status === 'SAKIT').length;
                    const dC = sessRecs.filter((r) => r.status === 'DISPENSASI').length;
                    const aC = sessRecs.filter((r) => r.status === 'ALPA').length;

                    return (
                      <div
                        key={sess.id}
                        className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 hover:border-amber-400 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                              Pertemuan {sess.meetingNumber}
                            </span>
                            <p className="text-xs font-mono text-stone-500 mt-1">
                              {sess.date} ({sess.startTime} - {sess.endTime})
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteSession(sess.id)}
                            title="Hapus sesi ini"
                            className="p-1 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-stone-800 font-semibold line-clamp-1">
                          &quot;{sess.topic}&quot;
                        </p>

                        <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                            {hC} Hadir
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800">
                            {iC} Izin
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                            {sC} Sakit
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800">
                            {dC} Dispensasi
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800">
                            {aC} Alpa
                          </span>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => {
                              setActiveSessionId(sess.id);
                              setShowPrintModal(true);
                            }}
                            className="text-[#9d5f2f] hover:underline font-bold flex items-center space-x-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak PDF</span>
                          </button>
                          <button
                            onClick={() =>
                              exportSingleSessionCsv(activeCourse, sess, students, records)
                            }
                            className="text-stone-600 hover:text-stone-900 font-semibold flex items-center space-x-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Excel</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BERKAS MATERI & TUGAS */}
          {activeTab === 'MATERI' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Repositori Berkas & Tugas ({materials.filter((m) => m.courseId === activeCourse.id).length})
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Modul, RPS, materi presentasi, dan berkas tugas untuk {activeCourse.name}.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMaterialModal(true)}
                  className="px-3.5 py-2 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Unggah Berkas Baru</span>
                </button>
              </div>

              {materials.filter((m) => m.courseId === activeCourse.id).length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-dashed border-stone-300 text-center space-y-3">
                  <FolderDown className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs text-stone-500">
                    Belum ada berkas atau materi yang diunggah untuk mata kuliah ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materials
                    .filter((m) => m.courseId === activeCourse.id)
                    .map((mat) => (
                      <div
                        key={mat.id}
                        className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-start justify-between gap-3 hover:border-amber-400 transition-colors"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            {mat.type}
                          </span>
                          <h4 className="text-sm font-bold text-stone-900">{mat.title}</h4>
                          {mat.description && (
                            <p className="text-xs text-stone-500">{mat.description}</p>
                          )}
                          <p className="text-[10px] text-stone-400">
                            Diupload: {mat.uploadedAt} • Oleh: {mat.uploadedBy}
                          </p>
                        </div>
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs font-bold flex items-center space-x-1 flex-shrink-0"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
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

      </div>

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
    </>
  );
}

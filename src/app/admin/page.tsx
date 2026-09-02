'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  BookOpen,
  UserPlus,
  Upload,
  Sparkles,
  KeyRound,
  Trash2,
  Edit2,
  FileText,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Bell,
  Database,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Printer,
  ArrowRight,
  Clock,
  MapPin,
  Save,
  Check,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import {
  Course,
  Student,
  Announcement,
  AuthSession,
  Gender,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
} from '@/lib/types';
import { parsePdfRoster, parseCsvRoster } from '@/lib/pdfParser';
import AttendanceSheetPrint from '@/components/attendance/AttendanceSheetPrint';
import { exportSingleSessionCsv } from '@/lib/exportUtils';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<'PJ' | 'REVISI_ABSENSI' | 'STUDENTS' | 'ANNOUNCEMENTS' | 'SETTINGS'>('PJ');

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [adminPin, setAdminPin] = useState<string>('');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Helper local date string YYYY-MM-DD
  const getLocalDateString = (d: Date = new Date()): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Calendar & Attendance Intervention State
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedRevDate, setSelectedRevDate] = useState<string>(getLocalDateString());
  const [selectedRevCourseId, setSelectedRevCourseId] = useState<string>('');
  const [searchRevStudent, setSearchRevStudent] = useState<string>('');
  const [toastRev, setToastRev] = useState<string | null>(null);
  const [showRevPrintModal, setShowRevPrintModal] = useState<boolean>(false);

  // Active course and session for revision and print modal
  const revDateParts = selectedRevDate.split('-').map(Number);
  const selDateObj =
    revDateParts.length === 3 ? new Date(revDateParts[0], revDateParts[1] - 1, revDateParts[2]) : new Date();
  const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const selDayName = INDO_DAYS[selDateObj.getDay()];

  const dateSessions = sessions.filter((s) => s.date === selectedRevDate);
  const relevantCourses = courses.filter(
    (c) =>
      c.day.toLowerCase().trim() === selDayName.toLowerCase().trim() ||
      dateSessions.some((s) => s.courseId === c.id)
  );

  const activeRevCourse =
    relevantCourses.find((c) => c.id === selectedRevCourseId) ||
    relevantCourses[0] ||
    courses[0] ||
    null;

  const activeRevSession =
    dateSessions.find((s) => s.courseId === activeRevCourse?.id) || null;

  const activeRevRecords = activeRevSession
    ? records.filter((r) => r.sessionId === activeRevSession.id)
    : [];

  // Modals & Form States
  const [searchStudent, setSearchStudent] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newNim, setNewNim] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('L');

  // PJ Assignment Modal
  const [selectedCourseForPj, setSelectedCourseForPj] = useState<Course | null>(null);
  const [pjModalSearch, setPjModalSearch] = useState('');

  // PDF / CSV Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Student[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Announcement Form Modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'PENTING' | 'AKADEMIK' | 'TUGAS' | 'UMUM'>('AKADEMIK');

  // Change Admin Pin
  const [newMasterPin, setNewMasterPin] = useState('');
  const [pinNotice, setPinNotice] = useState<string | null>(null);

  // Course Edit Modal State (Setting Nama, Dosen, Hari, Jam & Ruang)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseDosen, setEditCourseDosen] = useState('');
  const [editCourseDay, setEditCourseDay] = useState('Senin');
  const [editCourseTime, setEditCourseTime] = useState('');
  const [editCourseRoom, setEditCourseRoom] = useState('');
  const [editCourseSks, setEditCourseSks] = useState<number>(2);
  const [editCourseDrive, setEditCourseDrive] = useState('');
  const [courseEditNotice, setCourseEditNotice] = useState<string | null>(null);

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourseName(course.name);
    setEditCourseDosen(course.dosen);
    setEditCourseDay(course.day);
    setEditCourseTime(course.time);
    setEditCourseRoom(course.room);
    setEditCourseSks(course.sks);
    setEditCourseDrive(course.driveLink || '');
    setCourseEditNotice(null);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    appStore.updateCourse(editingCourse.id, {
      name: editCourseName.trim(),
      dosen: editCourseDosen.trim(),
      day: editCourseDay,
      time: editCourseTime.trim(),
      room: editCourseRoom.trim(),
      sks: Number(editCourseSks),
      driveLink: editCourseDrive.trim(),
    });

    setCourseEditNotice(`Data mata kuliah "${editCourseName}" berhasil disimpan!`);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setTimeout(() => {
      setEditingCourse(null);
      setCourseEditNotice(null);
    }, 1000);
  };

  useEffect(() => {
    const update = () => {
      const currentAuth = appStore.getAuth();
      if (!currentAuth || currentAuth.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setAuth(currentAuth);
      setCourses(appStore.getCourses());
      setStudents(appStore.getStudents());
      setAnnouncements(appStore.getAnnouncements());
      setAdminPin(appStore.getAdminPin());
      setSessions(appStore.getSessions());
      setRecords(appStore.getRecords());
    };

    update();
    const unsub = appStore.subscribe(update);
    return () => unsub();
  }, [router]);

  if (!auth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#9d5f2f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle Add Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNim || !newName) return;

    const success = appStore.addStudent({
      nim: newNim.trim(),
      name: newName.trim(),
      gender: newGender,
      isPinSet: false,
      status: 'AKTIF',
      createdAt: new Date().toISOString().split('T')[0],
    });

    if (success) {
      setShowAddStudentModal(false);
      setNewNim('');
      setNewName('');
    } else {
      alert('NIM sudah terdaftar di sistem!');
    }
  };

  // Handle Reset PIN
  const handleResetPin = (student: Student) => {
    if (confirm(`Reset PIN untuk ${student.name} (${student.nim})? Mahasiswa akan diminta membuat PIN baru saat login berikutnya.`)) {
      appStore.updateStudent(student.nim, {
        pin: undefined,
        isPinSet: false,
      });
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Hapus ${student.name} (${student.nim}) dari Whitelist kelas? Tindakan ini akan mencabut akses login mahasiswa ini.`)) {
      appStore.deleteStudent(student.nim);
    }
  };

  // Toggle PJ assignment for a student on selected course
  const handleTogglePj = (courseId: string, studentNim: string) => {
    const crs = courses.find((c) => c.id === courseId);
    if (!crs) return;

    let updatedPjs = [...crs.pjNims];
    if (updatedPjs.includes(studentNim)) {
      updatedPjs = updatedPjs.filter((p) => p !== studentNim);
    } else {
      updatedPjs.push(studentNim);
    }

    appStore.assignPj(courseId, updatedPjs);
  };

  // Handle PDF File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setUploadError(null);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const res = await parsePdfRoster(file);
        if (res.success && res.data.length > 0) {
          setParsedPreview(res.data);
        } else {
          setUploadError(res.error || 'Tidak dapat membaca tabel mahasiswa dari PDF.');
        }
      } else {
        // Assume text / csv
        const text = await file.text();
        const res = parseCsvRoster(text);
        if (res.length > 0) {
          setParsedPreview(res);
        } else {
          setUploadError('Format berkas CSV tidak memuat kolom NIM dan Nama yang valid.');
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal memproses berkas.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyImport = (replace: boolean) => {
    if (parsedPreview.length === 0) return;
    appStore.importStudents(parsedPreview, replace);
    setShowUploadModal(false);
    setParsedPreview([]);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  // Handle Create Announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    appStore.addAnnouncement({
      title: annTitle,
      content: annContent,
      category: annCategory,
      author: 'Administrator Kelas HK A',
      pinned: true,
    });

    setShowAnnModal(false);
    setAnnTitle('');
    setAnnContent('');
  };

  // Filtered students for student list
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nim.includes(searchStudent)
  );

  return (
    <>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 ${showRevPrintModal ? 'print:hidden' : ''}`}>
      {/* Header Admin Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-stone-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-stone-950 flex items-center space-x-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-950" />
              <span>Superadmin Portal</span>
            </span>
            <span className="text-xs text-stone-400 font-mono">HK A 2025 • UIN SSC</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black mt-2 text-white">
            Panel Kendali Utama Administrator
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            Kelola penugasan PJ 11 mata kuliah, whitelist mahasiswa dari PDF, pengumuman, dan sistem presensi.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/pj"
            className="px-4 py-2.5 rounded-xl bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Mode PJ Presensi</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition-all"
          >
            Lihat Beranda Publik
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-stone-200 gap-2 pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('PJ')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'PJ'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Penugasan PJ (11 Mata Kuliah)</span>
        </button>

        <button
          onClick={() => setActiveTab('REVISI_ABSENSI')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'REVISI_ABSENSI'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-amber-500" />
          <span>Intervensi Kalender Absensi</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'STUDENTS'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Whitelist Mahasiswa ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Papan Pengumuman</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'SETTINGS'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Pengaturan & Backup</span>
        </button>
      </div>

      {/* TAB 1: PENUGASAN PJ 11 MATA KULIAH */}
      {activeTab === 'PJ' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Distribusi Penanggung Jawab (PJ) Per Mata Kuliah
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Admin dapat memilih siapa saja dari keseluruhan {students.length} mahasiswa kelas untuk menjadi PJ di masing-masing 11 mata kuliah.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-900 rounded-full w-fit">
              11 Mata Kuliah Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((crs) => {
              const assignedStudents = students.filter((s) => crs.pjNims.includes(s.nim));

              return (
                <div
                  key={crs.id}
                  className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:border-[#9d5f2f] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono font-bold text-[#9d5f2f] bg-amber-50 px-2 py-0.5 rounded">
                        {crs.code}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500">
                        {crs.sks} SKS • {crs.day}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-stone-900 group-hover:text-[#9d5f2f] transition-colors mb-1">
                      {crs.name}
                    </h3>
                    <p className="text-xs text-stone-600 mb-2">{crs.dosen}</p>

                    {/* Schedule & Room info */}
                    <div className="flex items-center space-x-2 text-[11px] text-stone-600 mb-3 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
                      <Clock className="w-3.5 h-3.5 text-[#9d5f2f] flex-shrink-0" />
                      <span className="font-mono font-bold">{crs.time}</span>
                      <span className="text-stone-300">•</span>
                      <MapPin className="w-3.5 h-3.5 text-[#9d5f2f] flex-shrink-0" />
                      <span className="font-semibold line-clamp-1">{crs.room}</span>
                    </div>

                    {/* Assigned PJ List */}
                    <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                        <span>Penanggung Jawab ({assignedStudents.length})</span>
                      </div>

                      {assignedStudents.length === 0 ? (
                        <p className="text-xs text-amber-700 italic py-1">
                          Belum ada PJ yang ditugaskan.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {assignedStudents.map((st) => (
                            <div
                              key={st.nim}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs"
                            >
                              <div>
                                <p className="font-bold text-stone-900">{st.name}</p>
                                <p className="text-[10px] text-stone-400 font-mono">{st.nim}</p>
                              </div>
                              <button
                                onClick={() => handleTogglePj(crs.id, st.nim)}
                                title="Cabut Penugasan PJ"
                                className="text-stone-400 hover:text-red-600 p-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                    <button
                      onClick={() => handleOpenEditCourse(crs)}
                      className="w-full py-2 bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Setting Mata Kuliah (Dosen, Jam & Ruang)</span>
                    </button>

                    <button
                      onClick={() => setSelectedCourseForPj(crs)}
                      className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Atur & Tambah PJ Mata Kuliah</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INTERVENSI KALENDER ABSENSI */}
      {activeTab === 'REVISI_ABSENSI' && (() => {
        // 1. Calendar Calculations
        const calYear = calendarMonth.getFullYear();
        const calMonth = calendarMonth.getMonth();
        const MONTH_NAMES_ID = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const DAY_NAMES_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        // Day index for the 1st of this month (Monday=0 ... Sunday=6)
        const firstDayIdx = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;

        // 2. Selected Date Calculations
        const parts = selectedRevDate.split('-').map(Number);
        const selDateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
        const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const selDayName = INDO_DAYS[selDateObj.getDay()];
        const selDateFormatted = `${selDayName}, ${String(selDateObj.getDate()).padStart(2, '0')} ${MONTH_NAMES_ID[selDateObj.getMonth()]} ${selDateObj.getFullYear()}`;

        // Sessions that exist on selectedRevDate
        const dateSessions = sessions.filter((s) => s.date === selectedRevDate);

        // Courses scheduled on selDayName OR has a session on selectedRevDate
        const relevantCourses = courses.filter(
          (c) =>
            c.day.toLowerCase().trim() === selDayName.toLowerCase().trim() ||
            dateSessions.some((s) => s.courseId === c.id)
        );

        // Active selected course
        const activeRevCourse =
          relevantCourses.find((c) => c.id === selectedRevCourseId) ||
          relevantCourses[0] ||
          courses[0];

        // Active session for selected course on selectedRevDate
        const activeRevSession =
          dateSessions.find((s) => s.courseId === activeRevCourse?.id) || null;

        // Active records for this session
        const activeRevRecords = activeRevSession
          ? records.filter((r) => r.sessionId === activeRevSession.id)
          : [];

        // Counters
        let hadirCount = 0;
        let izinCount = 0;
        let sakitCount = 0;
        let dispensasiCount = 0;
        let alpaCount = 0;

        students.forEach((st) => {
          const r = activeRevRecords.find((rec) => rec.studentNim.trim() === st.nim.trim());
          const stt = r ? r.status : 'ALPA';
          if (stt === 'HADIR') hadirCount++;
          else if (stt === 'IZIN') izinCount++;
          else if (stt === 'SAKIT') sakitCount++;
          else if (stt === 'DISPENSASI') dispensasiCount++;
          else alpaCount++;
        });

        const totalStudents = students.length;

        // Handlers
        const handlePrevMonth = () => {
          setCalendarMonth(new Date(calYear, calMonth - 1, 1));
        };

        const handleNextMonth = () => {
          setCalendarMonth(new Date(calYear, calMonth + 1, 1));
        };

        const handleJumpToday = () => {
          const now = new Date();
          setCalendarMonth(now);
          setSelectedRevDate(getLocalDateString(now));
        };

        const handleStatusClick = (studentNim: string, newStatus: AttendanceStatus, notes?: string) => {
          if (!activeRevSession || !activeRevCourse) return;
          appStore.setAttendanceRecord(
            activeRevSession.id,
            activeRevCourse.id,
            studentNim,
            newStatus,
            'ADMIN (Revisi)',
            notes
          );
          setToastRev(`Presensi NIM ${studentNim} direvisi menjadi ${newStatus}!`);
          setTimeout(() => setToastRev(null), 3000);
        };

        const handleMarkAllHadir = () => {
          if (!activeRevSession || !activeRevCourse) return;
          appStore.batchMarkAll(activeRevSession.id, activeRevCourse.id, 'HADIR', 'ADMIN (Revisi)');
          setToastRev(`Semua ${students.length} mahasiswa ditandai HADIR!`);
          setTimeout(() => setToastRev(null), 3000);
        };

        const handleCreateSessionForDate = () => {
          if (!activeRevCourse) return;
          const courseSessions = sessions.filter((s) => s.courseId === activeRevCourse.id);
          const nextMeetingNumber = courseSessions.length + 1;
          const timeParts = activeRevCourse.time.replace('WIB', '').split('-');
          const startTime = timeParts[0]?.trim() || '08:00';
          const endTime = timeParts[1]?.trim() || '09:40';

          const created = appStore.createSession({
            courseId: activeRevCourse.id,
            meetingNumber: nextMeetingNumber,
            date: selectedRevDate,
            startTime,
            endTime,
            topic: `Perkuliahan Pertemuan ke-${nextMeetingNumber}`,
            dosenPresent: true,
            isOpenForSelfCheckin: false,
            createdByNim: auth.nim || 'ADMIN',
          });

          appStore.batchMarkAll(created.id, activeRevCourse.id, 'HADIR', 'ADMIN (Revisi)');
          setSelectedRevCourseId(activeRevCourse.id);
          setToastRev(`Sesi pertemuan ke-${nextMeetingNumber} berhasil dibuat untuk tanggal ${selectedRevDate}!`);
          setTimeout(() => setToastRev(null), 3000);
        };

        const handleDeleteRevSession = () => {
          if (!activeRevSession) return;
          if (confirm(`Hapus sesi pertemuan tanggal ${selectedRevDate} untuk mata kuliah ${activeRevCourse.name}?`)) {
            appStore.deleteSession(activeRevSession.id);
            setToastRev('Sesi pertemuan berhasil dihapus.');
            setTimeout(() => setToastRev(null), 3000);
          }
        };

        const filteredRevStudents = students.filter(
          (s) =>
            s.name.toLowerCase().includes(searchRevStudent.toLowerCase()) ||
            s.nim.includes(searchRevStudent)
        );

        return (
          <div className="space-y-6">
            {/* Toast Feedback */}
            {toastRev && (
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-fade-in">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{toastRev}</span>
                </div>
                <button onClick={() => setToastRev(null)} className="text-white/80 hover:text-white">✕</button>
              </div>
            )}

            {/* Top Overview & Instructions */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Mode Intervensi Absensi Superadmin</span>
                  </span>
                  <span className="text-xs text-stone-500 font-mono">Revisi & Backfill Tanggal</span>
                </div>
                <h2 className="text-lg font-bold text-stone-900 mt-1">
                  Kalender Intervensi & Koreksi Absensi Perkuliahan
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pilih tanggal mana saja pada kalender (hari ini atau lampau). Sistem otomatis membuka jadwal hari tersebut dan mengizinkan Anda merevisi kehadiran mahasiswa.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleJumpToday}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lompat ke Hari Ini</span>
                </button>
              </div>
            </div>

            {/* Layout Grid: Left Calendar Widget + Right Intervention Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: INTERACTIVE MONTHLY CALENDAR */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
                {/* Calendar Navigation Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      {MONTH_NAMES_ID[calMonth]} {calYear}
                    </h3>
                    <p className="text-[11px] text-stone-500">Klik tanggal untuk membuka absensi</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Names Header */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-stone-400 py-1 border-b border-stone-100">
                  {DAY_NAMES_SHORT.map((dn, idx) => (
                    <div key={idx} className={idx >= 5 ? 'text-rose-400' : ''}>{dn}</div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {/* Empty cells for padding */}
                  {Array.from({ length: firstDayIdx }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10 rounded-xl bg-stone-50/50" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedRevDate;
                    const isToday = dateStr === getLocalDateString();
                    const daySessions = sessions.filter((s) => s.date === dateStr);
                    const hasSession = daySessions.length > 0;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedRevDate(dateStr);
                          setSelectedRevCourseId('');
                        }}
                        className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all text-xs font-bold ${
                          isSelected
                            ? 'bg-[#9d5f2f] text-white shadow-md shadow-[#9d5f2f]/30 scale-105 z-10'
                            : isToday
                            ? 'bg-amber-50 text-[#9d5f2f] border-2 border-amber-400 hover:bg-amber-100'
                            : hasSession
                            ? 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                            : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {/* Indicator dot if session exists */}
                        {hasSession && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              isSelected ? 'bg-amber-300' : 'bg-emerald-600'
                            }`}
                            title={`${daySessions.length} sesi absensi`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Ada Sesi Absensi</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-md border-2 border-amber-400 bg-amber-50" />
                    <span>Hari Ini</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-[#9d5f2f]" />
                    <span>Terpilih</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ATTENDANCE REVISION WORKSPACE */}
              <div className="lg:col-span-7 space-y-5">
                {/* Active Date Header Card */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-[#9d5f2f] text-white">
                          📅 {selDateFormatted}
                        </span>
                        <span className="text-xs font-bold text-stone-500">
                          {dateSessions.length} Sesi Terbuka
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-stone-900 mt-2">
                        Jadwal & Presensi Hari {selDayName}
                      </h3>
                    </div>

                    {/* Quick Date Picker */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-stone-500 font-medium">Ubah Tanggal:</span>
                      <input
                        type="date"
                        value={selectedRevDate}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedRevDate(e.target.value);
                            setSelectedRevCourseId('');
                          }
                        }}
                        className="bg-stone-50 border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f]"
                      />
                    </div>
                  </div>

                  {/* Course Selector for Selected Day */}
                  {relevantCourses.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                      Tidak ada jadwal kuliah reguler pada hari {selDayName}. Anda dapat memilih mata kuliah lain di bawah jika ada kelas pengganti.
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-stone-700 block mb-2">
                        Pilih Mata Kuliah Hari {selDayName}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {relevantCourses.map((c) => {
                          const isCur = c.id === activeRevCourse?.id;
                          const hasSess = dateSessions.some((s) => s.courseId === c.id);

                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedRevCourseId(c.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                                isCur
                                  ? 'bg-stone-900 text-white shadow-md'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200'
                              }`}
                            >
                              <span>{c.name}</span>
                              {hasSess ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-black">
                                  ✓ Sesi Ada
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-600">
                                  Kosong
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTIVE COURSE INTERVENTION WORKSPACE */}
                {activeRevCourse && (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-5">
                    {/* Course Details & Actions Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900">
                            {activeRevCourse.code} • {activeRevCourse.sks} SKS
                          </span>
                          <span className="text-xs text-stone-500 font-mono">
                            {activeRevCourse.time} • {activeRevCourse.room}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-stone-900 mt-1">
                          {activeRevCourse.name}
                        </h4>
                        <p className="text-xs text-stone-500">
                          Dosen Pengampu: <strong>{activeRevCourse.dosen}</strong>
                        </p>
                      </div>

                      {/* Export / Print Actions if session exists */}
                      {activeRevSession && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setShowRevPrintModal(true)}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Cetak PDF</span>
                          </button>
                          <button
                            onClick={() =>
                              exportSingleSessionCsv(
                                activeRevCourse,
                                activeRevSession,
                                students,
                                activeRevRecords
                              )
                            }
                            className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Unduh CSV</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CASE 1: SESSION EXISTS */}
                    {activeRevSession ? (
                      <div className="space-y-4">
                        {/* Session Metadata Banner */}
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center space-x-2 font-bold text-amber-950">
                              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                                Pertemuan Ke-{activeRevSession.meetingNumber}
                              </span>
                              <span>{activeRevSession.topic}</span>
                            </div>
                            <p className="text-amber-800 text-[11px] mt-1">
                              Waktu: {activeRevSession.startTime} - {activeRevSession.endTime} WIB • Dosen Hadir: {activeRevSession.dosenPresent ? 'Ya' : 'Tidak'}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={handleDeleteRevSession}
                              className="px-2.5 py-1 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                              title="Hapus sesi ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Sesi</span>
                            </button>
                          </div>
                        </div>

                        {/* Status Summary Counters & Bulk Mark Hadir */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-bold text-stone-600 mr-1 text-[11px]">Rekap:</span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                              Hadir: {hadirCount}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-bold text-[11px]">
                              Izin: {izinCount}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px]">
                              Sakit: {sakitCount}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-bold text-[11px]">
                              Dispen: {dispensasiCount}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 font-bold text-[11px]">
                              Alfa: {alpaCount}
                            </span>
                          </div>

                          <button
                            onClick={handleMarkAllHadir}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Tandai Semua Hadir</span>
                          </button>
                        </div>

                        {/* Student Search */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Cari nama atau NIM mahasiswa yang ingin direvisi..."
                            value={searchRevStudent}
                            onChange={(e) => setSearchRevStudent(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9d5f2f] focus:outline-none"
                          />
                        </div>

                        {/* Student Attendance List Table for Revision */}
                        <div className="border border-stone-200 rounded-2xl overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-stone-200">
                                <tr>
                                  <th className="py-2.5 px-3 text-center w-10">No</th>
                                  <th className="py-2.5 px-3 w-28">NIM</th>
                                  <th className="py-2.5 px-3">Nama Mahasiswa</th>
                                  <th className="py-2.5 px-3 text-center w-64">Intervensi Status</th>
                                  <th className="py-2.5 px-3 w-40">Keterangan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 bg-white">
                                {filteredRevStudents.map((st, index) => {
                                  const rec = activeRevRecords.find(
                                    (r) => r.studentNim.trim() === st.nim.trim()
                                  );
                                  const curStatus = rec ? rec.status : 'ALPA';

                                  return (
                                    <tr key={st.nim} className="hover:bg-stone-50/80 transition-colors">
                                      <td className="py-2.5 px-3 text-center text-stone-400 text-[11px]">
                                        {index + 1}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-[#9d5f2f] font-bold">
                                        {st.nim}
                                      </td>
                                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                                        <div>{st.name}</div>
                                        {rec?.verifiedBy && (
                                          <span className="text-[10px] font-normal text-stone-400">
                                            Oleh: {rec.verifiedBy}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                                          {(['HADIR', 'IZIN', 'SAKIT', 'DISPENSASI', 'ALPA'] as AttendanceStatus[]).map((statusOption) => {
                                            const isSelected = curStatus === statusOption;
                                            return (
                                              <button
                                                key={statusOption}
                                                onClick={() => handleStatusClick(st.nim, statusOption, rec?.notes)}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                                                  isSelected
                                                    ? statusOption === 'HADIR'
                                                      ? 'bg-emerald-600 text-white shadow-xs'
                                                      : statusOption === 'IZIN'
                                                      ? 'bg-blue-600 text-white shadow-xs'
                                                      : statusOption === 'SAKIT'
                                                      ? 'bg-amber-600 text-white shadow-xs'
                                                      : statusOption === 'DISPENSASI'
                                                      ? 'bg-purple-600 text-white shadow-xs'
                                                      : 'bg-rose-600 text-white shadow-xs'
                                                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                                                }`}
                                              >
                                                {statusOption === 'DISPENSASI' ? 'DISPEN' : statusOption}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3">
                                        <input
                                          type="text"
                                          placeholder="Catatan..."
                                          defaultValue={rec?.notes || ''}
                                          onBlur={(e) => {
                                            if (e.target.value !== (rec?.notes || '')) {
                                              handleStatusClick(st.nim, curStatus, e.target.value);
                                            }
                                          }}
                                          className="w-full px-2 py-1 rounded-lg border border-stone-200 text-[11px] focus:ring-1 focus:ring-[#9d5f2f] focus:outline-none"
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
                    ) : (
                      /* CASE 2: NO SESSION YET FOR THIS COURSE ON SELECTED DATE */
                      <div className="py-12 px-6 rounded-3xl border-2 border-dashed border-stone-200 text-center space-y-4 bg-stone-50/50">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                          <CalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-stone-900">
                            Belum Ada Sesi Presensi Tercatat
                          </h4>
                          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                            Mata kuliah <strong>{activeRevCourse.name}</strong> belum memiliki berita acara atau lembar presensi pada tanggal <strong>{selDateFormatted}</strong>.
                          </p>
                        </div>
                        <button
                          onClick={handleCreateSessionForDate}
                          className="px-5 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Buka / Buat Sesi Presensi untuk Tanggal Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: WHITELIST MAHASISWA & UPLOAD PDF */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Daftar Whitelist Mahasiswa Resmi HK A 2025
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Hanya mahasiswa yang tercantum di sini yang diizinkan masuk ke portal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 bg-stone-900 hover:bg-black text-amber-300 text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Unggah Berkas PDF / CSV Roster</span>
              </button>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold rounded-xl shadow-md shadow-[#9d5f2f]/20 transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mahasiswa Manual</span>
              </button>
            </div>
          </div>

          {/* Student Table Card */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIM mahasiswa..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f]"
                />
              </div>
              <span className="text-xs text-stone-500 font-medium">
                Total: <strong>{students.length} Mahasiswa</strong> Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3 w-32">NIM</th>
                    <th className="py-3 px-3">Nama Lengkap</th>
                    <th className="py-3 px-3 text-center w-14">L/P</th>
                    <th className="py-3 px-3 text-center w-28">Status PIN</th>
                    <th className="py-3 px-3">PJ Mata Kuliah</th>
                    <th className="py-3 px-3 text-center w-36">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStudents.map((st, idx) => {
                    const pjForCourses = courses.filter((c) => c.pjNims.includes(st.nim));

                    return (
                      <tr key={st.nim} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-stone-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#9d5f2f]">
                          {st.nim}
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {st.name}
                        </td>
                        <td className="py-3 px-3 text-center text-stone-500 font-semibold">
                          {st.gender}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {st.isPinSet ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PIN Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500">
                              Belum Dibuat
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {pjForCourses.length === 0 ? (
                            <span className="text-stone-400 text-[11px]">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {pjForCourses.map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-semibold"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center space-x-1.5">
                            {st.isPinSet && (
                              <button
                                onClick={() => handleResetPin(st)}
                                title="Reset PIN Keamanan (Beri kesempatan mahasiswa buat PIN baru)"
                                className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStudent(st)}
                              title="Hapus dari Whitelist"
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* TAB 3: PENGUMUMAN KELAS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Papan Pengumuman & Informasi Kelas</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Pengumuman yang dibuat di sini akan tampil di halaman depan untuk seluruh mahasiswa.
              </p>
            </div>
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold rounded-xl shadow-md shadow-[#9d5f2f]/20 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900">
                      {ann.category}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">{ann.date}</span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 mb-1.5">{ann.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{ann.content}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Diposting oleh: {ann.author}</span>
                  <button
                    onClick={() => appStore.deleteAnnouncement(ann.id)}
                    className="text-stone-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PENGATURAN & BACKUP */}
      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Admin PIN */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Ganti Password Master Admin</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Password saat ini:{' '}
                <code className="bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-800">
                  {adminPin}
                </code>
              </p>
            </div>

            {pinNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                {pinNotice}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Password Admin Baru</label>
                <input
                  type="text"
                  placeholder="Masukkan password baru..."
                  value={newMasterPin}
                  onChange={(e) => setNewMasterPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-900 font-mono"
                />
              </div>
              <button
                onClick={() => {
                  if (newMasterPin.trim().length < 4) {
                    alert('Password admin minimal 4 karakter.');
                    return;
                  }
                  appStore.setAdminPin(newMasterPin.trim());
                  setPinNotice('Password Admin Master berhasil diperbarui!');
                  setNewMasterPin('');
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-amber-300 font-bold rounded-xl transition-colors"
              >
                Simpan Password Baru
              </button>
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Pencadangan & Pemulihan Data</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Simpan seluruh basis data (mahasiswa, PJ, presensi, materi) sebagai file JSON.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <button
                onClick={() => {
                  const data = appStore.exportJson();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Backup_HK_A_2025_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan Basis Data (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('PERINGATAN: Reset ke data bawaan awal 30 mahasiswa HK A 2025? Perubahan manual akan dikembalikan ke kondisi awal.')) {
                    appStore.resetToDefault();
                    alert('Basis data berhasil direset ke data default.');
                  }
                }}
                className="w-full py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl transition-colors"
              >
                Reset Basis Data ke Kondisi Awal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN PJ FOR A COURSE */}
      {selectedCourseForPj && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded text-amber-200">
                  {selectedCourseForPj.code}
                </span>
                <h3 className="text-base font-bold mt-1">
                  Penugasan PJ: {selectedCourseForPj.name}
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Centang mahasiswa dari daftar di bawah untuk menjadikannya PJ mata kuliah ini.
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseForPj(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-stone-200 bg-stone-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari mahasiswa untuk ditugaskan..."
                  value={pjModalSearch}
                  onChange={(e) => setPjModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] bg-white"
                />
              </div>
            </div>

            {/* Student Checkbox List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-1.5">
              {students
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(pjModalSearch.toLowerCase()) ||
                    s.nim.includes(pjModalSearch)
                )
                .map((st) => {
                  const isChecked = selectedCourseForPj.pjNims.includes(st.nim);

                  return (
                    <label
                      key={st.nim}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50/80 border-[#9d5f2f] text-stone-900'
                          : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePj(selectedCourseForPj.id, st.nim)}
                          className="w-4 h-4 rounded text-[#9d5f2f] focus:ring-[#9d5f2f]"
                        />
                        <div>
                          <p className="font-bold text-xs">{st.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">NIM: {st.nim}</p>
                        </div>
                      </div>
                      {isChecked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#9d5f2f] text-white">
                          Ditugaskan PJ
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedCourseForPj(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNGGAH PDF / CSV ROSTER */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Unggah PDF Daftar Kelas / SK Mahasiswa</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Sistem otomatis mengekstrak NIM dan Nama mahasiswa langsung di browser.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedPreview([]);
                  setUploadError(null);
                }}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="border-2 border-dashed border-stone-300 hover:border-[#9d5f2f] rounded-2xl p-6 text-center transition-colors bg-stone-50">
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="font-semibold text-stone-700">
                  Pilih file PDF atau CSV (Daftar Mahasiswa)
                </p>
                <p className="text-[11px] text-stone-400 mt-1 mb-3">
                  Mendukung berkas SK, pembagian kelompok, atau daftar absensi resmi UIN SSC.
                </p>
                <input
                  type="file"
                  accept=".pdf,.csv,.txt"
                  onChange={handleFileUpload}
                  className="block mx-auto text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#9d5f2f] file:text-white hover:file:bg-[#864d23]"
                />
              </div>

              {isParsing && (
                <div className="text-center py-4 text-xs text-stone-500 font-medium">
                  Sedang membaca berkas dan mengekstrak tabel mahasiswa...
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {parsedPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">
                      Pratinjau Hasil Pembacaan: {parsedPreview.length} Mahasiswa
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      ✓ Berhasil diurai
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100">
                    {parsedPreview.map((st, i) => (
                      <div key={i} className="p-2 flex items-center justify-between text-xs">
                        <span className="font-mono text-[#9d5f2f] font-bold">{st.nim}</span>
                        <span className="font-medium text-stone-800">{st.name}</span>
                        <span className="text-stone-400">{st.gender}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => handleApplyImport(false)}
                      className="w-1/2 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl font-bold shadow-sm"
                    >
                      Gabungkan (Merge)
                    </button>
                    <button
                      onClick={() => handleApplyImport(true)}
                      className="w-1/2 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl font-bold shadow-sm"
                    >
                      Gantikan Semua (Replace)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MAHASISWA MANUAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Tambah Mahasiswa ke Whitelist</h3>
            <p className="text-xs text-stone-500 mb-4">
              Mahasiswa baru ini akan langsung diizinkan login menggunakan NIM-nya.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nomor Induk Mahasiswa (NIM)</label>
                <input
                  type="text"
                  placeholder="Contoh: 2530311090"
                  value={newNim}
                  onChange={(e) => setNewNim(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Zakaria"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Jenis Kelamin</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="w-1/3 py-2 border border-stone-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#9d5f2f] text-white font-bold rounded-xl shadow-sm"
                >
                  Simpan Mahasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT PENGUMUMAN */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Buat Pengumuman Baru</h3>
            <p className="text-xs text-stone-500 mb-4">
              Pemberitahuan untuk seluruh anggota kelas HK A 2025.
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  placeholder="Contoh: Perubahan Jadwal Ujian Tengah Semester"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Kategori</label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  <option value="PENTING">Penting</option>
                  <option value="AKADEMIK">Akademik</option>
                  <option value="TUGAS">Tugas</option>
                  <option value="UMUM">Umum</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Isi Pengumuman</label>
                <textarea
                  rows={3}
                  placeholder="Rincian informasi atau pengumuman..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="w-1/3 py-2 border border-stone-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#9d5f2f] text-white font-bold rounded-xl shadow-sm"
                >
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SETTING MATA KULIAH (NAMA, DOSEN, JAM & RUANG) */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded text-amber-200">
                  {editingCourse.code}
                </span>
                <h3 className="text-base font-bold mt-1">
                  Setting Mata Kuliah: {editingCourse.name}
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Ubah nama mata kuliah, dosen, hari, jam perkuliahan, dan ruang kelas.
                </p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCourse} className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {courseEditNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{courseEditNotice}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Dosen Pengampu</label>
                <input
                  type="text"
                  placeholder="Contoh: Dr. H. Ahmad Dahlan, M.Ag."
                  value={editCourseDosen}
                  onChange={(e) => setEditCourseDosen(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Hari Perkuliahan</label>
                  <select
                    value={editCourseDay}
                    onChange={(e) => setEditCourseDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f] bg-white font-medium"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Bobot SKS</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={editCourseSks}
                    onChange={(e) => setEditCourseSks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Jam Perkuliahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 07.30 - 09.10 WIB"
                  value={editCourseTime}
                  onChange={(e) => setEditCourseTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f] font-mono"
                  required
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Bisa diisi jam kuliah seperti <code>07.30 - 09.10 WIB</code> atau <code>07.30</code>.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Ruang Perkuliahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang 05 Fasya / Gedung G - G 204"
                  value={editCourseRoom}
                  onChange={(e) => setEditCourseRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                  required
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Contoh: <code>Ruang 05 Fasya</code> atau <code>Ruang 204 Gedung FASYA</code>.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tautan Google Drive / RPS (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={editCourseDrive}
                  onChange={(e) => setEditCourseDrive(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#9d5f2f]"
                />
              </div>

              <div className="pt-3 flex items-center space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="w-1/3 py-2.5 border border-stone-300 rounded-xl hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Print Official Sheet Modal (Outside dashboard to allow clean paper print without UI) */}
      {showRevPrintModal && activeRevCourse && activeRevSession && (
        <AttendanceSheetPrint
          course={activeRevCourse}
          session={activeRevSession}
          students={students}
          records={activeRevRecords}
          onClose={() => setShowRevPrintModal(false)}
        />
      )}
    </>
  );
}

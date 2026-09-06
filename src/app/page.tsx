'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  ExternalLink,
  GraduationCap,
  LogIn,
  Search,
  Sparkles,
  Users,
  FileText,
  FolderDown,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Upload,
  Trash2,
  Plus,
  Download,
  FileCheck,
  Lock,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, Announcement, Student, CourseMaterial, AuthSession } from '@/lib/types';

// Lightweight animated counter component (pure JS requestAnimationFrame, 0 dependencies)
function AnimatedCounter({
  value,
  duration = 1400,
  prefix = '',
  suffix = '',
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animFrame: number;
    const target = Number(value) || 0;

    const updateCounter = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * target);
      setCount(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(updateCounter);
      } else {
        setCount(target);
      }
    };

    animFrame = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [activeSemester, setActiveSemester] = useState<number>(3);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showRosterModal, setShowRosterModal] = useState(false);

  // Direct File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!auth) {
      alert('Akses Ditolak: Anda harus login sebagai Mahasiswa, PJ, atau Admin untuk mengunggah berkas.');
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file || !selectedCourse) return;

    setIsUploading(true);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const fileSizeStr = `${sizeInMb} MB`;
    const cleanFileName = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      appStore.addMaterial({
        courseId: selectedCourse.id,
        title: cleanFileName,
        type: 'TUGAS',
        url: result,
        uploadedBy: auth?.name || 'Mahasiswa',
        fileSize: fileSizeStr,
      });
      setIsUploading(false);
      showToast(`Berkas "${cleanFileName}" berhasil diunggah!`);
      e.target.value = '';
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('Gagal membaca berkas. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMaterial = (id: string, title: string) => {
    if (!auth) {
      alert('Akses Ditolak: Anda harus login untuk menghapus berkas.');
      return;
    }
    if (confirm(`Hapus berkas "${title}"? Tindakan ini akan menghapus berkas secara permanen.`)) {
      appStore.deleteMaterial(id);
      showToast(`Berkas "${title}" berhasil dihapus.`);
    }
  };

  useEffect(() => {
    const updateData = () => {
      setCourses(appStore.getCourses());
      setAnnouncements(appStore.getAnnouncements());
      setStudents(appStore.getStudents());
      setMaterials(appStore.getMaterials());
      setAuth(appStore.getAuth());
      setActiveSemester(appStore.getActiveSemester());
    };

    updateData();
    const unsub = appStore.subscribe(updateData);
    return () => unsub();
  }, []);

  // Helper to extract start time in minutes (e.g., "09:10 - 10:50 WIB" -> 9*60 + 10 = 550)
  const parseStartTime = (timeStr?: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 9999;
    const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
    if (!match) return 9999;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  // Today's day in Indonesian
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = dayNames[new Date().getDay()];
  const todayCourses = (courses || [])
    .filter((c) => (c?.day || '').toLowerCase().trim() === todayName.toLowerCase().trim())
    .sort((a, b) => parseStartTime(a?.time) - parseStartTime(b?.time));

  const filteredCourses = (courses || []).filter(
    (c) =>
      (c?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.dosen || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPjNames = (pjNims?: string[]) => {
    if (!pjNims || !Array.isArray(pjNims) || pjNims.length === 0) return 'Belum ditugaskan';
    const pjs = (students || []).filter((s) => s?.nim && pjNims.includes(s.nim.trim()));
    if (pjs.length === 0) return 'Belum ditugaskan';
    return pjs.map((p) => p.name || p.nim).join(', ');
  };

  const isUserPj = Boolean(
    auth?.nim &&
      (courses || []).some(
        (c) => Array.isArray(c?.pjNims) && c.pjNims.some((pNim) => (pNim || '').trim() === (auth.nim || '').trim())
      )
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner - Clean Portfolio Academic Style */}
      <section className="relative overflow-hidden bg-[#241206] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#3b1d0a]">
        {/* Subtle Architectural Gradient Backdrop */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 30%, rgba(157, 95, 47, 0.4), transparent 70%), linear-gradient(135deg, rgba(20, 10, 3, 0.98), rgba(42, 20, 7, 0.92))`
          }}
        />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="flex flex-col items-center">
            {/* Logo Kelas Resmi di Tengah */}
            <div className="flex justify-center mb-4 animate-fade-up">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 p-1.5 ring-4 ring-amber-400/30 shadow-2xl flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-105">
                  <img
                    src="/logo.png"
                    alt="Logo Resmi Hukum Keluarga A 2025"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Core Title (Clean, Bold, Centered) */}
            <h1 className="animate-fade-up delay-100 text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-2">
              Hukum Keluarga A 2025
            </h1>

            {/* University & Faculty Subtitle */}
            <p className="animate-fade-up delay-200 text-xs sm:text-sm font-semibold text-amber-200/90 tracking-wide uppercase mb-6">
              Fakultas Syariah • UIN Siber Syekh Nurjati Cirebon
            </p>

            {/* Action Buttons - Rapi & Presisi di Tengah untuk HP & Desktop */}
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full sm:w-auto">
              {auth ? (
                auth.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-stone-100 text-[#241206] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#8c4e24]" />
                    <span>Buka Dashboard Admin</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/mahasiswa"
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-200" />
                      <span>Presensi Saya ({(auth.name || 'Mahasiswa').split(' ')[0]})</span>
                    </Link>
                    {isUserPj && (
                      <Link
                        href="/pj"
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Portal PJ Mata Kuliah</span>
                      </Link>
                    )}
                  </>
                )
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98"
                  >
                    <LogIn className="w-4 h-4 text-amber-200" />
                    <span>Masuk Portal Presensi</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowRosterModal(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 transition-all flex items-center justify-center space-x-2 active:scale-98"
                  >
                    <Users className="w-4 h-4 text-amber-200" />
                    <span>Daftar {students.length} Mahasiswa</span>
                  </button>
                  <a
                    href="#jadwal"
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 transition-all flex items-center justify-center space-x-2 active:scale-98"
                  >
                    <CalendarDays className="w-4 h-4 text-amber-200" />
                    <span>Jadwal Kuliah</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        {/* STATISTIK BERJALAN DARI NOL (Count-Up Animation) */}
        <section className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-xs">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 divide-x divide-stone-100">
            {/* Stat 1: Mahasiswa */}
            <div className="flex flex-col items-center justify-center text-center px-2 py-1">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 text-[#8c4e24] flex items-center justify-center mb-1.5 shadow-2xs">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
                <AnimatedCounter value={students.length || 30} duration={1400} />
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-stone-500 mt-0.5 sm:mt-1 uppercase tracking-wider">
                Mahasiswa
              </div>
            </div>

            {/* Stat 2: Semester Berjalan */}
            <div className="flex flex-col items-center justify-center text-center px-2 py-1">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-100/70 text-[#8c4e24] flex items-center justify-center mb-1.5 shadow-2xs">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-[#8c4e24] tracking-tight font-sans flex items-center justify-center">
                <span className="text-xs sm:text-lg font-bold text-stone-400 mr-1">Sem</span>
                <AnimatedCounter value={activeSemester} duration={1000} />
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-stone-600 mt-0.5 sm:mt-1 uppercase tracking-wider">
                Semester Aktif
              </div>
            </div>

            {/* Stat 3: Mata Kuliah */}
            <div className="flex flex-col items-center justify-center text-center px-2 py-1">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 text-[#8c4e24] flex items-center justify-center mb-1.5 shadow-2xs">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
                <AnimatedCounter value={courses.length || 11} duration={1200} />
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-stone-500 mt-0.5 sm:mt-1 uppercase tracking-wider">
                Mata Kuliah
              </div>
            </div>
          </div>
        </section>

        {/* Jadwal Kuliah Hari Ini (Container Coklat Hukum Keluarga) */}
        <section id="jadwal" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  Jadwal Kuliah Hari Ini ({todayName})
                </h2>
                <p className="text-xs text-stone-500">
                  Rangkaian perkuliahan aktif kelas HK A 2025 untuk hari ini.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3.5 py-1.5 bg-[#8c4e24] text-white rounded-full w-fit shadow-xs">
              Jadwal {todayName}
            </span>
          </div>

          {todayCourses.length === 0 ? (
            <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-200/80 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#8c4e24] mx-auto flex items-center justify-center mb-2.5">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#783e18]">Tidak Ada Jadwal Kuliah Hari Ini</h3>
              <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                Hari ini ({todayName}) tidak ada perkuliahan tatap muka. Anda dapat mengakses materi dan tugas 11 mata kuliah di bawah.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayCourses.map((c) => (
                <div
                  key={c.id}
                  className="bg-gradient-to-br from-[#8c4e24] via-[#783e18] to-[#5a2a0c] text-white rounded-2xl p-5 border border-amber-500/30 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="font-mono font-bold text-amber-200 bg-black/30 px-2 py-0.5 rounded border border-amber-300/30 text-[11px]">
                        {c.code}
                      </span>
                      <span className="font-bold text-amber-100 bg-white/15 px-2 py-0.5 rounded text-[11px]">
                        {c.sks} SKS
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-white mb-1 leading-snug group-hover:text-amber-200 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-amber-100/90 mb-3 font-medium">
                      {c.dosen}
                    </p>

                    <div className="pt-2.5 border-t border-white/20 text-xs text-amber-100/90 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-200/80">Waktu & Ruang:</span>
                        <span className="font-semibold text-white">{c.time} • Ruang {c.room}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-200/80">PJ Kelas:</span>
                        <span className="font-semibold text-amber-200 truncate max-w-[170px]">{getPjNames(c.pjNims)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(c)}
                      className="w-full py-2 px-4 rounded-xl bg-white hover:bg-amber-50 text-[#783e18] font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-98"
                    >
                      <span>Lihat Repositori & Tugas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 11 MATA KULIAH - 3-CIRCLE GRID (Bulat Grid 3 Sesuai Sketsa User) */}
        <section id="matakuliah" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#8c4e24] flex items-center justify-center border border-amber-200/60 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  {courses.length} Mata Kuliah & Repositori
                </h2>
                <p className="text-xs text-stone-500">
                  Klik lingkaran mata kuliah untuk melihat materi & mengunggah tugas.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari mata kuliah atau dosen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24] bg-white shadow-xs"
              />
            </div>
          </div>

          {/* 3-Column Circular Bubble Grid (Mobile: 3 Bulat per baris, Tablet: 4, Desktop: 6) */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/80 shadow-xs">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">
                Mata kuliah tidak ditemukan dengan kata kunci &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-y-7 gap-x-2 sm:gap-6 py-2">
                {filteredCourses.map((c) => {
                  const courseMats = materials.filter((m) => m.courseId === c.id);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCourse(c)}
                      className="group flex flex-col items-center text-center focus:outline-none transition-all hover:-translate-y-1 active:scale-95"
                    >
                      {/* Circular Bubble matching user's sketch */}
                      <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#8c4e24] via-[#753e1f] to-[#5a2a0c] text-white p-1 shadow-md shadow-[#8c4e24]/20 group-hover:shadow-lg group-hover:shadow-[#8c4e24]/35 transition-all flex flex-col items-center justify-center border-2 border-amber-400/50 group-hover:border-amber-300">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200 group-hover:scale-110 transition-transform mb-0.5" />
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-100/90 tracking-tighter">
                          {c.sks} SKS
                        </span>

                        {/* Notification badge if files exist */}
                        {courseMats.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-amber-400 text-[#241206] font-extrabold text-[9px] sm:text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-white">
                            {courseMats.length}
                          </span>
                        )}
                      </div>

                      {/* Course Name centered underneath */}
                      <h3 className="mt-2 font-bold text-[11px] sm:text-xs text-stone-800 group-hover:text-[#8c4e24] transition-colors line-clamp-2 leading-tight px-1 max-w-[105px] sm:max-w-[125px]">
                        {c.name}
                      </h3>
                      <span className="text-[10px] text-stone-400 mt-0.5 font-medium line-clamp-1 max-w-[95px]">
                        {c.day ? `${c.day}` : c.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Papan Informasi & Pengumuman Kelas (Clean Cards + Pop-up Modal) */}
        <section id="pengumuman" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8c4e24] flex items-center justify-center border border-amber-200/60 shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  Papan Informasi & Pengumuman
                </h2>
              </div>
            </div>
            <span className="text-xs text-stone-400">
              {announcements.length} Pengumuman
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => setSelectedAnnouncement(ann)}
                className="cursor-pointer bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 hover:border-[#8c4e24] hover:shadow-md transition-all flex flex-col justify-between group active:scale-98"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        ann.category === 'PENTING'
                          ? 'bg-rose-100 text-rose-800'
                          : ann.category === 'TUGAS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {ann.category}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">{ann.date}</span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#8c4e24] transition-colors line-clamp-2 mb-1 leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="truncate max-w-[140px]">Oleh: {ann.author}</span>
                  <span className="text-[#8c4e24] font-semibold flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Baca Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal: Course Repository / Materi Detail */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8c4e24] to-[#5a2a0c] p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded text-amber-200">
                  {selectedCourse.code} • {selectedCourse.sks} SKS
                </span>
                <h3 className="text-lg font-bold mt-1.5">{selectedCourse.name}</h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Dosen: {selectedCourse.dosen} | PJ: {getPjNames(selectedCourse.pjNims)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              <div>
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
                  Deskripsi & Silabus
                </h4>
                <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedCourse.description}
                </p>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                      Berkas Materi & Tugas Kuliah
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {auth
                        ? 'Pilih berkas untuk diunggah atau klik tombol untuk mengunduh materi.'
                        : 'Berkas materi dan tugas hanya dapat diunggah dan diunduh oleh mahasiswa yang telah login.'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {auth ? (
                      <label
                        className={`cursor-pointer px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center space-x-2 shadow-md transition-all active:scale-95 ${
                          isUploading
                            ? 'bg-stone-400 cursor-not-allowed'
                            : 'bg-[#8c4e24] hover:bg-[#723f1c] shadow-[#8c4e24]/20'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'Mengunggah Berkas...' : 'Upload File / Tugas'}</span>
                        <input
                          type="file"
                          onChange={handleDirectFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <Link
                        href="/login"
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8c4e24] font-bold text-xs flex items-center space-x-1.5 transition-all border border-amber-200/80 shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#8c4e24]" />
                        <span>Login untuk Upload</span>
                      </Link>
                    )}

                    {selectedCourse.driveLink && auth && (
                      <a
                        href={selectedCourse.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center space-x-1 transition-colors"
                      >
                        <span>Google Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* DAFTAR MATERI & TUGAS YANG BISA DIUNDUH */}
                {materials.filter((m) => m.courseId === selectedCourse.id).length === 0 ? (
                  <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400 space-y-1.5">
                    <FileText className="w-8 h-8 mx-auto text-stone-300" />
                    <p className="font-semibold text-stone-600">
                      Belum ada berkas atau tugas yang diunggah untuk mata kuliah ini.
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {auth
                        ? 'Klik tombol "Upload File / Tugas" di atas untuk langsung memilih dan mengunggah berkas!'
                        : 'Silakan login terlebih dahulu untuk mengunggah materi perkuliahan.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {materials
                      .filter((m) => m.courseId === selectedCourse.id)
                      .map((mat) => {
                        return (
                          <div
                            key={mat.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all bg-white gap-3 shadow-xs"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-amber-100 text-[#8c4e24]">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 text-xs sm:text-sm">
                                  {mat.title}
                                </p>
                                <p className="text-[10px] text-stone-400 mt-1 flex flex-wrap items-center gap-1.5">
                                  <span>Diunggah pada {mat.uploadedAt}</span>
                                  {mat.fileSize && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-stone-600 font-semibold">{mat.fileSize}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Actions: Unduh & Hapus (Protected for Auth/Class only) */}
                            <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                              {auth ? (
                                <a
                                  href={mat.url}
                                  download={mat.title}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-[#8c4e24] hover:text-white font-bold text-stone-800 transition-all flex items-center space-x-1.5 text-xs shadow-xs"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#8c4e24] group-hover:text-white" />
                                  <span>Unduh / Buka</span>
                                </a>
                              ) : (
                                <Link
                                  href="/login"
                                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8c4e24] border border-amber-200/80 font-bold text-xs transition-all flex items-center space-x-1.5 shadow-2xs"
                                >
                                  <Lock className="w-3.5 h-3.5 text-[#8c4e24]" />
                                  <span>Login untuk Unduh</span>
                                </Link>
                              )}

                              {/* Tombol Hapus Berkas: Khusus yang sudah Login */}
                              {auth && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                                  title="Hapus berkas ini"
                                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detail Pengumuman Pop-up */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#8c4e24] to-[#5a2a0c] p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-amber-200 uppercase tracking-wide">
                  {selectedAnnouncement.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold mt-2 text-white leading-snug">
                  {selectedAnnouncement.title}
                </h3>
                <p className="text-xs text-amber-200/80 mt-1">
                  {selectedAnnouncement.date} • Diposting oleh: {selectedAnnouncement.author}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 text-base font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {selectedAnnouncement.content}
            </div>
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 30 Roster Mahasiswa Whitelist */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#8c4e24] to-[#5a2a0c] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Daftar Mahasiswa Resmi HK A 2025</h3>
                <p className="text-xs text-amber-100/90">
                  Total: {students.length} Mahasiswa Terdaftar di Sistem Whitelist
                </p>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">NIM</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3 text-center">L/P</th>
                    <th className="py-2.5 px-3 text-center">Status PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {[...students]
                    .sort((a, b) => a.nim.trim().localeCompare(b.nim.trim(), undefined, { numeric: true }))
                    .map((st, idx) => {
                      const cleanNim = (st.nim || '').trim();
                      const maskedNim = cleanNim.length > 4 ? cleanNim.slice(0, -4) + 'xxxx' : 'xxxx';
                      return (
                        <tr key={st.nim} className="hover:bg-amber-50/50">
                          <td className="py-2 px-3 text-center text-stone-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-[#9d5f2f]">{maskedNim}</td>
                          <td className="py-2 px-3 font-medium text-stone-800">{st.name}</td>
                          <td className="py-2 px-3 text-center text-stone-500">{st.gender}</td>
                          <td className="py-2 px-3 text-center">
                            {st.isPinSet ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500">
                                Belum Set PIN
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <p className="text-[11px] text-stone-500">
                Demi privasi identitas, 4 digit terakhir NIM disensor. Hanya mahasiswa pada daftar ini yang dapat login.
              </p>
              <button
                onClick={() => setShowRosterModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

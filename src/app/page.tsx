'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
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
  MapPin,
  ChevronRight,
  CalendarCheck,
  UserCheck,
  Lock,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, Announcement, Student, CourseMaterial, AuthSession } from '@/lib/types';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [auth, setAuth] = useState<AuthSession | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showAllScheduleModal, setShowAllScheduleModal] = useState(false);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('Senin');

  useEffect(() => {
    const updateData = () => {
      setCourses(appStore.getCourses());
      setAnnouncements(appStore.getAnnouncements());
      setStudents(appStore.getStudents());
      setMaterials(appStore.getMaterials());
      setAuth(appStore.getAuth());
    };

    updateData();
    const unsub = appStore.subscribe(updateData);
    return () => unsub();
  }, []);

  // Today's day in Indonesian
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = dayNames[new Date().getDay()];

  // Filter courses for today (automatically updates every day!)
  const todayCourses = courses.filter(
    (c) => c.day.toLowerCase() === todayName.toLowerCase()
  );

  // Set default schedule modal day to today if it's Senin-Sabtu
  useEffect(() => {
    if (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].includes(todayName)) {
      setSelectedScheduleDay(todayName);
    }
  }, [todayName]);

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dosen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPjNames = (pjNims: string[]) => {
    const pjs = students.filter((s) => pjNims.includes(s.nim));
    if (pjs.length === 0) return 'Belum ditugaskan';
    return pjs.map((p) => p.name).join(', ');
  };

  // Student name to show in profile card
  const profileName = auth ? auth.name.toUpperCase() : 'SUFYAN TSAURY';
  const profileNim = auth?.nim ? auth.nim : '2530311086';

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf8f5]">
      {/* 1. HERO HEADER RESMI KELAS HK A (TEMA COKLAT #9d5f2f ASLI) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#9d5f2f] via-[#8c4e24] to-[#6b3917] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span>Portal Resmi Mahasiswa HK A 2025</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Hukum Keluarga A 2025
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 font-medium max-w-2xl mx-auto mb-6 leading-relaxed">
            Fakultas Syariah — <span className="font-semibold text-white">UIN Siber Syekh Nurjati Cirebon</span>
            <br />
            Sistem Presensi Digital Mahasiswa & Repositori 11 Mata Kuliah
          </p>
        </div>
      </section>

      {/* 2. AREA KONTEN UTAMA (MAX-W-4XL UNTUK HP & DESKTOP) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full -mt-8 pb-20 space-y-6">
        {/* KARTU PROFIL MAHASISWA MELAYANG */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base sm:text-lg text-stone-900 tracking-tight">
                {profileName}
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-mono tracking-wide">
              NIM: {profileNim}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-[#9d5f2f] text-white shadow-sm">
              Aktif
            </span>
            {!auth ? (
              <Link
                href="/login"
                className="text-xs font-semibold text-[#9d5f2f] hover:underline bg-amber-50 px-2.5 py-1 rounded-xl"
              >
                Masuk Akun
              </Link>
            ) : (
              <span className="text-[11px] font-mono text-stone-400">
                {auth.role === 'ADMIN' ? 'Superadmin' : 'Terverifikasi'}
              </span>
            )}
          </div>
        </div>

        {/* 3. MENU AKSES CEPAT DENGAN IKON BULAT RAMAH HP (HANYA FITUR AWAL) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-stone-900">Akses Cepat</h3>
            <span className="text-xs text-stone-400">Menu Utama</span>
          </div>

          {/* 6 Ikon Bulat yang nyaman disentuh di HP */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-4 gap-x-2 text-center">
            {/* 1. Presensi Saya */}
            <Link href="/mahasiswa" className="flex flex-col items-center group">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-amber-100/80 text-[#9d5f2f] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform border border-amber-200/60">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Presensi Saya
              </span>
            </Link>

            {/* 2. 11 Mata Kuliah */}
            <button
              onClick={() => {
                const el = document.getElementById('daftar-matkul');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform border border-stone-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                11 Mata Kuliah
              </span>
            </button>

            {/* 3. Portal PJ Mata Kuliah */}
            <Link href="/pj" className="flex flex-col items-center group">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#9d5f2f] to-[#753e1f] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Portal PJ
              </span>
            </Link>

            {/* 4. Daftar 30 Mahasiswa */}
            <button
              onClick={() => setShowRosterModal(true)}
              className="flex flex-col items-center group"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform border border-amber-200">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                30 Mahasiswa
              </span>
            </button>

            {/* 5. Pengumuman Kelas */}
            <button
              onClick={() => {
                const el = document.getElementById('pengumuman-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform border border-blue-200">
                <Bell className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Pengumuman
              </span>
            </button>

            {/* 6. Portal Admin */}
            <Link href="/admin" className="flex flex-col items-center group">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Portal Admin
              </span>
            </Link>
          </div>
        </div>

        {/* 4. KARTU JADWAL KULIAH (OTOMATIS UPDATE HARIAN SESUAI ADMIN) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#9d5f2f]" />
              <h3 className="font-bold text-base text-stone-900">Jadwal Kuliah</h3>
              <span className="text-xs font-bold text-[#9d5f2f] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Hari Ini: {todayName}
              </span>
            </div>
            <button
              onClick={() => setShowAllScheduleModal(true)}
              className="text-xs font-semibold text-[#9d5f2f] hover:text-[#753e1f] flex items-center space-x-0.5 group"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* List Perkuliahan Hari Ini */}
          {todayCourses.length === 0 ? (
            <div className="bg-amber-50/50 rounded-2xl p-6 text-center border border-amber-200/60 space-y-1.5">
              <Calendar className="w-8 h-8 mx-auto text-[#9d5f2f]/60 mb-1" />
              <p className="text-sm font-bold text-stone-800">
                Tidak Ada Jadwal Kuliah Hari Ini ({todayName})
              </p>
              <p className="text-xs text-stone-500">
                Hari ini libur perkuliahan tatap muka. Anda dapat melihat jadwal kuliah hari lainnya:
              </p>
              <button
                onClick={() => setShowAllScheduleModal(true)}
                className="mt-2 px-4 py-2 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Buka Jadwal Kuliah Mingguan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayCourses.map((crs) => (
                <div
                  key={crs.id}
                  onClick={() => setSelectedCourse(crs)}
                  className="bg-[#fcfaf7] hover:bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 flex items-start space-x-3.5 transition-all cursor-pointer group shadow-2xs"
                >
                  {/* Rounded square icon badge */}
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#9d5f2f] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform border border-amber-200">
                    <GraduationCap className="w-6 h-6" />
                  </div>

                  {/* Course Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#9d5f2f] transition-colors line-clamp-1">
                        {crs.name}
                      </h4>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-600 flex-shrink-0">
                        {crs.sks} SKS
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">
                      Dosen: {crs.dosen}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-700 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#9d5f2f] flex-shrink-0" />
                        <span className="font-mono">{crs.time}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#9d5f2f] flex-shrink-0" />
                        <span className="line-clamp-1">{crs.room}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. REPOSITORI 11 MATA KULIAH LENGKAP */}
        <div id="daftar-matkul" className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-stone-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#9d5f2f]" />
                <span>11 Mata Kuliah & Penyimpanan Materi</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Akses RPS, modul pembelajaran, materi dosen, dan berkas tugas.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 w-fit">
              Semester Ganjil (3)
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari mata kuliah, ruang, atau dosen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] bg-stone-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {filteredCourses.map((crs) => (
              <div
                key={crs.id}
                onClick={() => setSelectedCourse(crs)}
                className="p-4 rounded-2xl border border-stone-200 hover:border-[#9d5f2f] hover:bg-amber-50/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-[#9d5f2f] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      {crs.code}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-500">
                      {crs.day}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-stone-900 group-hover:text-[#9d5f2f] transition-colors line-clamp-1 mb-0.5">
                    {crs.name}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-1 mb-2">
                    {crs.dosen}
                  </p>

                  <div className="space-y-1 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-[#9d5f2f]" />
                      <span>{crs.time}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-[#9d5f2f]" />
                      <span className="line-clamp-1">{crs.room}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#9d5f2f] font-semibold">
                  <span>Lihat Modul & Drive</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. PAPAN PENGUMUMAN KELAS */}
        <div id="pengumuman-section" className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/80 space-y-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-[#9d5f2f]" />
            <h3 className="font-bold text-base text-stone-900">Papan Informasi & Pengumuman Kelas</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200 text-xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      {ann.category}
                    </span>
                    <span className="text-stone-400 font-mono">{ann.date}</span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm">{ann.title}</h4>
                  <p className="text-stone-600 text-xs leading-relaxed pt-1">{ann.content}</p>
                </div>
                <div className="pt-2 border-t border-stone-200/70 text-[10px] text-stone-400">
                  Diposting oleh: {ann.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: LIHAT SEMUA JADWAL KULIAH MINGGUAN (SENIN - SABTU) */}
      {showAllScheduleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Jadwal Kuliah Lengkap Mingguan</h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Kelas HK A 2025 • Fakultas Syariah UIN SSC
                </p>
              </div>
              <button
                onClick={() => setShowAllScheduleModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto scrollbar-none px-2 pt-2">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => {
                const count = courses.filter((c) => c.day.toLowerCase() === day.toLowerCase()).length;
                const isSelected = selectedScheduleDay.toLowerCase() === day.toLowerCase();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedScheduleDay(day)}
                    className={`flex-shrink-0 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-1.5 ${
                      isSelected
                        ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <span>{day}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-stone-200 text-stone-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Day Schedule Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
              {courses.filter((c) => c.day.toLowerCase() === selectedScheduleDay.toLowerCase()).length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <Calendar className="w-8 h-8 mx-auto mb-1.5 text-stone-300" />
                  <p className="font-semibold text-stone-600">Tidak ada jadwal kuliah pada hari {selectedScheduleDay}</p>
                </div>
              ) : (
                courses
                  .filter((c) => c.day.toLowerCase() === selectedScheduleDay.toLowerCase())
                  .map((crs) => (
                    <div
                      key={crs.id}
                      className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4 flex items-start space-x-3.5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#9d5f2f] flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-200">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-stone-900">{crs.name}</h4>
                          <span className="font-mono text-[11px] font-bold text-[#9d5f2f] bg-white px-2 py-0.5 rounded border border-amber-200">
                            {crs.sks} SKS
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">{crs.dosen}</p>
                        <div className="mt-2 space-y-1 text-xs text-stone-700 font-medium">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#9d5f2f]" />
                            <span>{crs.time}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#9d5f2f]" />
                            <span>{crs.room}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowAllScheduleModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL MATA KULIAH & REPOSITORI MATERI */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded text-amber-200">
                  {selectedCourse.code} • {selectedCourse.sks} SKS
                </span>
                <h3 className="text-base font-bold mt-1">{selectedCourse.name}</h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Dosen: {selectedCourse.dosen}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="bg-amber-50/70 p-3.5 rounded-2xl space-y-1.5 text-stone-800 border border-amber-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#9d5f2f]" />
                  <span>Jadwal: <strong>{selectedCourse.day}, {selectedCourse.time}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#9d5f2f]" />
                  <span>Ruang: <strong>{selectedCourse.room}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#9d5f2f]" />
                  <span>PJ: <strong>{getPjNames(selectedCourse.pjNims)}</strong></span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
                  Deskripsi Mata Kuliah
                </h4>
                <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedCourse.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Berkas Materi & Tugas
                  </h4>
                  {selectedCourse.driveLink && (
                    <a
                      href={selectedCourse.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#9d5f2f] font-semibold hover:underline flex items-center space-x-1 text-[11px]"
                    >
                      <span>Buka Google Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {materials.filter((m) => m.courseId === selectedCourse.id).length === 0 ? (
                  <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400">
                    <FileText className="w-6 h-6 mx-auto mb-1 text-stone-300" />
                    <p>Belum ada modul atau makalah yang diunggah.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials
                      .filter((m) => m.courseId === selectedCourse.id)
                      .map((mat) => (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white"
                        >
                          <div>
                            <p className="font-bold text-stone-900">{mat.title}</p>
                            <p className="text-[10px] text-stone-400">
                              {mat.type} • Diunggah: {mat.uploadedAt}
                            </p>
                          </div>
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-stone-100 hover:bg-[#9d5f2f] hover:text-white font-semibold text-stone-700 rounded-lg transition-colors text-xs"
                          >
                            Unduh
                          </a>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAFTAR 30 MAHASISWA */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Daftar Mahasiswa HK A 2025</h3>
                <p className="text-xs text-amber-100/90">Total: {students.length} Mahasiswa Terdaftar</p>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-stone-100 text-xs">
              {students.map((st, i) => (
                <div key={st.nim} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-stone-400 font-mono w-6 text-center">{i + 1}</span>
                    <div>
                      <p className="font-bold text-stone-900">{st.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">NIM: {st.nim}</p>
                    </div>
                  </div>
                  <span className="text-stone-500 font-medium">{st.gender}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowRosterModal(false)}
                className="px-5 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

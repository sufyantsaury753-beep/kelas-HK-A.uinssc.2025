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
  Award,
  Wallet,
  Mail,
  LayoutGrid,
  QrCode,
  CalendarCheck,
  UserCheck,
  ChevronDown,
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

  // Filter today's courses
  const todayCourses = courses.filter(
    (c) => c.day.toLowerCase() === todayName.toLowerCase()
  );

  // Set default schedule day to today if it's Senin-Sabtu
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

  // Active student display (if logged in, use auth; otherwise default to demo profile or prompt)
  const currentStudentName = auth ? auth.name.toUpperCase() : 'SUFYAN TSAURY';
  const currentStudentNim = auth?.nim ? auth.nim : '2530311086';

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6]">
      {/* 1. TOP CURVED CAMPUS HEADER (Identik dengan Screenshot) */}
      <header className="relative bg-gradient-to-b from-[#0b5435] to-[#08422a] text-white pt-7 pb-16 px-5 sm:px-8 rounded-b-[2.5rem] shadow-md">
        <div className="max-w-xl mx-auto flex items-center space-x-3.5">
          {/* Logo UINSSC */}
          <div className="w-12 h-12 rounded-full bg-white p-1 flex items-center justify-center shadow-md flex-shrink-0 border border-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="UINSSC Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if logo not loaded
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <GraduationCap className="w-7 h-7 text-[#0b5435]" style={{ display: 'none' }} />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-semibold text-white/95 leading-tight tracking-tight">
              Universitas Islam Negeri Siber
            </h1>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
              Syekh Nurjati Cirebon
            </h2>
          </div>
        </div>
      </header>

      {/* CONTAINER UTAMA TAMPILAN HP / DESKTOP */}
      <main className="max-w-xl mx-auto px-4 w-full -mt-10 pb-24 space-y-4">
        {/* 2. KARTU PROFIL MAHASISWA (Identik dengan Screenshot) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base sm:text-lg text-stone-900 tracking-tight">
              {currentStudentName}
            </h3>
            <p className="text-xs text-stone-500 font-mono tracking-wide">
              NIM: {currentStudentNim}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#e8810c] to-[#d97706] text-white shadow-sm flex items-center space-x-1">
              <span>Aktif</span>
            </span>
            {!auth && (
              <Link
                href="/login"
                className="text-[11px] font-semibold text-[#0b5435] hover:underline"
              >
                Ganti Akun
              </Link>
            )}
          </div>
        </div>

        {/* 3. KARTU JADWAL KULIAH OTOMATIS HARIAN (Identik dengan Screenshot) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-3.5">
          {/* Header Card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-stone-900">Jadwal Kuliah</h3>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {todayName}
              </span>
            </div>
            <button
              onClick={() => setShowAllScheduleModal(true)}
              className="text-xs font-semibold text-[#0b5435] hover:text-emerald-800 flex items-center space-x-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* List Kartu Kuliah Hari Ini */}
          {todayCourses.length === 0 ? (
            <div className="bg-[#f2f8f4] rounded-2xl p-5 text-center border border-emerald-100/80">
              <Calendar className="w-8 h-8 mx-auto text-emerald-700/60 mb-1.5" />
              <p className="text-xs font-bold text-stone-800">
                Tidak Ada Jadwal Kuliah Hari Ini ({todayName})
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5 mb-2.5">
                Gunakan waktu untuk belajar mandiri atau diskusi tugas kelompok.
              </p>
              <button
                onClick={() => setShowAllScheduleModal(true)}
                className="px-3.5 py-1.5 bg-[#0b5435] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Lihat Jadwal Hari Lainnya
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayCourses.map((crs) => (
                <div
                  key={crs.id}
                  onClick={() => setSelectedCourse(crs)}
                  className="bg-[#ebf4ee] hover:bg-[#e2efe5] border border-emerald-100/80 rounded-2xl p-3.5 flex items-start space-x-3.5 transition-all cursor-pointer group"
                >
                  {/* Rounded square icon badge */}
                  <div className="w-12 h-12 rounded-2xl bg-[#cfe7d4] text-[#0b5435] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>

                  {/* Course Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 group-hover:text-[#0b5435] transition-colors line-clamp-1">
                      {crs.name}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-xs text-stone-600 mt-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="font-mono font-medium">{crs.time}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-stone-600 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="font-medium line-clamp-1">{crs.room}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. KARTU AKSES CEPAT DENGAN IKON BULAT (Identik dengan Screenshot) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-4">
          <h3 className="font-bold text-base text-stone-900">Akses Cepat</h3>

          <div className="grid grid-cols-3 gap-y-6 gap-x-2 text-center">
            {/* 1. Rencana Studi */}
            <button
              onClick={() => {
                const el = document.getElementById('daftar-matkul');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setShowAllScheduleModal(true);
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-14 h-14 rounded-full bg-[#daf0eb] text-[#147a6d] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Rencana Studi
              </span>
            </button>

            {/* 2. Kehadiran */}
            <Link href="/mahasiswa" className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-full bg-[#fdeee4] text-[#d9662b] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Kehadiran
              </span>
            </Link>

            {/* 3. Riwayat Nilai / Tugas */}
            <button
              onClick={() => {
                const el = document.getElementById('pengumuman-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-14 h-14 rounded-full bg-[#e3effd] text-[#2563eb] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Riwayat Nilai
              </span>
            </button>

            {/* 4. Pembayaran / Kas */}
            <button
              onClick={() => setShowRosterModal(true)}
              className="flex flex-col items-center group"
            >
              <div className="w-14 h-14 rounded-full bg-[#fdf4e2] text-[#d97706] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Daftar Mahasiswa
              </span>
            </button>

            {/* 5. Email Kampus / Pengumuman */}
            <button
              onClick={() => {
                const el = document.getElementById('pengumuman-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-14 h-14 rounded-full bg-[#eaf4eb] text-[#15803d] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Pengumuman
              </span>
            </button>

            {/* 6. Lainnya / Mode PJ */}
            <Link href="/pj" className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-full bg-[#fceee6] text-[#9d5f2f] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-stone-800 mt-2">
                Portal PJ
              </span>
            </Link>
          </div>
        </div>

        {/* 5. BAGIAN REPOSITORI 11 MATA KULIAH */}
        <div id="daftar-matkul" className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-stone-900">11 Mata Kuliah & Materi</h3>
              <p className="text-xs text-stone-500">
                Pilih mata kuliah untuk melihat modul, RPS, dan Google Drive.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {courses.length} MK
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
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0b5435]"
            />
          </div>

          <div className="space-y-2">
            {filteredCourses.map((crs) => (
              <div
                key={crs.id}
                onClick={() => setSelectedCourse(crs)}
                className="p-3.5 rounded-2xl border border-stone-200 hover:border-[#0b5435] hover:bg-stone-50/60 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#9d5f2f] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 border border-amber-200">
                    {crs.code.split('-')[1] || crs.code}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                      {crs.name}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {crs.day}, {crs.time} • <span className="font-medium text-stone-700">{crs.room}</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* 6. PAPAN PENGUMUMAN */}
        <div id="pengumuman-section" className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-3.5">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#0b5435]" />
            <h3 className="font-bold text-base text-stone-900">Pengumuman Kelas HK A</h3>
          </div>

          <div className="space-y-2.5">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    {ann.category}
                  </span>
                  <span className="text-stone-400 font-mono">{ann.date}</span>
                </div>
                <h4 className="font-bold text-stone-900 text-xs">{ann.title}</h4>
                <p className="text-stone-600 text-[11px] leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 7. FLOATING BOTTOM QUICK CHECK-IN BAR */}
      <div className="fixed bottom-3 inset-x-0 z-40 max-w-sm mx-auto px-4 no-print pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-stone-300 shadow-xl px-4 py-2 flex items-center justify-between pointer-events-auto">
          <Link href="/" className="flex flex-col items-center text-[#0b5435]">
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Beranda</span>
          </Link>

          {/* Floating Center Button */}
          <Link
            href="/mahasiswa"
            className="-mt-7 w-13 h-13 rounded-full bg-gradient-to-tr from-[#0b5435] to-[#15803d] text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 hover:scale-105 transition-transform border-4 border-white"
            title="Presensi Mandiri Cepat"
          >
            <QrCode className="w-6 h-6" />
          </Link>

          <Link href="/pj" className="flex flex-col items-center text-stone-600 hover:text-[#0b5435]">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Portal PJ</span>
          </Link>
        </div>
      </div>

      {/* MODAL: LIHAT SEMUA JADWAL KULIAH (TAB SENIN - SABTU) */}
      {showAllScheduleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0b5435] to-[#08422a] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Jadwal Kuliah Lengkap Mingguan</h3>
                <p className="text-xs text-emerald-100/90 mt-0.5">
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
                        ? 'border-[#0b5435] text-[#0b5435] bg-white'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <span>{day}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
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
                      className="bg-[#ebf4ee] border border-emerald-100 rounded-2xl p-4 flex items-start space-x-3.5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#cfe7d4] text-[#0b5435] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-stone-900">{crs.name}</h4>
                          <span className="font-mono text-[11px] font-bold text-[#0b5435] bg-white px-2 py-0.5 rounded">
                            {crs.sks} SKS
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">{crs.dosen}</p>
                        <div className="mt-2 space-y-1 text-xs text-stone-700 font-medium">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            <span>{crs.time}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-500" />
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
            <div className="bg-gradient-to-r from-[#0b5435] to-[#08422a] p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded text-emerald-200">
                  {selectedCourse.code} • {selectedCourse.sks} SKS
                </span>
                <h3 className="text-base font-bold mt-1">{selectedCourse.name}</h3>
                <p className="text-xs text-emerald-100/90 mt-0.5">
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
              <div className="bg-[#ebf4ee] p-3.5 rounded-2xl space-y-1.5 text-stone-800">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#0b5435]" />
                  <span>Jadwal: <strong>{selectedCourse.day}, {selectedCourse.time}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#0b5435]" />
                  <span>Ruang: <strong>{selectedCourse.room}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#0b5435]" />
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
                      className="text-[#0b5435] font-semibold hover:underline flex items-center space-x-1 text-[11px]"
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
                            className="px-3 py-1 bg-stone-100 hover:bg-[#0b5435] hover:text-white font-semibold text-stone-700 rounded-lg transition-colors text-xs"
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
            <div className="bg-gradient-to-r from-[#0b5435] to-[#08422a] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Daftar Mahasiswa HK A 2025</h3>
                <p className="text-xs text-emerald-100/90">Total: {students.length} Mahasiswa Terdaftar</p>
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

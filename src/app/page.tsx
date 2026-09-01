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
  Share2,
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
  const todayCourses = courses.filter(
    (c) => c.day.toLowerCase() === todayName.toLowerCase()
  );

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dosen.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPjNames = (pjNims: string[]) => {
    const pjs = students.filter((s) => pjNims.includes(s.nim));
    if (pjs.length === 0) return 'Belum ditugaskan';
    return pjs.map((p) => p.name).join(', ');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#9d5f2f] via-[#8c4e24] to-[#6b3917] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 shadow-inner">
        {/* Background decorative circles & pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-600/30 blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span>Portal Resmi Kelas HK A 2025</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            Hukum Keluarga A 2025
          </h1>
          <p className="text-base sm:text-xl text-amber-100/90 font-medium max-w-3xl mx-auto mb-8 leading-relaxed">
            Fakultas Syariah — <span className="font-semibold text-white">UIN Siber Syekh Nurjati Cirebon</span>
            <br />
            Sistem Informasi Akademik, Presensi Digital Mahasiswa & Repositori 11 Mata Kuliah
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            {auth ? (
              auth.role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-black text-amber-300 font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center space-x-2 border border-amber-400/40"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Buka Dashboard Admin</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/mahasiswa"
                    className="px-6 py-3 rounded-xl bg-white hover:bg-amber-50 text-[#8c4e24] font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Presensi & Nilai Saya ({auth.name.split(' ')[0]})</span>
                  </Link>
                  <Link
                    href="/pj"
                    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Portal PJ Matakuliah</span>
                  </Link>
                </>
              )
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm sm:text-base shadow-xl shadow-stone-950/20 hover:scale-105 transition-all flex items-center space-x-2.5"
                >
                  <LogIn className="w-5 h-5 text-stone-900" />
                  <span>Masuk Portal Presensi HK A</span>
                </Link>
                <button
                  onClick={() => setShowRosterModal(true)}
                  className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm sm:text-base backdrop-blur-md border border-white/30 transition-all flex items-center space-x-2"
                >
                  <Users className="w-5 h-5 text-amber-200" />
                  <span>Daftar 30 Mahasiswa</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Stat Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-12 pt-8 border-t border-white/15 text-left">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] text-amber-200 uppercase font-semibold">Total Mahasiswa</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{students.length} Mahasiswa</p>
              <p className="text-[10px] text-amber-100/70">Terdaftar Resmi</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] text-amber-200 uppercase font-semibold">Mata Kuliah</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{courses.length} Matkul</p>
              <p className="text-[10px] text-amber-100/70">Semester Ganjil</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] text-amber-200 uppercase font-semibold">Hari Ini</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {todayCourses.length > 0 ? `${todayCourses.length} Kuliah` : 'Libur'}
              </p>
              <p className="text-[10px] text-amber-100/70">{todayName}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] text-amber-200 uppercase font-semibold">Sistem Presensi</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-300 mt-0.5">PIN & PJ</p>
              <p className="text-[10px] text-amber-100/70">Terisolasi Aman</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {/* Jadwal Kuliah Hari Ini */}
        <section id="jadwal" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#9d5f2f]" />
                <h2 className="text-xl font-bold text-stone-900">Jadwal Kuliah Hari Ini ({todayName})</h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Rangkaian perkuliahan aktif kelas Hukum Keluarga A 2025 untuk hari ini.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-900 rounded-full w-fit">
              Semester Ganjil 2025/2026
            </span>
          </div>

          {todayCourses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-700">Tidak Ada Jadwal Kuliah Hari Ini</h3>
              <p className="text-xs text-stone-500 mt-1">
                Hari ini ({todayName}) tidak ada perkuliahan terjadwal. Manfaatkan waktu untuk belajar mandiri atau mengerjakan tugas kelompok.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {todayCourses.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-md shadow-amber-900/5 hover:border-[#9d5f2f] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono font-bold text-[#9d5f2f] bg-amber-50 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className="font-semibold text-stone-500">{c.sks} SKS</span>
                    </div>
                    <h3 className="font-bold text-base text-stone-900 mb-1">{c.name}</h3>
                    <p className="text-xs text-stone-600 mb-3">{c.dosen}</p>

                    <div className="space-y-1.5 text-xs text-stone-500 pt-3 border-t border-stone-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-[#9d5f2f]" />
                        <span>{c.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-3.5 h-3.5 text-[#9d5f2f]" />
                        <span>{c.room}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-[#9d5f2f]" />
                        <span className="line-clamp-1">PJ: {getPjNames(c.pjNims)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCourse(c)}
                      className="text-xs font-semibold text-[#9d5f2f] hover:text-[#753e1f] flex items-center space-x-1"
                    >
                      <span>Lihat Repositori & Materi</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 11 Daftar Mata Kuliah & Repositori */}
        <section id="matakuliah" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#9d5f2f]" />
                <h2 className="text-xl font-bold text-stone-900">11 Mata Kuliah & Penyimpanan Materi</h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Daftar lengkap mata kuliah HK A 2025 beserta RPS, modul, materi dosen, dan berkas tugas.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari mata kuliah atau dosen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c) => {
              const courseMats = materials.filter((m) => m.courseId === c.id);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md hover:border-[#9d5f2f]/60 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Code & Day */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono font-bold text-[#9d5f2f] bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60">
                        {c.code}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        {c.day}, {c.time.split('-')[0]}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-base text-stone-900 group-hover:text-[#9d5f2f] transition-colors mb-1">
                      {c.name}
                    </h3>
                    <p className="text-xs font-medium text-stone-600 mb-2.5">{c.dosen}</p>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
                      {c.description}
                    </p>

                    {/* PJ and Info */}
                    <div className="bg-stone-50/80 rounded-xl p-3 text-xs space-y-1.5 border border-stone-100">
                      <div className="flex items-start justify-between">
                        <span className="text-stone-400 font-medium">Penanggung Jawab:</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[170px] line-clamp-1">
                          {getPjNames(c.pjNims)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Bobot:</span>
                        <span className="font-medium text-stone-700">{c.sks} SKS (Semester {c.semester})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Ruang:</span>
                        <span className="font-medium text-stone-700 line-clamp-1">{c.room}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedCourse(c)}
                      className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#9d5f2f] font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Materi & Tugas ({courseMats.length})</span>
                    </button>
                    {c.driveLink && (
                      <a
                        href={c.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka Folder Google Drive"
                        className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:text-[#9d5f2f] hover:bg-stone-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pengumuman & Berita Kelas HK A */}
        <section id="pengumuman" className="scroll-mt-24">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-[#9d5f2f]" />
            <h2 className="text-xl font-bold text-stone-900">Papan Informasi & Pengumuman Kelas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        ann.category === 'PENTING'
                          ? 'bg-red-100 text-red-800'
                          : ann.category === 'TUGAS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ann.category}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">{ann.date}</span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 mb-2">{ann.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{ann.content}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                  Diposting oleh: <span className="font-semibold text-stone-600">{ann.author}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal: Course Repository / Materi Detail */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-start justify-between">
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
                onClick={() => setSelectedCourse(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Berkas Materi, Modul, & Makalah
                  </h4>
                  {selectedCourse.driveLink && (
                    <a
                      href={selectedCourse.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#9d5f2f] font-semibold hover:underline flex items-center space-x-1"
                    >
                      <span>Buka Folder Drive Lengkap</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {materials.filter((m) => m.courseId === selectedCourse.id).length === 0 ? (
                  <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400">
                    <FileText className="w-8 h-8 mx-auto mb-1 text-stone-300" />
                    <p>Belum ada modul atau makalah yang diunggah untuk mata kuliah ini.</p>
                    <p className="text-[10px] text-stone-400 mt-1">
                      PJ mata kuliah dapat mengunggahnya melalui Portal PJ.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials
                      .filter((m) => m.courseId === selectedCourse.id)
                      .map((mat) => (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all bg-white"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#9d5f2f] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{mat.title}</p>
                              {mat.description && (
                                <p className="text-[11px] text-stone-500 mt-0.5">{mat.description}</p>
                              )}
                              <p className="text-[10px] text-stone-400 mt-1">
                                Tipe: <span className="font-semibold text-[#9d5f2f]">{mat.type}</span> •
                                Diunggah oleh: {mat.uploadedBy} ({mat.uploadedAt})
                              </p>
                            </div>
                          </div>
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-[#9d5f2f] hover:text-white font-semibold text-stone-700 transition-colors flex items-center space-x-1 flex-shrink-0"
                          >
                            <span>Unduh</span>
                            <FolderDown className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-center justify-between">
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
                  {students.map((st, idx) => (
                    <tr key={st.nim} className="hover:bg-amber-50/50">
                      <td className="py-2 px-3 text-center text-stone-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-[#9d5f2f]">{st.nim}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <p className="text-[11px] text-stone-500">
                Hanya mahasiswa pada daftar ini yang dapat login ke sistem.
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
    </div>
  );
}

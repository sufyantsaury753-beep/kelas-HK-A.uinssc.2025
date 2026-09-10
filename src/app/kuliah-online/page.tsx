'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  Share2,
  Copy,
  Check,
  MessageCircle,
  GraduationCap,
  Users,
  ShieldCheck,
  Search,
  ArrowRight,
  BookOpen,
  ScrollText,
  Scale,
  Briefcase,
  PieChart,
  Globe,
  HeartHandshake,
  Gavel,
  MapPin,
  BookMarked,
  Info,
  ExternalLink,
  Link2,
  Trash2,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession } from '@/lib/types';
import {
  getLecturerInviteMessage,
  getStudentInviteMessage,
  detectMeetingPlatform,
} from '@/lib/meetUtils';

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Helper to get distinct, meaningful academic icons for each course
function getCourseIcon(courseId: string, courseName: string) {
  const lower = (courseId + ' ' + courseName).toLowerCase();
  if (lower.includes('tafsir')) return BookOpen;
  if (lower.includes('tarikh') || lower.includes('tasyri')) return ScrollText;
  if (lower.includes('qowaid') || lower.includes('fiqhiyah')) return Scale;
  if (lower.includes('bisnis')) return Briefcase;
  if (lower.includes('kewarisan') || lower.includes('waris')) return PieChart;
  if (lower.includes('internasional')) return Globe;
  if (lower.includes('perkawinan')) return HeartHandshake;
  if (lower.includes('ibadah')) return Sparkles;
  if (lower.includes('perdata islam')) return Gavel;
  if (lower.includes('agraria')) return MapPin;
  if (lower.includes('hadits')) return BookMarked;
  return BookOpen;
}

export default function KuliahOnlineIndexPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShareCourse, setSelectedShareCourse] = useState<Course | null>(null);
  const [copiedType, setCopiedType] = useState<'dosen' | 'mhs' | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  // Quick edit modal state for PJ / Admin
  const [quickEditCourse, setQuickEditCourse] = useState<Course | null>(null);
  const [quickMeetingUrl, setQuickMeetingUrl] = useState('');
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  const today = new Date();
  const todayDayName = INDONESIAN_DAYS[today.getDay()];

  useEffect(() => {
    const update = () => {
      setCourses(appStore.getCourses());
      setAuth(appStore.getAuth());
    };
    update();
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    const unsub = appStore.subscribe(update);
    return () => unsub();
  }, []);

  const isUserAdmin = auth?.role === 'ADMIN';
  const isUserPjForCourse = (crs: Course) => {
    if (isUserAdmin) return true;
    const userNim = (auth?.nim || '').trim();
    return Array.isArray(crs.pjNims) && crs.pjNims.some((pNim) => pNim.trim() === userNim);
  };

  const handleSaveQuickMeetingUrl = () => {
    if (!quickEditCourse) return;
    appStore.setCourseMeetingUrl(quickEditCourse.id, quickMeetingUrl);
    setCourses(appStore.getCourses());
    setQuickNotice(quickMeetingUrl.trim() ? 'Tautan berhasil disimpan!' : 'Tautan berhasil dikosongkan!');
    setTimeout(() => {
      setQuickEditCourse(null);
      setQuickNotice(null);
    }, 900);
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dosen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.day && c.day.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCopyLecturer = (c: Course) => {
    const msg = getLecturerInviteMessage(c, baseUrl);
    navigator.clipboard.writeText(msg);
    setCopiedType('dosen');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyStudent = (c: Course) => {
    const msg = getStudentInviteMessage(c, baseUrl);
    navigator.clipboard.writeText(msg);
    setCopiedType('mhs');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleWhatsAppLecturer = (c: Course) => {
    const msg = getLecturerInviteMessage(c, baseUrl);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleWhatsAppStudent = (c: Course) => {
    const msg = getStudentInviteMessage(c, baseUrl);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-in fade-in duration-200">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#78350f] via-[#8c4e24] to-[#451a03] p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-amber-200 backdrop-blur-xs">
            <Video className="w-3.5 h-3.5 text-amber-300" />
            <span>Tatap Muka Virtual • Bebas Batas Waktu (No Limit)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Ruang Kuliah Online HK A 2025
          </h1>

          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
            Platform tatap muka virtual terintegrasi untuk 11 mata kuliah Kelas Hukum Keluarga A 2025. Dilengkapi tautan khusus Dosen Pengampu tanpa ribet login serta ruang terproteksi khusus mahasiswa.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
            <div className="bg-black/25 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-emerald-300 font-bold block mb-0.5">⏱️ Bebas Batas Waktu</span>
              <span className="text-[11px] text-amber-100/80">Tidak terputus 40-60 menit</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-amber-300 font-bold block mb-0.5">👨‍🏫 Link Khusus Dosen</span>
              <span className="text-[11px] text-amber-100/80">Otomatis dosen tanpa login</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-sky-300 font-bold block mb-0.5">🔒 Akses Terproteksi</span>
              <span className="text-[11px] text-amber-100/80">Hanya mahasiswa login & dosen</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-purple-300 font-bold block mb-0.5">📱 Ringan di Ponsel</span>
              <span className="text-[11px] text-amber-100/80">Buka langsung lewat browser</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mata kuliah, dosen, atau hari..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 focus:border-[#8c4e24] transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-stone-500 self-end sm:self-center">
          <span>Hari ini: <strong className="text-[#8c4e24]">{todayDayName}</strong></span>
          <span>•</span>
          <span>{courses.length} Ruang Kuliah Tersedia</span>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((c) => {
          const IconComponent = getCourseIcon(c.id, c.name);
          const isToday = (c.day || '').trim().toLowerCase() === todayDayName.toLowerCase();

          return (
            <div
              key={c.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md relative overflow-hidden group ${
                isToday
                  ? 'border-amber-400/80 ring-2 ring-amber-400/30 bg-gradient-to-b from-amber-50/20 to-white'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
            >
              {/* Top Accent for Today */}
              {isToday && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-[#8c4e24]" />
              )}

              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-[#8c4e24] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {c.code}
                      </span>
                      <span className="text-[10px] text-stone-400 ml-1.5 font-medium">
                        {c.sks} SKS
                      </span>
                    </div>
                  </div>

                  {isToday ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>Jadwal Hari Ini</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-stone-500 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200">
                      {c.day || 'Jadwal Reguler'}
                    </span>
                  )}
                </div>

                {/* Course Name */}
                <h3 className="font-bold text-base text-stone-900 leading-snug group-hover:text-[#8c4e24] transition-colors mb-2 line-clamp-2">
                  {c.name}
                </h3>

                {/* Lecturer & Schedule Info */}
                <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50/80 p-3 rounded-2xl border border-stone-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#8c4e24] flex-shrink-0" />
                    <span className="truncate">
                      Dosen: <strong className="text-stone-800">{c.dosen}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-[#8c4e24] flex-shrink-0" />
                    <span>
                      {c.day ? `${c.day}, ` : ''}{c.time}
                    </span>
                  </div>
                </div>

                {/* Status Kuliah Online */}
                <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-xl mb-3 border bg-stone-50 border-stone-200">
                  <span className="text-stone-500 font-medium">Status Kuliah:</span>
                  {c.meetingUrl && c.meetingUrl.trim() ? (
                    <span className="font-bold text-emerald-700 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{detectMeetingPlatform(c.meetingUrl).label} (Aktif)</span>
                    </span>
                  ) : (
                    <span className="font-medium text-stone-400 italic">
                      ⚪ Belum Ada Link (Abu-abu)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                {c.meetingUrl && c.meetingUrl.trim() ? (
                  <a
                    href={c.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-900/20 transition-all active:scale-95 animate-pulse text-center"
                  >
                    <Video className="w-4 h-4 text-white" />
                    <span>{detectMeetingPlatform(c.meetingUrl).actionText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 border border-stone-200 text-stone-400 font-bold text-xs flex items-center justify-center space-x-2 cursor-not-allowed opacity-80"
                    title="Tautan perkuliahan belum disematkan oleh PJ atau Dosen"
                  >
                    <Video className="w-4 h-4 text-stone-400" />
                    <span>Link Belum Disematkan (Abu-abu)</span>
                  </button>
                )}

                {/* Quick Edit Button for PJ or Admin */}
                {isUserPjForCourse(c) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickEditCourse(c);
                      setQuickMeetingUrl(c.meetingUrl || '');
                      setQuickNotice(null);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8c4e24] border border-amber-300 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#8c4e24]" />
                    <span>{c.meetingUrl ? 'Ubah Link Meet (PJ/Admin)' : 'Sematkan Link Meet (PJ/Admin)'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedShareCourse(c)}
                  className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Bagikan Link WA</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {selectedShareCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Bagikan Tautan Kuliah Online</h3>
                  <p className="text-[10px] text-stone-400">{selectedShareCourse.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShareCourse(null)}
                className="text-stone-400 hover:text-stone-700 p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Option 1: Share to Lecturer */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-[#8c4e24]" />
                  <span className="font-bold text-xs text-stone-900">
                    Tautan Khusus Dosen Pengampu
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-[#753e1f]">
                  Tanpa Login
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Tautan ini dilengkapi token khusus sehingga <strong>{selectedShareCourse.dosen}</strong> dapat langsung masuk sebagai Dosen Pengampu tanpa registrasi akun.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopyLecturer(selectedShareCourse)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-amber-300 text-[#8c4e24] font-bold text-xs hover:bg-amber-100 transition-all flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  {copiedType === 'dosen' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Teks Undangan Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pesan WA Dosen</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsAppLecturer(selectedShareCourse)}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
              </div>
            </div>

            {/* Option 2: Share to Students */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-stone-700" />
                  <span className="font-bold text-xs text-stone-900">
                    Tautan Grup Mahasiswa HK A
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  Wajib Login
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Kirim pengumuman ruang perkuliahan tatap muka ke grup kelas HK A 2025. Mahasiswa wajib login akun mereka.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopyStudent(selectedShareCourse)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-all flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  {copiedType === 'mhs' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Teks Pengumuman Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pesan Grup Mhs</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsAppStudent(selectedShareCourse)}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedShareCourse(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal for PJ / Admin */}
      {quickEditCourse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Sematkan Link Kuliah Online</h3>
                  <p className="text-[10px] text-stone-500">{quickEditCourse.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditCourse(null)}
                className="text-stone-400 hover:text-stone-700 p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {quickNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{quickNotice}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tautan Google Meet / Zoom
                </label>
                <input
                  type="url"
                  value={quickMeetingUrl}
                  onChange={(e) => setQuickMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/... atau https://zoom.us/..."
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 focus:border-[#8c4e24]"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Kosongkan jika perkuliahan selesai agar tombol mahasiswa kembali abu-abu.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickEditCourse(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-600"
                >
                  Batal
                </button>
                {quickEditCourse.meetingUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickMeetingUrl('');
                      appStore.setCourseMeetingUrl(quickEditCourse.id, '');
                      setCourses(appStore.getCourses());
                      setQuickNotice('Tautan berhasil dikosongkan!');
                      setTimeout(() => {
                        setQuickEditCourse(null);
                        setQuickNotice(null);
                      }, 900);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveQuickMeetingUrl}
                  className="px-4 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Simpan Tautan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

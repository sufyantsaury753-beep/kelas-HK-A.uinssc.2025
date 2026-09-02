'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { appStore } from '@/lib/store';
import { AuthSession, Course, Student } from '@/lib/types';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showWeeklyScheduleModal, setShowWeeklyScheduleModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasPjRole, setHasPjRole] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const currentAuth = appStore.getAuth();
      setAuth(currentAuth);
      const allCourses = appStore.getCourses();
      setCourses(allCourses);
      setStudents(appStore.getStudents());

      if (currentAuth?.nim) {
        const cleanUserNim = (currentAuth.nim || '').trim();
        const isPj = (allCourses || []).some((c) =>
          Array.isArray(c?.pjNims) && c.pjNims.some((pNim) => (pNim || '').trim() === cleanUserNim)
        );
        setHasPjRole(isPj);
      } else {
        setHasPjRole(false);
      }
    };

    checkAuth();
    const unsubscribe = appStore.subscribe(checkAuth);
    return () => unsubscribe();
  }, [pathname]);

  const getPjNames = (pjNims?: string[]) => {
    if (!pjNims || pjNims.length === 0) return 'Belum ditentukan';
    return pjNims
      .map((nim) => {
        const s = students.find((st) => st.nim === nim);
        return s ? s.name : nim;
      })
      .join(', ');
  };

  const handleLogout = () => {
    appStore.setAuth(null);
    setAuth(null);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-full bg-stone-950/90 border border-amber-500/50 p-0.5 shadow-md shadow-[#9d5f2f]/20 group-hover:scale-105 transition-transform flex-shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo HK A 2025"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-stone-900 tracking-tight group-hover:text-[#9d5f2f] transition-colors">
                  HK A 2025
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Syariah
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium tracking-tight line-clamp-1">
                UIN Siber Syekh Nurjati Cirebon
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-[#9d5f2f] bg-amber-50/80 font-semibold'
                  : 'text-stone-600 hover:text-[#9d5f2f] hover:bg-stone-50'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/#jadwal"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-[#9d5f2f] hover:bg-stone-50 transition-colors"
            >
              Jadwal Kuliah
            </Link>
            <Link
              href="/#matakuliah"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-[#9d5f2f] hover:bg-stone-50 transition-colors"
            >
              Mata Kuliah
            </Link>
            <button
              type="button"
              onClick={() => setShowWeeklyScheduleModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-[#9d5f2f] hover:bg-amber-50/70 transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-[#9d5f2f]" />
              <span>Jadwal Seminggu</span>
            </button>
            <Link
              href="/#pengumuman"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-[#9d5f2f] hover:bg-stone-50 transition-colors"
            >
              Pengumuman
            </Link>
          </div>

          {/* Desktop Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2.5">
            {auth ? (
              <div className="flex items-center space-x-2">
                {/* Portals depending on role */}
                {auth.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 text-white hover:bg-stone-900 text-xs font-semibold shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Portal Admin</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/mahasiswa"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all"
                    >
                      <UserCheck className="w-4 h-4 text-[#9d5f2f]" />
                      <span>Presensi Saya</span>
                    </Link>
                    {hasPjRole && (
                      <Link
                        href="/pj"
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] text-white hover:brightness-110 text-xs font-semibold shadow-sm transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Kelola Presensi PJ</span>
                      </Link>
                    )}
                  </>
                )}

                {/* User Info Chip */}
                <div className="text-right pl-2 pr-1">
                  <p className="text-xs font-bold text-stone-800 line-clamp-1 max-w-[130px]">
                    {auth.name}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono">
                    {auth.nim ? auth.nim : 'SUPERADMIN'}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  title="Keluar / Logout"
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#9d5f2f] to-[#8c4e24] text-white text-sm font-semibold hover:shadow-md hover:shadow-[#9d5f2f]/30 hover:brightness-105 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Portal HK A</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {auth && (
              <span className="text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-900">
                {(auth.name || 'User').split(' ')[0]}
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-4 duration-150">
          <div className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-[#9d5f2f] text-sm font-medium"
            >
              Beranda
            </Link>
            <Link
              href="/#jadwal"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-[#9d5f2f] text-sm font-medium"
            >
              Jadwal Kuliah
            </Link>
            <Link
              href="/#matakuliah"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-[#9d5f2f] text-sm font-medium"
            >
              Mata Kuliah & Repositori
            </Link>
            <Link
              href="/#pengumuman"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-[#9d5f2f] text-sm font-medium"
            >
              Pengumuman Kelas
            </Link>

            {/* Tombol Pop-up Jadwal Seminggu */}
            <button
              type="button"
              onClick={() => {
                setShowWeeklyScheduleModal(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-50 text-[#753e1f] font-bold text-sm border border-amber-300/80 shadow-xs hover:bg-amber-100/60 transition-all text-left mt-1"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#9d5f2f] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <p className="leading-tight text-stone-900 font-bold">Jadwal Kuliah Seminggu</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">Senin s.d. Sabtu • {courses.length} Mata Kuliah</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                Pop-up
              </span>
            </button>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-col space-y-2">
            {auth ? (
              <>
                <div className="px-3 py-2 bg-stone-50 rounded-lg">
                  <p className="text-xs font-semibold text-stone-900">{auth.name}</p>
                  <p className="text-[11px] text-stone-500 font-mono">
                    {auth.nim ? `NIM: ${auth.nim}` : 'Administrator'}
                  </p>
                </div>
                {auth.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Portal Administrator</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/mahasiswa"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center space-x-2 py-2.5 bg-stone-100 text-stone-800 rounded-xl text-sm font-semibold"
                    >
                      <UserCheck className="w-4 h-4 text-[#9d5f2f]" />
                      <span>Dashboard Mahasiswa</span>
                    </Link>
                    {hasPjRole && (
                      <Link
                        href="/pj"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] text-white rounded-xl text-sm font-semibold"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Kelola Presensi PJ Matakuliah</span>
                      </Link>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 py-2 text-red-600 bg-red-50 rounded-xl text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 py-2.5 bg-[#9d5f2f] text-white rounded-xl text-sm font-semibold shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Portal HK A</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* POP-UP MODAL JADWAL KULIAH SEMINGGU */}
      {mounted &&
        showWeeklyScheduleModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-[#9d5f2f] via-[#8c4e24] to-[#753e1f] text-white p-5 sm:p-6 relative">
                <button
                  type="button"
                  onClick={() => setShowWeeklyScheduleModal(false)}
                  className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors shadow-xs"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2.5 mb-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-100">
                    Jadwal Kuliah Terpadu
                  </span>
                  <span className="text-xs text-amber-200/80 font-medium">Semester Ganjil 2026/2027</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Jadwal Kuliah Mingguan HK A
                </h3>
                <p className="text-xs sm:text-sm text-amber-100/85 mt-1 font-medium">
                  Rincian jadwal hari Senin sampai Sabtu lengkap dengan jam, ruangan, dosen pengampu, dan PJ kelas.
                </p>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/60">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                  const dayCourses = (courses || []).filter((c) => (c?.day || '').toLowerCase() === day.toLowerCase());
                  const isWeekend = day === 'Minggu';

                  return (
                    <div
                      key={day}
                      className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-amber-400/50 transition-all"
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${dayCourses.length > 0 ? 'bg-[#9d5f2f]' : 'bg-stone-300'}`} />
                          <h4 className="font-bold text-stone-900 text-sm sm:text-base tracking-tight">
                            {day}
                          </h4>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            dayCourses.length > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {dayCourses.length > 0
                            ? `${dayCourses.length} Mata Kuliah`
                            : isWeekend
                            ? 'Libur Akhir Pekan'
                            : 'Tidak Ada Jadwal'}
                        </span>
                      </div>

                      {/* Courses List */}
                      {dayCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dayCourses.map((c) => (
                            <div
                              key={c.id}
                              className="p-3.5 rounded-xl bg-stone-50 hover:bg-amber-50/40 border border-stone-200/80 hover:border-amber-300 transition-all flex flex-col justify-between space-y-2.5"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                                    {c.code} • {c.sks} SKS
                                  </span>
                                  <div className="flex items-center space-x-1 text-[11px] font-bold text-[#8c4e24] bg-amber-100/70 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3" />
                                    <span>{c.time.replace(' WIB', '')}</span>
                                  </div>
                                </div>
                                <h5 className="font-bold text-stone-900 text-sm tracking-tight line-clamp-1">
                                  {c.name}
                                </h5>
                                <p className="text-[11px] text-stone-600 line-clamp-1 mt-1 flex items-center space-x-1 font-medium">
                                  <GraduationCap className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                                  <span>{c.dosen}</span>
                                </p>
                              </div>

                              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                                <span className="flex items-center space-x-1 line-clamp-1 max-w-[150px]">
                                  <MapPin className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                  <span className="line-clamp-1 font-medium text-stone-600">{c.room}</span>
                                </span>
                                <span className="flex items-center space-x-1 line-clamp-1 text-right text-stone-600 font-medium">
                                  <Users className="w-3 h-3 text-stone-400 flex-shrink-0" />
                                  <span className="line-clamp-1 max-w-[130px]">PJ: {getPjNames(c.pjNims)}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 italic py-1">
                          {isWeekend ? 'Waktu istirahat / libur perkuliahan.' : 'Tidak ada jadwal mata kuliah terjadwal pada hari ini.'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-[11px] text-stone-400 text-center sm:text-left">
                  * Jadwal dapat disesuaikan sewaktu-waktu oleh Dosen Pengampu & PJ Mata Kuliah.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWeeklyScheduleModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#9d5f2f] hover:bg-[#864d23] text-white font-bold text-xs shadow-sm transition-all"
                >
                  Tutup Jadwal
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </nav>
  );
}

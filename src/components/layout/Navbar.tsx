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
  Home,
  Bell,
  ChevronRight,
  Video,
  Settings,
  KeyRound,
  Check,
  CheckCircle2,
  AlertCircle,
  User,
  Search,
} from 'lucide-react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeSemester, setActiveSemester] = useState<number>(3);
  const [showWeeklyScheduleModal, setShowWeeklyScheduleModal] = useState(false);
  const [scheduleDayFilter, setScheduleDayFilter] = useState<string>('all');
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasPjRole, setHasPjRole] = useState(false);

  // Settings & Nickname State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'NICKNAME' | 'PIN'>('NICKNAME');
  const [nicknameInput, setNicknameInput] = useState('');
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [settingsNotice, setSettingsNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [displayedNickname, setDisplayedNickname] = useState('');
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
      setActiveSemester(appStore.getActiveSemester());

      if (currentAuth?.nim) {
        const cleanUserNim = (currentAuth.nim || '').trim();
        const isPj = (allCourses || []).some((c) =>
          Array.isArray(c?.pjNims) && c.pjNims.some((pNim) => (pNim || '').trim() === cleanUserNim)
        );
        setHasPjRole(isPj);
        const nick = appStore.getStudentNickname(cleanUserNim);
        const defaultNick = (currentAuth.name || 'User').split(' ')[0];
        setDisplayedNickname(nick || defaultNick);
        if (!nicknameInput) setNicknameInput(nick || defaultNick);
      } else if (currentAuth) {
        setHasPjRole(false);
        setDisplayedNickname('Admin');
        if (!nicknameInput) setNicknameInput('Admin');
      } else {
        setHasPjRole(false);
        setDisplayedNickname('');
      }
    };

    checkAuth();
    const unsubscribe = appStore.subscribe(checkAuth);
    return () => unsubscribe();
  }, [pathname]);

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !auth.nim) return;
    const cleanNick = nicknameInput.trim();
    if (!cleanNick) {
      setSettingsNotice({ type: 'error', text: 'Nama panggilan tidak boleh kosong.' });
      return;
    }
    appStore.setStudentNickname(auth.nim, cleanNick);
    setDisplayedNickname(cleanNick);
    setSettingsNotice({ type: 'success', text: `Nama panggilan berhasil diubah menjadi "${cleanNick}"!` });
    setTimeout(() => {
      setSettingsNotice(null);
    }, 2000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !auth.nim) return;
    const student = students.find((s) => (s.nim || '').trim() === (auth.nim || '').trim());
    if (student?.pin && oldPinInput.trim() !== student.pin.trim()) {
      setSettingsNotice({ type: 'error', text: 'PIN lama yang Anda masukkan salah.' });
      return;
    }
    if (!/^\d{6}$/.test(newPinInput.trim())) {
      setSettingsNotice({ type: 'error', text: 'PIN baru harus tepat 6 digit angka.' });
      return;
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setSettingsNotice({ type: 'error', text: 'Konfirmasi PIN baru tidak cocok.' });
      return;
    }

    appStore.setStudentPin(auth.nim, newPinInput.trim());
    setSettingsNotice({ type: 'success', text: 'PIN keamanan 6 digit berhasil diperbarui!' });
    setOldPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => {
      setSettingsNotice(null);
    }, 2000);
  };

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
    router.replace('/');
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 no-print">
      {/* Official University Portal Top Bar */}
      <div className="bg-[#78350f] text-white text-[11px] py-1 px-4 border-b border-[#632a0c]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-amber-200">Fakultas Syariah</span>
            <span className="text-amber-300/40">•</span>
            <span className="hidden sm:inline text-stone-200">UIN Siber Syekh Nurjati Cirebon</span>
            <span className="hidden md:inline text-amber-300/40">•</span>
            <span className="hidden md:inline text-amber-100/80">Cyber Islamic University</span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-medium text-amber-100">
            <span>Semester {activeSemester} ({activeSemester % 2 === 1 ? 'Ganjil' : 'Genap'})</span>
            <span className="hidden sm:inline bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/30 text-amber-200">Kelas A</span>
          </div>
        </div>
      </div>

      <nav className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 py-2">
          {/* Brand Logo & Name */}
          <Link href="/" replace className="flex items-center space-x-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-stone-950/90 border border-amber-500/50 p-0.5 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo HK A 2025"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="font-bold text-base text-stone-900 tracking-tight group-hover:text-[#8c4e24] transition-colors">
                  HK A 2025
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Syariah
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-medium tracking-tight mt-1 line-clamp-1">
                UIN Siber Cirebon
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Clean, Uniform Typography) */}
          <div className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
            <Link
              href="/"
              replace
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium transition-colors ${
                pathname === '/'
                  ? 'text-[#8c4e24] bg-amber-50/80 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/#jadwal"
              className="px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Jadwal Kuliah
            </Link>
            <Link
              href="/#matakuliah"
              className="px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Mata Kuliah
            </Link>
            <button
              type="button"
              onClick={() => setShowWeeklyScheduleModal(true)}
              className="px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium text-stone-600 hover:text-stone-900 hover:bg-amber-50/70 transition-colors"
            >
              Jadwal Seminggu
            </button>
            <Link
              href="/library"
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium transition-colors ${
                pathname.startsWith('/library')
                  ? 'text-[#8c4e24] bg-amber-50/80 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              E-Library
            </Link>
            <Link
              href="/#pengumuman"
              className="px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Pengumuman
            </Link>
          </div>

          {/* Desktop Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2.5 flex-shrink-0">
            {auth ? (
              <div className="flex items-center space-x-2">
                {/* Portals depending on role */}
                {auth.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-amber-300 text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Portal Admin</span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <Link
                      href="/mahasiswa"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#8c4e24]" />
                      <span>Presensi Saya</span>
                    </Link>
                    {hasPjRole && (
                      <Link
                        href="/pj"
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white text-xs font-semibold shadow-xs transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Presensi PJ</span>
                      </Link>
                    )}
                  </div>
                )}

                {/* User Info & Actions Pill Group */}
                <div className="flex items-center pl-2.5 border-l border-stone-200/80 space-x-2">
                  <div className="text-right">
                    <div className="text-xs font-bold text-stone-900 leading-tight max-w-[120px] lg:max-w-[160px] truncate" title={auth.name}>
                      {displayedNickname || auth.name}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400 leading-none mt-0.5">
                      {auth.nim ? auth.nim : 'SUPERADMIN'}
                    </div>
                  </div>

                  <div className="flex items-center bg-stone-100/90 rounded-xl p-0.5 border border-stone-200/60">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(true)}
                      title="Pengaturan Akun"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-[#8c4e24] hover:bg-white transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Keluar / Logout"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk Portal</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Compact Nickname Badge */}
          <div className="flex md:hidden items-center space-x-2">
            {auth && (
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                title="Atur Nama Panggilan Badge Navbar"
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 shadow-2xs border border-amber-300/60 active:scale-95 transition-all"
              >
                {displayedNickname || (auth.name || 'User').split(' ')[0]}
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              title="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Drawer (Right off-canvas, compact, not full screen) */}
      {mounted && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99999] md:hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Container (Right side, compact width 280px, rounded-l-3xl) */}
          <div className="relative z-10 w-72 sm:w-80 max-w-[82vw] h-full bg-white shadow-2xl rounded-l-3xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-stone-950 p-0.5 border border-amber-400/50 flex-shrink-0">
                    <img src="/logo.png" alt="Logo HK A" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-xs">HK A 2025</h3>
                    <p className="text-[10px] text-stone-400 font-medium">Menu Navigasi</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Session Profile Mini (Always displays Full Official Name) */}
              {auth && (
                <div className="my-3.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-9 h-9 rounded-full bg-[#8c4e24] text-white font-bold text-xs flex items-center justify-center ring-2 ring-amber-400/50 shadow-xs shrink-0">
                      {auth.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-stone-900 truncate" title={auth.name}>
                        {auth.name}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {auth.nim ? `NIM: ${auth.nim}` : 'Admin'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-[#753e1f] border border-amber-300 shrink-0">
                    {auth.role === 'ADMIN' ? 'Admin' : (hasPjRole ? 'PJ' : 'Mhs')}
                  </span>
                </div>
              )}

              {/* Navigation Links - Clean: Only Beranda, Pengumuman, Presensi, PJ, Setting */}
              <div className="flex flex-col space-y-1 mt-2">
                <Link
                  href="/"
                  replace
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    pathname === '/'
                      ? 'bg-amber-50 text-[#8c4e24] font-bold'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      pathname === '/' ? 'bg-[#8c4e24] text-white shadow-2xs' : 'bg-stone-100 text-stone-600'
                    }`}>
                      <Home className="w-3.5 h-3.5" />
                    </div>
                    <span>Beranda</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </Link>

                <Link
                  href="/#pengumuman"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <span>Pengumuman Kelas</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </Link>

                {/* Portal Mahasiswa */}
                {auth && auth.role !== 'ADMIN' && (
                  <Link
                    href="/mahasiswa"
                    replace
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      pathname === '/mahasiswa'
                        ? 'bg-amber-50 text-[#8c4e24] font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>Presensi Mahasiswa</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                )}

                {/* Portal PJ */}
                {hasPjRole && (
                  <Link
                    href="/pj"
                    replace
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      pathname === '/pj'
                        ? 'bg-amber-50 text-[#8c4e24] font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-xl bg-[#8c4e24] text-white flex items-center justify-center shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <span>Portal PJ Presensi</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                )}

                {/* Portal Admin if admin */}
                {auth && auth.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    replace
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>Portal Admin</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                )}

                {/* Menu Setting Baru */}
                {auth && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowSettingsModal(true);
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-stone-700 hover:bg-stone-50 text-left transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">Pengaturan Akun</p>
                        <p className="text-[10px] text-stone-400 font-normal">Ganti PIN & Nama Panggilan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Drawer Area (Logout or Login) */}
            <div className="pt-3.5 border-t border-stone-100">
              {auth ? (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  replace
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full py-2.5 bg-[#8c4e24] hover:bg-[#753e1f] text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Portal</span>
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* POP-UP MODAL JADWAL KULIAH SEMINGGU */}
      {mounted &&
        showWeeklyScheduleModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-auto overflow-hidden border border-stone-200/90 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
              {/* Modal Header (Luxury Espresso & Class Identity) */}
              <div className="bg-gradient-to-r from-[#200e05] via-[#2f1407] to-[#170903] text-white p-5 sm:p-6 relative border-b border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowWeeklyScheduleModal(false)}
                  className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-xs active:scale-95"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3.5 pr-10">
                  <div className="w-12 h-12 rounded-2xl bg-stone-950 p-1 border border-amber-400/50 shadow-md flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="Logo HK A" className="w-full h-full object-contain rounded-xl" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/35 text-amber-200">
                        Jadwal Kuliah Terpadu
                      </span>
                      <span className="text-xs text-amber-200/80 font-medium hidden sm:inline">
                        Semester Ganjil 2026/2027
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                      Jadwal Kuliah Mingguan HK A
                    </h3>
                    <p className="text-xs text-amber-100/80 mt-0.5 line-clamp-1">
                      Fakultas Syariah • UIN Siber Syekh Nurjati Cirebon
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search Bar Strip */}
              <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 space-y-2.5 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={scheduleSearchQuery}
                      onChange={(e) => setScheduleSearchQuery(e.target.value)}
                      placeholder="Cari mata kuliah, dosen, ruang, atau PJ..."
                      className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 hover:bg-stone-100/80 focus:bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 focus:border-[#8c4e24] transition-all"
                    />
                    {scheduleSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setScheduleSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Summary Metric Badge */}
                  <div className="flex items-center space-x-2 text-xs self-end sm:self-center">
                    <span className="font-extrabold px-3 py-1 rounded-xl bg-amber-50 text-[#8c4e24] border border-amber-200/80 shadow-2xs">
                      11 Mata Kuliah • 27 SKS
                    </span>
                  </div>
                </div>

                {/* Day Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setScheduleDayFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      scheduleDayFilter === 'all'
                        ? 'bg-[#8c4e24] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                    }`}
                  >
                    Semua Hari (11 MK)
                  </button>
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d) => {
                    const dCount = (courses || []).filter((c) => (c?.day || '').toLowerCase() === d.toLowerCase()).length;
                    const INDONESIAN_DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    const todayDayName = INDONESIAN_DAY_NAMES[new Date().getDay()];
                    const isToday = d.toLowerCase() === todayDayName.toLowerCase();
                    const isSelected = scheduleDayFilter.toLowerCase() === d.toLowerCase();

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setScheduleDayFilter(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-[#8c4e24] text-white shadow-xs'
                            : isToday
                            ? 'bg-amber-100/90 text-amber-950 border border-amber-300 hover:bg-amber-200/70'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                        }`}
                      >
                        <span>{d}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white font-bold'
                              : 'bg-stone-200/80 text-stone-700'
                          }`}
                        >
                          {dCount}
                        </span>
                        {isToday && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-600'} animate-pulse`} title="Hari Ini" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Body: Days & Courses */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5 bg-stone-50/70">
                {(scheduleDayFilter === 'all' ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] : [scheduleDayFilter]).map((day) => {
                  let dayCourses = (courses || []).filter((c) => (c?.day || '').toLowerCase() === day.toLowerCase());
                  const INDONESIAN_DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                  const todayDayName = INDONESIAN_DAY_NAMES[new Date().getDay()];
                  const isToday = day.toLowerCase() === todayDayName.toLowerCase();

                  if (scheduleSearchQuery.trim()) {
                    const q = scheduleSearchQuery.toLowerCase();
                    dayCourses = dayCourses.filter(
                      (c) =>
                        c.name.toLowerCase().includes(q) ||
                        c.code.toLowerCase().includes(q) ||
                        c.dosen.toLowerCase().includes(q) ||
                        c.room.toLowerCase().includes(q) ||
                        getPjNames(c.pjNims).toLowerCase().includes(q)
                    );
                  }

                  // Chronological sorting: 07:30 before 10:00!
                  const sortedCourses = [...dayCourses].sort((a, b) => {
                    const parseMinutes = (timeStr: string) => {
                      const match = (timeStr || '').match(/(\d{1,2}):(\d{2})/);
                      if (!match) return 9999;
                      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
                    };
                    return parseMinutes(a.time) - parseMinutes(b.time);
                  });

                  const daySks = sortedCourses.reduce((acc, c) => acc + (c.sks || 0), 0);

                  if (scheduleSearchQuery.trim() && sortedCourses.length === 0 && scheduleDayFilter === 'all') {
                    return null;
                  }

                  return (
                    <div
                      key={day}
                      className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs space-y-3.5"
                    >
                      {/* Day Header Banner */}
                      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-2xs ${
                            sortedCourses.length > 0
                              ? 'bg-gradient-to-br from-[#8c4e24] to-[#602e11] text-white'
                              : 'bg-stone-100 text-stone-400'
                          }`}>
                            {day.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-extrabold text-stone-900 text-base sm:text-lg tracking-tight">
                                {day}
                              </h4>
                              {isToday && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                                  Hari Ini
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 font-medium">
                              {sortedCourses.length > 0
                                ? `${sortedCourses.length} Mata Kuliah • Total ${daySks} SKS`
                                : day === 'Sabtu'
                                ? 'Libur Perkuliahan'
                                : 'Tidak Ada Jadwal Kuliah'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            sortedCourses.length > 0
                              ? 'bg-amber-50 text-[#8c4e24] border border-amber-200'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {sortedCourses.length > 0 ? `${sortedCourses.length} MK` : 'Libur'}
                        </span>
                      </div>

                      {/* Course Cards Grid */}
                      {sortedCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                          {sortedCourses.map((c) => (
                            <div
                              key={c.id}
                              className="p-4 rounded-2xl bg-stone-50/70 hover:bg-white border border-stone-200/90 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                            >
                              {/* Top Bar: Code & SKS (Left), Time (Right) */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700">
                                    {c.code}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                    {c.sks} SKS
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-900 bg-amber-100/80 border border-amber-300/80 px-2.5 py-1 rounded-xl">
                                  <Clock className="w-3.5 h-3.5 text-[#8c4e24]" />
                                  <span>{c.time.replace(' WIB', '')} WIB</span>
                                </div>
                              </div>

                              {/* Course Name & Academic Icon */}
                              <div className="flex items-start space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-100/60 text-[#8c4e24] border border-amber-200/80 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#8c4e24] group-hover:text-white transition-colors">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-extrabold text-stone-900 text-sm sm:text-[15px] tracking-tight leading-snug group-hover:text-[#8c4e24] transition-colors">
                                    {c.name}
                                  </h5>
                                  <p className="text-xs text-stone-600 mt-1 flex items-center space-x-1.5 font-medium">
                                    <GraduationCap className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                    <span className="truncate">{c.dosen}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Bottom Info: Room & PJ */}
                              <div className="pt-2.5 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold text-[11px]">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[130px] sm:max-w-[160px]">{c.room}</span>
                                </div>

                                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-100/90 text-stone-700 border border-stone-200 font-semibold text-[11px]">
                                  <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                  <span className="truncate max-w-[130px] sm:max-w-[160px]">PJ: {getPjNames(c.pjNims)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-stone-400 italic">
                          {day === 'Sabtu'
                            ? 'Waktu istirahat / libur akhir pekan perkuliahan.'
                            : scheduleSearchQuery
                            ? 'Tidak ada mata kuliah yang cocok dengan kata kunci pencarian.'
                            : 'Tidak ada jadwal mata kuliah terjadwal pada hari ini.'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2 text-xs text-stone-500 font-medium text-center sm:text-left">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Waktu Indonesia Barat (WIB) • Jadwal dapat disesuaikan oleh Dosen Pengampu & PJ Kelas.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeeklyScheduleModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  Tutup Jadwal
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* POP-UP MODAL PENGATURAN AKUN (NICKNAME & PIN) */}
      {mounted &&
        showSettingsModal &&
        auth &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-xs">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Pengaturan Akun</h3>
                    <p className="text-[10px] text-amber-200/90 font-medium">
                      Nama Panggilan & PIN Keamanan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setSettingsNotice(null);
                  }}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Alerts */}
              {settingsNotice && (
                <div
                  className={`mx-4 mt-3 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    settingsNotice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {settingsNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{settingsNotice.text}</span>
                </div>
              )}

              {/* Tabs */}
              <div className="p-4 pb-0 flex border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsTab('NICKNAME');
                    setSettingsNotice(null);
                  }}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                    settingsTab === 'NICKNAME'
                      ? 'border-[#8c4e24] text-[#8c4e24]'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Nama Badge Navbar HP</span>
                </button>
                {auth.nim && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsTab('PIN');
                      setSettingsNotice(null);
                    }}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                      settingsTab === 'PIN'
                        ? 'border-[#8c4e24] text-[#8c4e24]'
                        : 'border-transparent text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Ganti PIN</span>
                  </button>
                )}
              </div>

              {/* Form Body */}
              <div className="p-5">
                {settingsTab === 'NICKNAME' ? (
                  <form onSubmit={handleSaveNickname} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Nama Lengkap (Tetap Digunakan di Profil & Sidebar):
                      </label>
                      <p className="text-xs font-semibold text-stone-900 bg-stone-100 p-2.5 rounded-xl border border-stone-200">
                        {auth.name}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/90 text-amber-900 border border-amber-200/80 text-[11px] leading-relaxed">
                      💡 <strong>Catatan:</strong> Pilihan nama di bawah hanya tampil pada <strong>badge Navbar HP</strong> agar hemat ruang. Di dalam <strong>sidebar menu</strong> dan <strong>desktop</strong> tetap nama lengkap resmi Anda.
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                        Pilih Kata Nama untuk Badge Navbar HP:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(auth.name || '')
                          .split(' ')
                          .filter(Boolean)
                          .map((word, idx) => {
                            const isSelected =
                              nicknameInput.trim().toLowerCase() === word.trim().toLowerCase();
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setNicknameInput(word)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-[#8c4e24] text-white shadow-xs'
                                    : 'bg-stone-100 hover:bg-amber-100 text-stone-700 border border-stone-200'
                                }`}
                              >
                                {word}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Atau Ketik Nama Panggilan Kustom:
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value.replace(/\s+/g, ' '))}
                        placeholder="Contoh: Rizky"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24] font-bold text-stone-900"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Maksimal 15 karakter huruf/angka.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-600">
                        Pratinjau Badge Navbar:
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-200 text-amber-950 border border-amber-300 shadow-2xs">
                        {nicknameInput.trim() || 'Nama'}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowSettingsModal(false)}
                        className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#753e1f] active:scale-95 text-white text-xs font-bold shadow-md shadow-[#8c4e24]/20 transition-all"
                      >
                        Simpan Nama
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSavePin} className="space-y-3.5">
                    <p className="text-xs text-stone-600">
                      Atur PIN keamanan 6 digit angka untuk akun mahasiswa Anda.
                    </p>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        PIN Lama (Jika Pernah Dibuat):
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={oldPinInput}
                        onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="PIN 6 digit lama"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        PIN Baru (6 Digit Angka):
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="6 angka baru (contoh: 123456)"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Konfirmasi PIN Baru:
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ketik ulang 6 angka baru"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowSettingsModal(false)}
                        className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#753e1f] active:scale-95 text-white text-xs font-bold shadow-md shadow-[#8c4e24]/20 transition-all"
                      >
                        Simpan PIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </nav>
    </header>
  );
}

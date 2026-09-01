'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { appStore } from '@/lib/store';
import { AuthSession } from '@/lib/types';
import {
  BookOpen,
  Calendar,
  Layers,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  UserCheck,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasPjRole, setHasPjRole] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const currentAuth = appStore.getAuth();
      setAuth(currentAuth);

      if (currentAuth?.nim) {
        const courses = appStore.getCourses();
        const isPj = courses.some((c) =>
          c.pjNims.some((pNim) => pNim.trim() === currentAuth.nim?.trim())
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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9d5f2f] to-[#753e1f] text-white flex items-center justify-center shadow-md shadow-[#9d5f2f]/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
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
              11 Mata Kuliah
            </Link>
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
                {auth.name.split(' ')[0]}
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
              11 Mata Kuliah & Repositori
            </Link>
            <Link
              href="/#pengumuman"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-[#9d5f2f] text-sm font-medium"
            >
              Pengumuman Kelas
            </Link>
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
    </nav>
  );
}

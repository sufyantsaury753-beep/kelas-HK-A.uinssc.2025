import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  ShieldCheck,
  Phone,
  ArrowUpRight,
  BookOpen,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#140b05] text-stone-300 border-t border-[#8c4e24]/25 no-print mt-auto relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-radial from-[#8c4e24]/15 via-transparent to-transparent pointer-events-none blur-2xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Top Section: Brand & Quick Action Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 border-b border-white/[0.07]">
          {/* Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-900/90 border border-amber-500/30 p-1 shadow-lg shadow-amber-950/40 flex-shrink-0 flex items-center justify-center ring-1 ring-white/10">
              <img
                src="/logo.png"
                alt="Logo HK A 2025"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  HK A 2025
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  Syariah
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                Fakultas Syariah • UIN Siber Syekh Nurjati Cirebon
              </p>
            </div>
          </div>

          {/* Quick Action Badges (Helpdesk & Location) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://wa.me/6281214305925?text=Halo%20Admin%20HK%20A%202025,%20saya%20ingin%20bertanya:"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-amber-500/10 hover:border-amber-500/30 border border-white/10 text-xs text-stone-200 hover:text-amber-200 transition-all group"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Helpdesk: <strong className="font-mono text-white font-medium">+62 812-1430-5925</strong></span>
              <ArrowUpRight className="w-3 h-3 text-stone-500 group-hover:text-amber-300 transition-colors" />
            </a>

            <div className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-stone-400">
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              <span>Cirebon, Jawa Barat</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Clean Grid Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 py-10">
          {/* Col 1: Layanan Utama */}
          <div>
            <h4 className="text-[11px] font-bold text-amber-300/90 uppercase tracking-widest mb-3.5">
              Layanan Utama
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Beranda Utama</span>
                </Link>
              </li>
              <li>
                <Link href="/#jadwal" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Jadwal Kuliah Hari Ini</span>
                </Link>
              </li>
              <li>
                <Link href="/#matakuliah" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Mata Kuliah & Tugas</span>
                </Link>
              </li>
              <li>
                <Link href="/#pengumuman" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Informasi Kelas</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Portal Akses */}
          <div>
            <h4 className="text-[11px] font-bold text-amber-300/90 uppercase tracking-widest mb-3.5">
              Portal Akses
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link href="/mahasiswa" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Portal Presensi Mahasiswa</span>
                </Link>
              </li>
              <li>
                <Link href="/pj" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Portal PJ Mata Kuliah</span>
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Portal Administrator</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Masuk / Autentikasi</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Standar Sistem */}
          <div>
            <h4 className="text-[11px] font-bold text-amber-300/90 uppercase tracking-widest mb-3.5">
              Standar Sistem
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                <span>Whitelist NIM Mahasiswa</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                <span>PIN Mandiri 6 Digit</span>
              </li>
              <li className="flex items-center space-x-2">
                <Users className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                <span>Otoritas Sesi PJ Kelas</span>
              </li>
              <li className="flex items-center space-x-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                <span>Repositori Berkas Kuliah</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Lembaga / Afiliasi */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h4 className="text-[11px] font-bold text-amber-300/90 uppercase tracking-widest mb-3.5">
              Institusi
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Program Studi Hukum Keluarga, Fakultas Syariah, UIN Siber Syekh Nurjati Cirebon.
            </p>
            <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cyber Islamic University</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Clean Copyright & Status */}
        <div className="pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {currentYear} Hukum Keluarga A 2025. All rights reserved.</p>
          <div className="flex items-center space-x-2 text-[11px] text-stone-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Sistem Presensi & Repositori Digital Aktif</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

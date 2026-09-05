import React from 'react';
import Link from 'next/link';
import { GraduationCap, Heart, MapPin, Globe, Shield, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#3d1d07] text-amber-100/80 border-t border-[#592b0c] no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-stone-950 border border-amber-400/40 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Logo HK A 2025"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  HUKUM KELUARGA A (HK A) 2025
                </h3>
                <p className="text-xs text-amber-200/90 font-medium">
                  Fakultas Syariah • UIN Siber Syekh Nurjati Cirebon
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-100/70 leading-relaxed max-w-md">
              Sistem Informasi Akademik, Presensi Perkuliahan Digital Mahasiswa & Repositori
              Materi Terpadu Kelas Hukum Keluarga A Angkatan 2025.
            </p>
            <div className="flex items-center space-x-2 text-xs text-amber-200/80">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Jl. Perjuangan, Sunyaragi, Kec. Kesambi, Kota Cirebon, Jawa Barat 45132</span>
            </div>
            <div className="pt-1 flex items-center space-x-2 text-xs">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-black/25 text-amber-200 border border-amber-500/20">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Helpdesk Kelas: <strong className="font-mono text-white select-all">+62 812-1430-5925</strong></span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3.5">
              Tautan Layanan
            </h4>
            <ul className="space-y-2 text-xs text-amber-100/70">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link href="/#jadwal" className="hover:text-white transition-colors">
                  Jadwal Kuliah Hari Ini
                </Link>
              </li>
              <li>
                <Link href="/#matakuliah" className="hover:text-white transition-colors">
                  Mata Kuliah & Repositori
                </Link>
              </li>
              <li>
                <Link href="/mahasiswa" className="hover:text-white transition-colors">
                  Portal Mahasiswa (Presensi)
                </Link>
              </li>
              <li>
                <Link href="/pj" className="hover:text-white transition-colors">
                  Portal PJ Mata Kuliah
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Portal Administrator
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Informasi Sistem & Keamanan */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3.5">
              Standar Akademik
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/70">
              <li className="flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Sistem Whitelist Berbasis NIM</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Autentikasi PIN 6-Digit Mandiri</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Otoritas Khusus PJ Mata Kuliah</span>
              </li>
              <li className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Cyber Islamic University (CIU)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-6 border-t border-amber-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-200/60">
          <p>© {new Date().getFullYear()} Hukum Keluarga A 2025. UIN Siber Syekh Nurjati Cirebon.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Dikelola oleh Pengurus & Tim IT Kelas HK A</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

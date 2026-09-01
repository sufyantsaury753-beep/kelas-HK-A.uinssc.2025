import React from 'react';
import Link from 'next/link';
import { GraduationCap, Heart, MapPin, Globe, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-stone-950 border border-amber-500/40 p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center">
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
                <p className="text-xs text-stone-400 font-medium">
                  UIN Siber Syekh Nurjati Cirebon (Cyber Islamic University)
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-md">
              Portal digital terpadu mahasiswa Hukum Keluarga A angkatan 2025, Fakultas Syariah.
              Memfasilitasi sistem absensi berotentikasi, pembagian tugas 11 mata kuliah, serta repositori
              materi perkuliahan digital.
            </p>
            <div className="flex items-center space-x-2 text-xs text-stone-400">
              <MapPin className="w-4 h-4 text-[#9d5f2f]" />
              <span>Jl. Perjuangan, Sunyaragi, Kec. Kesambi, Kota Cirebon, Jawa Barat 45132</span>
            </div>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-200 mb-3.5">
              Tautan Portal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link href="/#jadwal" className="hover:text-amber-400 transition-colors">
                  Jadwal Kuliah Mingguan
                </Link>
              </li>
              <li>
                <Link href="/#matakuliah" className="hover:text-amber-400 transition-colors">
                  Daftar 11 Mata Kuliah
                </Link>
              </li>
              <li>
                <Link href="/mahasiswa" className="hover:text-amber-400 transition-colors">
                  Portal Mahasiswa (Presensi)
                </Link>
              </li>
              <li>
                <Link href="/pj" className="hover:text-amber-400 transition-colors">
                  Portal PJ Mata Kuliah
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition-colors">
                  Portal Admin Kelas
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Informasi Sistem & Keamanan */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-200 mb-3.5">
              Keamanan & Privasi
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9d5f2f]" />
                <span>Sistem Whitelist Berbasis NIM</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9d5f2f]" />
                <span>Autentikasi PIN 6-Digit Mandiri</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9d5f2f]" />
                <span>Isolasi Otoritas Antar-PJ Mata Kuliah</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-[#9d5f2f]" />
                <span>Eksklusif Mahasiswa HK A 2025</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Hukum Keluarga A 2025. UIN Siber Syekh Nurjati Cirebon.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Dikelola oleh Tim IT & Pengurus Kelas HK A</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

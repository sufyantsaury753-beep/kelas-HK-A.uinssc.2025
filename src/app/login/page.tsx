'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Lock,
  UserCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  HelpCircle,
  KeyRound,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Student } from '@/lib/types';
import PinSetupModal from '@/components/auth/PinSetupModal';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'MAHASISWA' | 'ADMIN'>('MAHASISWA');

  // Mahasiswa Login Form State
  const [nim, setNim] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // First time pin setup trigger
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);

  // Admin Login Form State
  const [adminUser, setAdminUser] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);



  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNim = nim.trim();
    if (!cleanNim) {
      setErrorMsg('Silakan masukkan NIM Anda.');
      return;
    }

    // Step 1: Whitelist Check
    const student = appStore.findStudentByNim(cleanNim);
    if (!student) {
      setErrorMsg(
        `NIM ${cleanNim} tidak terdaftar dalam Whitelist Kelas HK A 2025. Hanya mahasiswa resmi yang tercantum di berkas PDF/daftar kelas yang dapat masuk.`
      );
      return;
    }

    // Step 2: Check if First Login (No PIN set yet)
    if (!student.isPinSet || !student.pin) {
      setPendingStudent(student);
      return;
    }

    // Step 3: PIN Verification
    if (student.pin !== pin.trim()) {
      setErrorMsg('PIN keamanan yang Anda masukkan salah. Silakan coba lagi atau hubungi Admin untuk reset PIN.');
      return;
    }

    // Success: Log in
    const courses = appStore.getCourses();
    const cleanStudentNim = (student.nim || '').trim();
    const assignedCourses = (courses || [])
      .filter((c) => Array.isArray(c?.pjNims) && c.pjNims.some((pNim) => (pNim || '').trim() === cleanStudentNim))
      .map((c) => c.id);

    appStore.setAuth({
      role: assignedCourses.length > 0 ? 'PJ' : 'MAHASISWA',
      nim: student.nim,
      name: student.name || 'Mahasiswa HK A',
      assignedCourseIds: assignedCourses,
      isLoggedIn: true,
    });

    if (assignedCourses.length > 0) {
      router.push('/pj');
    } else {
      router.push('/mahasiswa');
    }
  };

  const handlePinCreated = (newPin: string) => {
    if (!pendingStudent) return;
    appStore.setStudentPin(pendingStudent.nim, newPin);

    // Now log in
    const courses = appStore.getCourses();
    const cleanPendingNim = (pendingStudent.nim || '').trim();
    const assignedCourses = (courses || [])
      .filter((c) => Array.isArray(c?.pjNims) && c.pjNims.some((pNim) => (pNim || '').trim() === cleanPendingNim))
      .map((c) => c.id);

    appStore.setAuth({
      role: assignedCourses.length > 0 ? 'PJ' : 'MAHASISWA',
      nim: pendingStudent.nim,
      name: pendingStudent.name || 'Mahasiswa HK A',
      assignedCourseIds: assignedCourses,
      isLoggedIn: true,
    });

    setPendingStudent(null);
    if (assignedCourses.length > 0) {
      router.push('/pj');
    } else {
      router.push('/mahasiswa');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validAdminPin = appStore.getAdminPin();
    const cleanUser = adminUser.trim().toLowerCase();

    if ((cleanUser === 'admin' || cleanUser === 'administrator') && adminPin === validAdminPin) {
      appStore.setAuth({
        role: 'ADMIN',
        name: 'Administrator Kelas HK A',
        isLoggedIn: true,
      });
      router.push('/admin');
    } else {
      setErrorMsg('Username atau Password Admin salah. (Default: admin / adminhk2025)');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      {/* First-time PIN setup modal */}
      {pendingStudent && (
        <PinSetupModal
          nim={pendingStudent.nim}
          studentName={pendingStudent.name}
          onSuccess={handlePinCreated}
          onCancel={() => setPendingStudent(null)}
        />
      )}

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-900/5 border border-stone-200/90 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#9d5f2f] via-[#8c4e24] to-[#753e1f] p-7 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-stone-950 p-1 flex items-center justify-center mb-3 shadow-lg border border-amber-400/50">
              <img
                src="/logo.png"
                alt="Logo HK A 2025"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Portal Masuk HK A 2025</h2>
            <p className="text-xs text-amber-100/90 mt-1 font-medium">
              UIN Siber Syekh Nurjati Cirebon — Fakultas Syariah
            </p>
          </div>
        </div>

        {/* Tab Switcher (Mahasiswa & PJ vs Admin) */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100/80 border-b border-stone-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('MAHASISWA');
              setErrorMsg(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'MAHASISWA'
                ? 'bg-white text-[#9d5f2f] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Mahasiswa & PJ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ADMIN');
              setErrorMsg(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'ADMIN'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-7">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {activeTab === 'MAHASISWA' ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Nomor Induk Mahasiswa (NIM)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 2530311086"
                  value={nim}
                  onChange={(e) => setNim(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 text-sm font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] bg-stone-50/50"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Sistem mengecek NIM terhadap Whitelist resmi 30 mahasiswa kelas HK A 2025.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    PIN Keamanan (6-Digit)
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                    Login perdana? Kosongkan
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Kosongkan jika login pertama kali"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 text-sm font-mono tracking-widest rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] bg-stone-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Jika Anda belum pernah membuat PIN, klik Masuk dan sistem akan membuka dialog pembuatan PIN perdana.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-[#9d5f2f]/25 transition-all flex items-center justify-center space-x-2 mt-2"
              >
                <span>Masuk ke Portal Presensi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Username Administrator
                </label>
                <input
                  type="text"
                  placeholder="admin"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 bg-stone-50/50 font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Password / PIN Master Admin
                </label>
                <div className="relative">
                  <input
                    type={showAdminPin ? 'text' : 'password'}
                    placeholder="Default: adminhk2025"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 bg-stone-50/50 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(!showAdminPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Default credentials: <code>admin</code> / <code>adminhk2025</code>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-black text-amber-300 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Masuk sebagai Administrator</span>
              </button>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAdminUser('admin');
                    setAdminPin('adminhk2025');
                  }}
                  className="text-[11px] text-stone-500 hover:text-stone-900 underline"
                >
                  Isi otomatis kredensial default admin
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info note */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <Link href="/" className="text-[#9d5f2f] hover:underline font-semibold flex items-center space-x-1">
            <span>← Kembali ke Beranda</span>
          </Link>
          <span className="font-mono text-[10px]">HK A 2025 • UIN SSC</span>
        </div>
      </div>
    </div>
  );
}

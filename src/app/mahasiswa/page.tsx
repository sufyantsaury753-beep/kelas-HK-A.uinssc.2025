'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderDown,
  Sparkles,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AttendanceSession, AttendanceRecord, Student, AuthSession } from '@/lib/types';
import { AttendanceBadge } from '@/components/common/Badge';
import confetti from 'canvas-confetti';

export default function MahasiswaDashboard() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Self check-in state
  const [activeCheckinCode, setActiveCheckinCode] = useState('');
  const [checkinMsg, setCheckinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Expanded course row for meeting details
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Change PIN modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const init = () => {
      const currentAuth = appStore.getAuth();
      if (!currentAuth || (!currentAuth.nim && currentAuth.role !== 'ADMIN')) {
        router.push('/login');
        return;
      }
      setAuth(currentAuth);

      if (currentAuth.nim) {
        const s = appStore.findStudentByNim(currentAuth.nim);
        setStudent(s || null);
      }

      setCourses(appStore.getCourses());
      setSessions(appStore.getSessions());
      setRecords(appStore.getRecords());
    };

    init();
    const unsub = appStore.subscribe(init);
    return () => unsub();
  }, [router]);

  if (!auth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#9d5f2f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Active sessions open for self checkin
  const openSessions = sessions.filter((s) => s.isOpenForSelfCheckin);

  // Student assigned PJ courses
  const studentNim = auth.nim || '';
  const myPjCourses = courses.filter((c) =>
    c.pjNims.some((pNim) => pNim.trim() === studentNim.trim())
  );

  // Calculate student attendance statistics
  const myRecords = records.filter((r) => r.studentNim.trim() === studentNim.trim());
  const myHadir = myRecords.filter((r) => r.status === 'HADIR').length;
  const myIzin = myRecords.filter((r) => r.status === 'IZIN').length;
  const mySakit = myRecords.filter((r) => r.status === 'SAKIT').length;
  const myAlpa = myRecords.filter((r) => r.status === 'ALPA').length;
  const totalRecorded = myRecords.length;
  const overallPercentage = totalRecorded > 0 ? ((myHadir / totalRecorded) * 100).toFixed(0) : '100';

  const handleSelfCheckin = (session: AttendanceSession) => {
    setCheckinMsg(null);
    if (!studentNim) return;

    // If session has code
    if (session.checkinCode && activeCheckinCode.trim() !== session.checkinCode.trim()) {
      setCheckinMsg({
        type: 'error',
        text: 'Kode presensi salah. Silakan tanyakan kode presensi kepada PJ mata kuliah.',
      });
      return;
    }

    appStore.setAttendanceRecord(
      session.id,
      session.courseId,
      studentNim,
      'HADIR',
      'MANDIRI',
      'Presensi Mandiri via Portal'
    );

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#9d5f2f', '#d97706', '#10b981'],
      });
    } catch {}

    setCheckinMsg({
      type: 'success',
      text: `Presensi Pertemuan ke-${session.meetingNumber} Berhasil Tercatat!`,
    });
    setActiveCheckinCode('');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);
    if (!student) return;

    if (student.pin && oldPin.trim() !== student.pin.trim()) {
      setPinChangeMsg({ type: 'error', text: 'PIN lama yang Anda masukkan salah.' });
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      setPinChangeMsg({ type: 'error', text: 'PIN baru harus terdiri dari 6 digit angka.' });
      return;
    }

    appStore.setStudentPin(student.nim, newPin);
    setPinChangeMsg({ type: 'success', text: 'PIN keamanan berhasil diperbarui!' });
    setOldPin('');
    setNewPin('');
    setTimeout(() => {
      setShowPinModal(false);
      setPinChangeMsg(null);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Header Banner */}
      <div className="bg-gradient-to-r from-[#9d5f2f] via-[#8c4e24] to-[#753e1f] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#9d5f2f]/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-stone-950 p-1 flex items-center justify-center border border-amber-400/50 shadow-xl flex-shrink-0">
              <img
                src="/logo.png"
                alt="Logo HK A 2025"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-amber-100">
                  Mahasiswa Aktif HK A 2025
                </span>
                <span className="text-xs font-mono bg-amber-900/50 px-2 py-0.5 rounded border border-amber-400/30">
                  NIM: {studentNim}
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-white mt-1">
                {auth.name}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/85 mt-0.5">
                Program Studi Hukum Keluarga (Ahwal Syakhshiyyah) — UIN Siber Syekh Nurjati Cirebon
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPinModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all flex items-center space-x-1.5"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Ganti PIN</span>
            </button>
            {myPjCourses.length > 0 && (
              <Link
                href="/pj"
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Portal PJ ({myPjCourses.length} MK)</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* PJ Banner if assigned */}
      {myPjCourses.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Anda Ditugaskan Sebagai Penanggung Jawab (PJ)
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Mata kuliah yang Anda ampu:{' '}
                <strong>{myPjCourses.map((c) => c.name).join(', ')}</strong>.
                Anda berhak membuka sesi absensi, mencatat kehadiran rekan kelas, dan mengunduh rekapitulasi.
              </p>
            </div>
          </div>
          <Link
            href="/pj"
            className="px-4 py-2 bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1 flex-shrink-0"
          >
            <span>Buka Dashboard PJ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Active Check-in Alert Section (If any session is open) */}
      {openSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-base font-bold text-stone-900">
              Sesi Presensi Mandiri Sedang Dibuka ({openSessions.length})
            </h2>
          </div>

          {checkinMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                checkinMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {checkinMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              )}
              <span>{checkinMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openSessions.map((sess) => {
              const crs = courses.find((c) => c.id === sess.courseId);
              const alreadyChecked = records.find(
                (r) => r.sessionId === sess.id && r.studentNim.trim() === studentNim.trim()
              );

              return (
                <div
                  key={sess.id}
                  className="bg-white border-2 border-emerald-500/60 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Pertemuan Ke-{sess.meetingNumber} • Aktif Sekarang
                      </span>
                      <h3 className="font-bold text-base text-stone-900 mt-1.5">{crs?.name}</h3>
                      <p className="text-xs text-stone-500">{crs?.dosen}</p>
                    </div>
                    {alreadyChecked && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sudah Hadir</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1">
                    <p>
                      <strong>Topik:</strong> {sess.topic}
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      Waktu Sesi: {sess.date} ({sess.startTime} - {sess.endTime} WIB)
                    </p>
                  </div>

                  {alreadyChecked ? (
                    <div className="text-center py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl">
                      Status Kehadiran Anda Telah Diverifikasi ({alreadyChecked.status})
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sess.checkinCode && (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Masukkan Kode Presensi dari PJ:
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Kode 4 angka"
                            value={activeCheckinCode}
                            onChange={(e) => setActiveCheckinCode(e.target.value)}
                            className="w-full px-3 py-2 text-center font-mono text-sm tracking-widest rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => handleSelfCheckin(sess)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Kirim Presensi Hadir Sekarang</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-400 uppercase">Tingkat Kehadiran</p>
          <p className="text-2xl font-black text-[#9d5f2f] mt-1">{overallPercentage}%</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Dari total sesi perkuliahan</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-400 uppercase">Hadir</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{myHadir} Sesi</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Tervalidasi di kelas</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-400 uppercase">Izin / Sakit</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{myIzin + mySakit} Sesi</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Dengan konfirmasi</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-400 uppercase">Alpa</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{myAlpa} Sesi</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Tanpa keterangan</p>
        </div>
      </div>

      {/* 11 Courses Detailed Attendance List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#9d5f2f]" />
              <span>Rekapitulasi Kehadiran 11 Mata Kuliah</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Klik pada mata kuliah untuk melihat rincian kehadiran tiap pertemuan (Pertemuan 1 - 16).
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
            Total: 11 Mata Kuliah
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {courses.map((c) => {
            const courseSessions = sessions
              .filter((s) => s.courseId === c.id)
              .sort((a, b) => a.meetingNumber - b.meetingNumber);

            const courseRecords = myRecords.filter((r) => r.courseId === c.id);
            const isExpanded = expandedCourseId === c.id;

            // Stats for this course
            const cHadir = courseRecords.filter((r) => r.status === 'HADIR').length;
            const cIzin = courseRecords.filter((r) => r.status === 'IZIN').length;
            const cSakit = courseRecords.filter((r) => r.status === 'SAKIT').length;
            const cAlpa = courseRecords.filter((r) => r.status === 'ALPA').length;

            return (
              <div key={c.id} className="transition-colors">
                <div
                  onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-amber-50/30 transition-colors"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#9d5f2f] flex items-center justify-center font-bold font-mono text-xs flex-shrink-0 mt-0.5">
                      {c.code.split('-')[1] || c.code}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm sm:text-base font-bold text-stone-900">{c.name}</h3>
                        <span className="text-[11px] font-semibold text-stone-500 font-mono">
                          ({c.sks} SKS)
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">{c.dosen}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Jadwal: {c.day}, {c.time} • {c.room}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="text-right text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-700 font-semibold">{cHadir} Hadir</span>
                        {cIzin > 0 && <span className="text-blue-700 font-medium">• {cIzin} Izin</span>}
                        {cSakit > 0 && <span className="text-amber-700 font-medium">• {cSakit} Sakit</span>}
                        {cAlpa > 0 && <span className="text-rose-700 font-medium">• {cAlpa} Alpa</span>}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {courseSessions.length} Pertemuan Dilaksanakan
                      </p>
                    </div>

                    <div className="p-1.5 rounded-lg bg-stone-100 text-stone-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Meeting Sessions Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 bg-stone-50/70 border-t border-stone-100 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-bold text-stone-700 uppercase tracking-wider text-[11px]">
                        Rincian Pertemuan & Riwayat Presensi
                      </span>
                      {c.driveLink && (
                        <a
                          href={c.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#9d5f2f] hover:underline flex items-center space-x-1 font-semibold"
                        >
                          <span>Buka Drive Materi</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {courseSessions.length === 0 ? (
                      <p className="text-xs text-stone-500 py-3 italic">
                        Belum ada sesi presensi yang dibuat oleh PJ untuk mata kuliah ini.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courseSessions.map((sess) => {
                          const r = courseRecords.find((rec) => rec.sessionId === sess.id);
                          const stt = r ? r.status : 'ALPA';

                          return (
                            <div
                              key={sess.id}
                              className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-stone-900">
                                    Pertemuan Ke-{sess.meetingNumber}
                                  </span>
                                  <span className="text-stone-400 font-mono text-[11px]">
                                    ({sess.date} • {sess.startTime} WIB)
                                  </span>
                                </div>
                                <p className="text-stone-600 text-[11px] mt-0.5">
                                  Materi: <em>&quot;{sess.topic}&quot;</em>
                                </p>
                              </div>

                              <div className="flex items-center space-x-3">
                                <AttendanceBadge status={stt} />
                                {r?.notes && (
                                  <span className="text-[11px] text-stone-400 italic">
                                    {r.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Change PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">Ganti PIN Keamanan</h3>
            <p className="text-xs text-stone-500 mb-4">
              Perbarui 6-digit PIN keamanan untuk akun {student?.name}.
            </p>

            {pinChangeMsg && (
              <div
                className={`p-3 rounded-xl text-xs mb-3 flex items-center space-x-2 ${
                  pinChangeMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{pinChangeMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePin} className="space-y-3 text-xs">
              {student?.isPinSet && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">PIN Saat Ini</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 text-center font-mono tracking-widest rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f]"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">PIN Baru (6-Digit)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 654321"
                  className="w-full px-3 py-2 text-center font-mono tracking-widest rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 py-2 border border-stone-300 rounded-xl hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

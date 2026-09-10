'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Video as VideoIcon,
  VideoOff,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Clock,
  MapPin,
  User,
  Edit3,
  Save,
  X,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession } from '@/lib/types';
import {
  detectMeetingPlatform,
  getStudentInviteMessage,
} from '@/lib/meetUtils';

function CourseMeetingGatewayContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Link edit state for PJ / Admin
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  // Load course and auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }

    const loadData = () => {
      const allCourses = appStore.getCourses();
      const target = allCourses.find((c) => c.id === courseId) || null;
      setCourse(target);
      if (target) {
        setEditUrl(target.meetingUrl || '');
      }
      setAuth(appStore.getAuth());
      setLoading(false);
    };

    loadData();
    const unsubscribe = appStore.subscribe(loadData);
    return () => unsubscribe();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400 font-medium">Memuat ruang perkuliahan...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Mata Kuliah Tidak Ditemukan</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Data mata kuliah dengan ID ini tidak tersedia di dalam basis data semester.
          </p>
          <div className="pt-2">
            <Link
              href="/kuliah-online"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Kuliah Online</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const meetInfo = detectMeetingPlatform(course.meetingUrl);
  const hasLink = Boolean(course.meetingUrl && course.meetingUrl.trim());

  // Check if current user is Admin or PJ for this course
  const isUserAdmin = auth?.role === 'ADMIN';
  const isUserPj =
    isUserAdmin ||
    (Array.isArray(course.pjNims) &&
      course.pjNims.some((p) => p.trim() === (auth?.nim || '').trim()));

  const handleCopyLink = () => {
    if (!course.meetingUrl) return;
    navigator.clipboard.writeText(course.meetingUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleSaveLink = async () => {
    setIsSaving(true);
    try {
      await appStore.setCourseMeetingUrl(course.id, editUrl.trim() || undefined);
      setIsEditing(false);
    } catch (e) {
      alert('Gagal menyimpan link kuliah. Silakan coba kembali.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = getStudentInviteMessage(course, baseUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#190c04] via-[#241005] to-[#0d0502] text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none blur-3xl" />

      <div className="w-full max-w-xl bg-stone-900/90 border border-stone-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-white/5">
          <Link
            href="/"
            className="hover:text-amber-300 transition-colors flex items-center space-x-1.5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Beranda</span>
          </Link>
          <Link
            href="/kuliah-online"
            className="hover:text-amber-300 transition-colors font-medium"
          >
            Semua Kuliah Online (11 MK) →
          </Link>
        </div>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15">
            {course.code}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/30 font-semibold">
            {course.sks} SKS • Semester {course.semester}
          </span>
          {hasLink && (
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold border flex items-center space-x-1.5 ${
                meetInfo.platform === 'gmeet'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : meetInfo.platform === 'zoom'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>{meetInfo.label}</span>
            </span>
          )}
        </div>

        {/* Course Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            {course.name}
          </h1>
          <div className="flex items-center justify-center space-x-1.5 text-xs sm:text-sm text-stone-300">
            <User className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Dosen Pengampu: <strong className="text-white">{course.dosen}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-stone-400 pt-0.5">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>
                {course.day ? `${course.day}, ` : ''}
                {course.time}
              </span>
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>Ruang {course.room}</span>
            </span>
          </div>
        </div>

        {/* Link Editing Panel for PJ / Admin */}
        {isEditing ? (
          <div className="p-5 rounded-2xl bg-stone-950 border border-amber-500/40 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Edit3 className="w-4 h-4" />
                <span>Atur Tautan Kuliah Online (PJ / Admin)</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditUrl(course.meetingUrl || '');
                  setIsEditing(false);
                }}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Tempel link Google Meet (<code className="text-emerald-300">https://meet.google.com/...</code>)
              atau Zoom (<code className="text-blue-300">https://zoom.us/...</code>). Link akan tersimpan dan otomatis mengaktifkan tombol di beranda!
            </p>

            <div className="space-y-2">
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij atau https://zoom.us/j/..."
                className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                {editUrl && (
                  <button
                    type="button"
                    onClick={() => setEditUrl('')}
                    className="text-rose-400 hover:text-rose-300 text-xs font-medium px-2 py-1"
                  >
                    Kosongkan Link
                  </button>
                )}
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLink}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Tautan'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main State Box */}
        {!isEditing && (
          <>
            {hasLink ? (
              /* State 1: Link Available (Active Emerald / Blue Box) */
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-stone-900 to-stone-900 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                        meetInfo.platform === 'zoom'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      <VideoIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        Tautan Kuliah Aktif
                      </span>
                      <span className="text-sm font-bold text-white">
                        Platform: {meetInfo.label}
                      </span>
                    </div>
                  </div>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Tautan resmi perkuliahan telah disematkan oleh Penanggung Jawab (PJ) / Dosen. Klik tombol di bawah untuk langsung membuka ruang tatap muka.
                </p>

                {/* Big Action Button */}
                <div className="space-y-2.5 pt-1">
                  <a
                    href={course.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3.5 px-5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-98 ${
                      meetInfo.platform === 'zoom'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-950/60'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-950/60'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{meetInfo.actionText} Sekarang</span>
                  </a>

                  {/* Secondary Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold border border-white/10 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/20 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kirim ke WA</span>
                    </button>
                  </div>
                </div>

                {/* Edit link trigger for PJ / Admin */}
                {isUserPj && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-stone-400">Opsi PJ / Admin:</span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Ubah atau Ganti Link</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* State 2: Link Missing (Gray Disabled Box) */
              <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-stone-800 text-stone-500 mx-auto flex items-center justify-center shadow-inner">
                  <VideoOff className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-200">
                    Tautan Kuliah Belum Disematkan
                  </h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                    Penanggung Jawab (PJ) Mata Kuliah atau Dosen belum memasukkan link Google Meet / Zoom. Tombol perkuliahan di beranda saat ini berwarna <strong>abu-abu</strong> (tidak aktif).
                  </p>
                </div>

                {/* Disabled Gray Button Simulation */}
                <div className="pt-1">
                  <div className="w-full py-3 px-4 rounded-xl bg-stone-800/80 text-stone-500 font-bold text-xs flex items-center justify-center space-x-2 cursor-not-allowed border border-stone-700/50">
                    <VideoOff className="w-4 h-4" />
                    <span>Tombol Tidak Aktif (Belum Ada Link)</span>
                  </div>
                </div>

                {/* Action for PJ / Admin to inject link right now */}
                {isUserPj ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                        <span>⭐ Anda adalah PJ / Admin</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#8c4e24] hover:bg-[#723f1c] text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sematkan Link Sekarang</span>
                      </button>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Sematkan link Google Meet atau Zoom sekarang agar tombol perkuliahan berubah menjadi hijau dan mahasiswa dapat langsung bergabung.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    Silakan hubungi PJ kelas atau pantau pengumuman grup WhatsApp untuk tautan terbaru.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-2">
          <span className="text-center sm:text-left">
            Portal Kelas Hukum Keluarga A 2025 • UIN Siber Syekh Nurjati
          </span>
          <Link
            href="/pj"
            className="text-amber-400/80 hover:text-amber-300 font-medium transition-colors"
          >
            Portal PJ Kuliah →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CourseMeetingGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center p-6">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CourseMeetingGatewayContent />
    </Suspense>
  );
}

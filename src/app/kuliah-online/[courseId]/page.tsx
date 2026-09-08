'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Lock,
  AlertCircle,
  Users,
  Info,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession } from '@/lib/types';
import {
  verifyLecturerToken,
  getCourseRoomName,
  getLecturerInviteMessage,
  getStudentInviteMessage,
  generateLecturerToken,
} from '@/lib/meetUtils';

// Global declaration for Jitsi External API
declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

function MeetingRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = params?.courseId as string;
  const roleParam = searchParams.get('role');
  const tokenParam = searchParams.get('token');

  const [course, setCourse] = useState<Course | null>(null);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [isLecturer, setIsLecturer] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoadingMeet, setIsLoadingMeet] = useState(true);
  const [copiedType, setCopiedType] = useState<'dosen' | 'mhs' | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  // Initialize environment base url
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Load course and evaluate auth
  useEffect(() => {
    const allCourses = appStore.getCourses();
    const targetCourse = allCourses.find((c) => c.id === courseId) || null;
    setCourse(targetCourse);

    const currentAuth = appStore.getAuth();
    setAuth(currentAuth);

    if (!targetCourse) {
      setIsAuthorized(false);
      setIsLoadingMeet(false);
      return;
    }

    // Check if user is Lecturer via secure token
    if (roleParam === 'dosen' && tokenParam) {
      const isValidLecturer = verifyLecturerToken(targetCourse.id, targetCourse.code, tokenParam);
      if (isValidLecturer) {
        setIsLecturer(true);
        setIsAuthorized(true);
        return;
      }
    }

    // Otherwise, check student login session
    if (currentAuth) {
      setIsLecturer(false);
      setIsAuthorized(true);
    } else {
      setIsLecturer(false);
      setIsAuthorized(false);
      setIsLoadingMeet(false);
    }
  }, [courseId, roleParam, tokenParam]);

  // Load Jitsi Meet script and mount meeting once authorized
  useEffect(() => {
    if (!isAuthorized || !course || !jitsiContainerRef.current) return;

    let isMounted = true;

    const initJitsiMeeting = () => {
      if (!isMounted || !jitsiContainerRef.current) return;

      // Clean up existing instance if any
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {}
      }

      const domain = 'meet.jit.si';
      const roomName = getCourseRoomName(course.id);

      const displayName = isLecturer
        ? `${course.dosen} (Dosen Pengampu)`
        : `${auth?.name || 'Mahasiswa'} (${auth?.nim || 'HK A'})`;

      const email = isLecturer
        ? 'dosen.hka2025@uinsiber.ac.id'
        : `${auth?.nim || 'mahasiswa'}@uinsiber.ac.id`;

      const options = {
        roomName: roomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: displayName,
          email: email,
        },
        configOverwrite: {
          startWithAudioMuted: !isLecturer,
          startWithVideoMuted: false,
          prejoinPageEnabled: false, // Instant join without waiting room
          disableDeepLinking: true, // Crucial for mobile browser compatibility
          enableWelcomePage: false,
          enableClosePage: false,
          disableInviteFunctions: true, // We use our own customized course invite links
          defaultRemoteDisplayName: 'Peserta HK A',
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Peserta Kuliah',
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'desktop',
            'chat',
            'raisehand',
            'tileview',
            'fullscreen',
            'settings',
            'videoquality',
            'hangup',
            'filmstrip',
            'videobackgroundblur',
          ],
        },
      };

      try {
        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        api.addEventListener('videoConferenceJoined', () => {
          if (isMounted) setIsLoadingMeet(false);
        });

        // Fallback to hide loader after 3.5s
        setTimeout(() => {
          if (isMounted) setIsLoadingMeet(false);
        }, 3500);
      } catch (err) {
        console.error('Failed to initialize Jitsi Meet:', err);
        if (isMounted) setIsLoadingMeet(false);
      }
    };

    // Dynamically inject external Jitsi script if not yet available
    if (window.JitsiMeetExternalAPI) {
      initJitsiMeeting();
    } else {
      const existingScript = document.getElementById('jitsi-external-api-script');
      if (existingScript) {
        existingScript.addEventListener('load', initJitsiMeeting);
      } else {
        const script = document.createElement('script');
        script.id = 'jitsi-external-api-script';
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
          initJitsiMeeting();
        };
        script.onerror = () => {
          console.error('Gagal memuat Jitsi External API script.');
          if (isMounted) setIsLoadingMeet(false);
        };
        document.body.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        } catch {}
      }
    };
  }, [isAuthorized, course, isLecturer, auth]);

  const handleCopyLecturerLink = () => {
    if (!course) return;
    const msg = getLecturerInviteMessage(course, baseUrl);
    navigator.clipboard.writeText(msg);
    setCopiedType('dosen');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyStudentLink = () => {
    if (!course) return;
    const msg = getStudentInviteMessage(course, baseUrl);
    navigator.clipboard.writeText(msg);
    setCopiedType('mhs');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleShareWhatsAppLecturer = () => {
    if (!course) return;
    const msg = getLecturerInviteMessage(course, baseUrl);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareWhatsAppStudent = () => {
    if (!course) return;
    const msg = getStudentInviteMessage(course, baseUrl);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // State: Course not found
  if (course === null && isAuthorized === false) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-stone-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Mata Kuliah Tidak Ditemukan</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Kode atau ID mata kuliah yang Anda tuju tidak terdaftar pada sistem HK A 2025.
          </p>
          <Link
            href="/kuliah-online"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#8c4e24] text-white text-xs font-bold hover:bg-[#723f1c] transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Kuliah Online</span>
          </Link>
        </div>
      </div>
    );
  }

  // State: Access restricted (Not logged in and not lecturer)
  if (isAuthorized === false && course) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-[#8c4e24] flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-[#8c4e24] border border-amber-200">
              Akses Terproteksi Mahasiswa & Dosen
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              Ruang Kuliah Online: {course.name}
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
              Ruang tatap muka virtual ini khusus untuk mahasiswa kelas Hukum Keluarga A 2025 dan Dosen Pengampu ({course.dosen}).
            </p>
          </div>

          {/* Lecturer Note */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-[#8c4e24] font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Untuk Bapak/Ibu Dosen Pengampu:</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Bapak/Ibu Dosen dapat langsung masuk tanpa login dengan mengklik tautan khusus undangan dosen yang dikirimkan oleh PJ Mata Kuliah via WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/login?redirect=/kuliah-online/${course.id}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#8c4e24] to-[#723f1c] text-white font-bold text-xs shadow-lg shadow-[#8c4e24]/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Login Akun Mahasiswa HK A</span>
            </Link>
            <Link
              href="/kuliah-online"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-100 text-stone-700 font-semibold text-xs hover:bg-stone-200 transition-all text-center"
            >
              Daftar Mata Kuliah
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while checking auth
  if (isAuthorized === null || !course) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 space-y-3">
        <div className="w-10 h-10 border-3 border-[#8c4e24] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Menyiapkan ruang tatap muka virtual...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs & Status Tag */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Link
              href="/kuliah-online"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-stone-500 hover:text-[#8c4e24] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Semua Ruang Kuliah</span>
            </Link>
            <span className="text-stone-300">•</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              {course.code} • {course.sks} SKS
            </span>
            <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Bebas Batas Waktu</span>
            </span>
          </div>

          <h1 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>{course.name}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 mt-1">
            <span className="flex items-center space-x-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#8c4e24]" />
              <span>Dosen: <strong className="text-stone-900">{course.dosen}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8c4e24]" />
              <span>{course.day}, {course.time}</span>
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lecturer Mode Status Badge */}
          {isLecturer ? (
            <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400 text-[#8c4e24] font-bold text-xs flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Mode Dosen Pengampu Terhubung</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-2xl bg-stone-100 text-stone-700 text-xs font-semibold flex items-center space-x-1.5 border border-stone-200">
              <User className="w-3.5 h-3.5 text-[#8c4e24]" />
              <span>Masuk sebagai: <strong>{auth?.name?.split(' ')[0]}</strong></span>
            </div>
          )}

          {/* Button: Share Invite */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8c4e24] border border-amber-200/90 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-2xs active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan Tautan</span>
          </button>

          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
          >
            Beranda
          </Link>
        </div>
      </div>

      {/* Lecturer Greeting Banner if Lecturer */}
      {isLecturer && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/90 text-[#8c4e24] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#8c4e24] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-stone-900">
                Selamat Datang, Bapak/Ibu {course.dosen}!
              </p>
              <p className="text-[11px] text-stone-600">
                Anda otomatis terhubung ke ruang kuliah {course.name} tanpa perlu login. Seluruh mahasiswa kelas HK A 2025 dapat melihat dan menyimak kuliah Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Conference Container Card */}
      <div className="bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl relative min-h-[580px] sm:min-h-[660px] flex flex-col">
        {/* Loading overlay while Jitsi initializes */}
        {isLoadingMeet && (
          <div className="absolute inset-0 z-20 bg-stone-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
            <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-amber-200">Menghubungkan Ruang Tatap Muka...</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Ruang Perkuliahan {course.name} HK A 2025
              </p>
            </div>
          </div>
        )}

        {/* Jitsi Meeting Mount Node */}
        <div ref={jitsiContainerRef} className="w-full flex-1 min-h-[580px] sm:min-h-[660px]" />
      </div>

      {/* Quick Help & Mobile Tips Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-stone-600 gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-[#8c4e24] flex-shrink-0" />
          <span>
            <strong>Tips Pengguna Mobile:</strong> Video conference berjalan langsung di browser tanpa perlu install aplikasi. Aktifkan izin mikrofon & kamera saat diminta browser.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-stone-500 font-medium">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Server WebRTC Stabil</span>
          </span>
        </div>
      </div>

      {/* Modal: Share Invite Links */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Bagikan Tautan Ruang Kuliah</h3>
                  <p className="text-[10px] text-stone-400">{course.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
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
                Tautan ini memiliki token aman sehingga <strong>{course.dosen}</strong> otomatis bergabung sebagai Dosen Pengampu tanpa perlu membuat akun.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyLecturerLink}
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
                  onClick={handleShareWhatsAppLecturer}
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
                  Perlu Login
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Kirim pengumuman ruang kuliah ke grup WhatsApp kelas HK A 2025. Mahasiswa wajib login akun mereka.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyStudentLink}
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
                  onClick={handleShareWhatsAppStudent}
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
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeetingRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 space-y-3">
          <div className="w-10 h-10 border-3 border-[#8c4e24] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Memuat ruang kuliah online...</p>
        </div>
      }
    >
      <MeetingRoomContent />
    </Suspense>
  );
}

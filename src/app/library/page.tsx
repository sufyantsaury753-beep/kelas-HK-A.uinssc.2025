'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Library,
  GraduationCap,
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  FileText,
  Presentation,
  FileCode,
  Folder,
  FolderOpen,
  Calendar,
  Users,
  Share2,
  Download,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  X,
  FileCheck,
  CheckCircle2,
  Info,
  Layers,
  Eye,
  ScrollText,
  Scale,
  Briefcase,
  PieChart,
  Globe,
  HeartHandshake,
  Gavel,
  MapPin,
  BookMarked,
  ShieldAlert,
  Landmark,
  Languages,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession, LibraryItem, LibraryCategory } from '@/lib/types';

// Map academic icons for courses
function getCourseIcon(courseId: string, courseName: string) {
  const lower = (courseId + ' ' + courseName).toLowerCase();
  if (lower.includes('tafsir')) return BookOpen;
  if (lower.includes('tarikh') || lower.includes('tasyri')) return ScrollText;
  if (lower.includes('qowaid') || lower.includes('fiqhiyah')) return Scale;
  if (lower.includes('bisnis')) return Briefcase;
  if (lower.includes('kewarisan') || lower.includes('waris')) return PieChart;
  if (lower.includes('internasional')) return Globe;
  if (lower.includes('perkawinan')) return HeartHandshake;
  if (lower.includes('ibadah')) return Sparkles;
  if (lower.includes('perdata')) return Gavel;
  if (lower.includes('agraria')) return MapPin;
  if (lower.includes('hadits')) return BookMarked;
  if (lower.includes('pidana')) return ShieldAlert;
  if (lower.includes('acara') || lower.includes('sidang') || lower.includes('peradilan')) return Gavel;
  if (lower.includes('skripsi') || lower.includes('seminar') || lower.includes('komprehensif')) return GraduationCap;
  if (lower.includes('zakat') || lower.includes('wakaf')) return Landmark;
  if (lower.includes('bahasa') || lower.includes('arab') || lower.includes('inggris')) return Languages;
  return BookOpen;
}

// Helper to convert Google Drive / Docs view links to direct download links
function getDownloadUrl(url: string): string {
  if (!url) return '';
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  const docsMatch = url.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch && docsMatch[1] && docsMatch[2]) {
    if (docsMatch[1] === 'document') {
      return `https://docs.google.com/document/d/${docsMatch[2]}/export?format=pdf`;
    }
    if (docsMatch[1] === 'presentation') {
      return `https://docs.google.com/presentation/d/${docsMatch[2]}/export/pdf`;
    }
  }
  return url;
}

// Category metadata matching the website theme
const CATEGORY_CONFIG: Record<
  LibraryCategory,
  { label: string; icon: any; badgeBg: string; border: string; text: string }
> = {
  MAKALAH: {
    label: 'Makalah',
    icon: FileText,
    badgeBg: 'bg-amber-100/70 text-amber-900',
    border: 'border-amber-300',
    text: 'text-amber-900',
  },
  ARTIKEL: {
    label: 'Artikel Ilmiah',
    icon: FileCode,
    badgeBg: 'bg-stone-100 text-stone-800',
    border: 'border-stone-300',
    text: 'text-stone-800',
  },
  PPT: {
    label: 'Slide PPT',
    icon: Presentation,
    badgeBg: 'bg-amber-200/70 text-[#723f1c]',
    border: 'border-amber-400',
    text: 'text-[#723f1c]',
  },
  RESUME: {
    label: 'Resume Materi',
    icon: FileCheck,
    badgeBg: 'bg-orange-100/70 text-orange-900',
    border: 'border-orange-300',
    text: 'text-orange-900',
  },
  TUGAS: {
    label: 'Tugas Proyek',
    icon: CheckCircle2,
    badgeBg: 'bg-stone-200/70 text-stone-800',
    border: 'border-stone-300',
    text: 'text-stone-800',
  },
  MODUL: {
    label: 'Modul & Buku',
    icon: BookOpen,
    badgeBg: 'bg-amber-50 text-[#8c4e24]',
    border: 'border-amber-300',
    text: 'text-[#8c4e24]',
  },
  RPS: {
    label: 'RPS & Silabus',
    icon: Info,
    badgeBg: 'bg-stone-100 text-stone-700',
    border: 'border-stone-300',
    text: 'text-stone-700',
  },
};

export default function LibraryPage() {
  const router = useRouter();

  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [activeSemester, setActiveSemester] = useState<number>(3);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSemester, setUploadSemester] = useState<number>(3);
  const [uploadCourseId, setUploadCourseId] = useState<string>('');
  const [uploadCustomCourse, setUploadCustomCourse] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<LibraryCategory>('MAKALAH');
  const [uploadAuthors, setUploadAuthors] = useState<string>('');
  const [uploadFileUrl, setUploadFileUrl] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [showDriveGuide, setShowDriveGuide] = useState(false);

  // Interaction feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const init = () => {
      const currentAuth = appStore.getAuth();
      setAuth(currentAuth);
      const allCourses = appStore.getCourses();
      setCourses(allCourses);
      const currentActiveSem = appStore.getActiveSemester() || 3;
      setActiveSemester(currentActiveSem);
      setLibraryItems(appStore.getLibraryItems());
    };

    init();
    const unsub = appStore.subscribe(init);
    return () => unsub();
  }, []);

  // When changing semester, reset selected course to ALL
  const handleSelectSemester = (sem: number) => {
    setSelectedSemester(sem);
    setSelectedCourseId('ALL');
  };

  // Pre-fill course when opening upload modal
  const handleOpenUpload = (targetCourseId?: string, targetSem?: number) => {
    const sem = targetSem || selectedSemester;
    setUploadSemester(sem);
    if (targetCourseId && targetCourseId !== 'ALL') {
      setUploadCourseId(targetCourseId);
    } else {
      const semCourses = courses.filter((c) => Number(c.semester) === Number(sem));
      setUploadCourseId(semCourses[0]?.id || 'custom');
    }
    setUploadCategory('MAKALAH');
    setUploadTitle('');
    setUploadAuthors(auth?.name ? auth.name : '');
    setUploadFileUrl('');
    setUploadDescription('');
    setUploadNotice(null);
    setShowUploadModal(true);
  };

  // Submit new Library Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFileUrl.trim()) {
      alert('Mohon isi judul karya dan tautan berkas!');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCourseName = '';
      if (uploadCourseId === 'custom') {
        finalCourseName = uploadCustomCourse.trim() || 'Mata Kuliah Umum';
      } else {
        const found = courses.find((c) => c.id === uploadCourseId);
        finalCourseName = found ? found.name : 'Mata Kuliah';
      }

      appStore.addLibraryItem({
        courseId: uploadCourseId === 'custom' ? `custom-${Date.now()}` : uploadCourseId,
        courseName: finalCourseName,
        semester: Number(uploadSemester),
        title: uploadTitle.trim(),
        category: uploadCategory,
        authors: uploadAuthors.trim() || auth?.name || 'Mahasiswa HK A',
        fileUrl: uploadFileUrl.trim(),
        description: uploadDescription.trim() || undefined,
        uploadedByNim: auth?.nim || '',
        uploadedByName: auth?.name || 'Mahasiswa HK A',
      });

      setUploadNotice('Karya/tugas berhasil disimpan ke Perpustakaan!');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadNotice(null);
      }, 1000);
    } catch (err) {
      alert('Gagal menyimpan berkas. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete item handler
  const handleDeleteItem = (item: LibraryItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus berkas "${item.title}"?`)) return;
    appStore.deleteLibraryItem(item.id);
  };

  // Copy link handler
  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Share to WhatsApp
  const handleShareWA = (item: LibraryItem) => {
    const text = `📚 *REPOSITORI TUGAS HK A 2025*\n\n*Judul:* ${item.title}\n*Kategori:* ${item.category}\n*Mata Kuliah:* ${item.courseName || 'Mata Kuliah'} (Semester ${item.semester})\n*Penyusun:* ${item.authors}\n\n🔗 *Tautan Berkas:*\n${item.fileUrl}\n\n_Arsip Perpustakaan Digital Kelas HK A 2025_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter courses for the selected semester
  const semesterCourses = useMemo(() => {
    return courses.filter((c) => Number(c.semester) === Number(selectedSemester));
  }, [courses, selectedSemester]);

  // Filter items based on Semester, Course, Category, and Search Query
  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      const matchSem = Number(item.semester) === Number(selectedSemester);
      const matchCourse = selectedCourseId === 'ALL' || item.courseId === selectedCourseId;
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.authors.toLowerCase().includes(q) ||
        (item.courseName || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
      return matchSem && matchCourse && matchCat && matchQuery;
    });
  }, [libraryItems, selectedSemester, selectedCourseId, selectedCategory, searchQuery]);

  // Statistics
  const totalItemsAll = libraryItems.length;
  const currentSemItemsCount = libraryItems.filter((i) => Number(i.semester) === Number(selectedSemester)).length;

  // Selected Course details
  const activeSelectedCourse = useMemo(() => {
    if (selectedCourseId === 'ALL') return null;
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // If user is not logged in, show protected screen with friendly login invitation
  if (!auth) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-[#8c4e24] flex items-center justify-center mx-auto shadow-sm">
            <Library className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Akses Khusus Mahasiswa & Dosen
            </span>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              Perpustakaan & Repositori Tugas
            </h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              Koleksi makalah, artikel ilmiah, resume, dan presentasi perkuliahan kelas Hukum Keluarga A 2025 (Semester 1–8) dilindungi dan hanya dapat diakses setelah masuk portal.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link
              href="/login"
              className="w-full py-3 px-5 rounded-2xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Masuk dengan NIM / Akun Kelas</span>
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        {/* BREADCRUMB & HERO HEADER */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs text-stone-500">
            <Link href="/" className="hover:text-[#8c4e24] transition-colors flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>
            <span>/</span>
            <Link href="/mahasiswa" className="hover:text-[#8c4e24] transition-colors">
              Portal Mahasiswa
            </Link>
            <span>/</span>
            <span className="font-semibold text-stone-800">E-Library HK A 2025</span>
          </div>

          <div className="bg-gradient-to-br from-[#1a0f08] via-[#2d180d] to-[#120703] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-amber-500/20 to-transparent pointer-events-none blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>E-Repository & Digital Library</span>
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-stone-300 border border-white/10">
                    Semester 1 s.d. 8
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Perpustakaan & Repositori Tugas HK A 2025
                </h1>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Arsip tugas, makalah kelompok, artikel ilmiah, resume, dan presentasi perkuliahan kelas Hukum Keluarga A.
                </p>

                <div className="flex items-center space-x-2 text-xs text-amber-200/90 pt-0.5">
                  <User className="w-3.5 h-3.5" />
                  <span>
                    Masuk sebagai: <strong>{auth.name}</strong> ({auth.nim || auth.role})
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenUpload()}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/40 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Unggah Karya / Tugas Baru</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SEMESTER TAB NAVIGATION (1 to 8) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-[#8c4e24]" />
              <span>Pilih Semester Perkuliahan</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              Semester Aktif Saat Ini: <strong className="text-[#8c4e24]">Semester {activeSemester}</strong>
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
              const isSelected = selectedSemester === sem;
              const isActiveSem = activeSemester === sem;
              const countInSem = libraryItems.filter((i) => Number(i.semester) === sem).length;

              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => handleSelectSemester(sem)}
                  className={`py-2.5 px-2 rounded-2xl text-center transition-all relative border ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#8c4e24] to-[#723f1c] text-white border-[#723f1c] shadow-md shadow-[#8c4e24]/25 scale-102 font-bold'
                      : 'bg-white hover:bg-amber-50/70 text-stone-700 border-stone-200/90 hover:border-amber-300'
                  }`}
                >
                  {isActiveSem && (
                    <span
                      className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border shadow-2xs uppercase tracking-tighter ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 border-amber-300'
                          : 'bg-[#8c4e24] text-white border-amber-400/40'
                      }`}
                    >
                      Aktif
                    </span>
                  )}
                  <div className="text-xs sm:text-sm font-black">Semester {sem}</div>
                  <div
                    className={`text-[10px] font-medium mt-0.5 ${
                      isSelected ? 'text-amber-200' : 'text-stone-400'
                    }`}
                  >
                    {countInSem} Berkas
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAMPILAN MATA KULIAH BULAT MEWAH (SESUAI BERANDA) */}
        <section className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8c4e24] border border-amber-200 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  Mata Kuliah Semester {selectedSemester}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Pilih lingkaran mata kuliah di bawah untuk menyaring tugas & karya:
                </p>
              </div>
            </div>

            <div className="text-xs text-stone-500">
              Menampilkan:{' '}
              <strong className="text-[#8c4e24]">
                {selectedCourseId === 'ALL'
                  ? `Semua Mata Kuliah (${semesterCourses.length} MK)`
                  : activeSelectedCourse?.name || 'Mata Kuliah'}
              </strong>
            </div>
          </div>

          {/* CIRCULAR BUBBLE GRID (Mobile: 3/4 per baris, Desktop: 6/7 per baris) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-y-6 gap-x-2 sm:gap-4 py-2">
            {/* Bubble 1: SEMUA MATA KULIAH */}
            <button
              type="button"
              onClick={() => setSelectedCourseId('ALL')}
              className="group flex flex-col items-center text-center focus:outline-none transition-all hover:-translate-y-1 active:scale-95"
            >
              <div
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-[#2a1306] via-[#1c0c04] to-[#100602] text-white p-1 shadow-md transition-all duration-300 flex flex-col items-center justify-center ${
                  selectedCourseId === 'ALL'
                    ? 'ring-4 ring-amber-400 border-2 border-amber-300 scale-105 shadow-xl shadow-amber-950/40'
                    : 'border-2 border-amber-500/40 group-hover:border-amber-300 group-hover:scale-102'
                }`}
              >
                <div className="absolute inset-1 rounded-full bg-radial from-amber-500/10 to-transparent pointer-events-none" />
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 mb-0.5 relative z-10" />
                <span className="relative z-10 text-[9px] sm:text-[10px] font-mono font-extrabold text-amber-200/95 tracking-tight px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/25">
                  SEMUA
                </span>
              </div>
              <span
                className={`text-[11px] sm:text-xs font-bold mt-2 line-clamp-2 max-w-[85px] sm:max-w-[100px] leading-tight ${
                  selectedCourseId === 'ALL' ? 'text-[#8c4e24] underline decoration-amber-500 decoration-2' : 'text-stone-800'
                }`}
              >
                Semua MK
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 mt-1 font-semibold">
                {currentSemItemsCount} Berkas
              </span>
            </button>

            {/* Bubbles for each course in this semester */}
            {semesterCourses.map((c) => {
              const isSelected = selectedCourseId === c.id;
              const CourseIcon = getCourseIcon(c.id, c.name);
              const courseFilesCount = libraryItems.filter(
                (i) => Number(i.semester) === Number(selectedSemester) && i.courseId === c.id
              ).length;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourseId(c.id)}
                  className="group flex flex-col items-center text-center focus:outline-none transition-all hover:-translate-y-1 active:scale-95"
                >
                  <div
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-[#2a1306] via-[#1c0c04] to-[#100602] text-white p-1 shadow-md transition-all duration-300 flex flex-col items-center justify-center ${
                      isSelected
                        ? 'ring-4 ring-amber-400 border-2 border-amber-300 scale-105 shadow-xl shadow-amber-950/40'
                        : 'border-2 border-amber-500/40 group-hover:border-amber-300 group-hover:scale-102'
                    }`}
                  >
                    <div className="absolute inset-1 rounded-full bg-radial from-amber-500/10 to-transparent pointer-events-none" />
                    <CourseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 mb-0.5 relative z-10" />
                    <span className="relative z-10 text-[9px] sm:text-[10px] font-mono font-extrabold text-amber-200/95 tracking-tight px-1.5 py-0.2 rounded-full bg-amber-500/15 border border-amber-400/25">
                      {c.sks} SKS
                    </span>
                  </div>

                  <span
                    className={`text-[11px] sm:text-xs font-bold mt-2 line-clamp-2 max-w-[85px] sm:max-w-[100px] leading-tight ${
                      isSelected ? 'text-[#8c4e24] underline decoration-amber-500 decoration-2' : 'text-stone-800'
                    }`}
                  >
                    {c.name}
                  </span>

                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full mt-1 font-semibold ${
                      courseFilesCount > 0
                        ? 'bg-amber-100 text-[#723f1c] font-bold'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {courseFilesCount} Berkas
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Live Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul makalah, nama penyusun, kata kunci, atau topik..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 focus:border-[#8c4e24]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Upload Button */}
            <button
              type="button"
              onClick={() => handleOpenUpload(selectedCourseId !== 'ALL' ? selectedCourseId : undefined, selectedSemester)}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8c4e24] border border-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>
                {selectedCourseId !== 'ALL' && activeSelectedCourse
                  ? `Upload di ${activeSelectedCourse.name.split(' ')[0]}`
                  : `Upload di Sem ${selectedSemester}`}
              </span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-[#8c4e24] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Semua Kategori
            </button>

            {(Object.keys(CATEGORY_CONFIG) as LibraryCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isCatSelected = selectedCategory === cat;
              const countInCat = libraryItems.filter(
                (i) =>
                  Number(i.semester) === Number(selectedSemester) &&
                  (selectedCourseId === 'ALL' || i.courseId === selectedCourseId) &&
                  i.category === cat
              ).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap flex items-center space-x-1.5 border ${
                    isCatSelected
                      ? 'bg-amber-100 text-[#723f1c] border-amber-300 font-bold shadow-2xs'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                    {countInCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DAFTAR CARD BERKAS MEWAH & RINGAN (SESUAI REFERENSI GAMBAR 3) */}
        <section className="space-y-3.5">
          {/* Header section berkas */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-stone-900">
                {selectedCourseId === 'ALL'
                  ? `Daftar Berkas & Tugas Semester ${selectedSemester}`
                  : `Berkas: ${activeSelectedCourse?.name || 'Mata Kuliah'}`}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-[#723f1c] font-bold border border-amber-300">
                {filteredItems.length} Dokumen
              </span>
            </div>

            {selectedCourseId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCourseId('ALL')}
                className="text-xs text-[#8c4e24] hover:underline font-semibold"
              >
                Lihat Semua MK →
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl p-8 border border-dashed border-stone-300 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#8c4e24] border border-amber-200/80 flex items-center justify-center mx-auto">
                <Folder className="w-6 h-6 text-[#8c4e24]" />
              </div>
              <h4 className="font-bold text-stone-800 text-sm">
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'Tidak Ada Berkas yang Cocok'
                  : 'Belum Ada Berkas yang Tersimpan'}
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'Coba ganti kata kunci pencarian atau ubah filter kategori di atas.'
                  : `Belum ada tugas, makalah, atau slide presentasi yang diunggah untuk ${
                      selectedCourseId === 'ALL'
                        ? `Semester ${selectedSemester}`
                        : activeSelectedCourse?.name || 'mata kuliah ini'
                    }. Jadilah yang pertama menyumbang karya!`}
              </p>
              <button
                type="button"
                onClick={() => handleOpenUpload(selectedCourseId !== 'ALL' ? selectedCourseId : undefined, selectedSemester)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Unggah Berkas Pertama</span>
              </button>
            </div>
          ) : (
            /* List of Sleek & Luxurious Horizontal Cards */
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.MAKALAH;
                const canDelete =
                  auth.role === 'ADMIN' ||
                  item.uploadedByNim === auth.nim ||
                  courses.some(
                    (c) =>
                      c.id === item.courseId &&
                      Array.isArray(c.pjNims) &&
                      c.pjNims.includes(auth.nim || '')
                  );

                const downloadLink = getDownloadUrl(item.fileUrl);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 hover:border-amber-300/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Sisi Kiri: Judul, Kategori, Mata Kuliah, & Penulis */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Kategori Badge Harmonis */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${cfg.badgeBg} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>

                        {/* Nama Mata Kuliah */}
                        <span className="text-[11px] font-bold text-[#8c4e24] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                          {item.courseName || 'Mata Kuliah'}
                        </span>

                        {/* Tanggal */}
                        <span className="text-[10px] text-stone-400 font-mono">
                          {item.uploadedAt}
                        </span>
                      </div>

                      {/* Judul Berkas */}
                      <h4 className="text-sm sm:text-base font-extrabold text-stone-900 leading-snug">
                        {item.title}
                      </h4>

                      {/* Deskripsi Singkat jika ada */}
                      {item.description && (
                        <p className="text-xs text-stone-500 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Penulis / Kelompok */}
                      <div className="flex items-center space-x-1.5 text-xs text-stone-600 pt-0.5">
                        <Users className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                        <span className="font-semibold line-clamp-1">{item.authors}</span>
                      </div>
                    </div>

                    {/* Sisi Kanan: Tombol [Lihat] (Coklat Syariah) & [Download] (Emas Amber) */}
                    <div className="flex items-center justify-end space-x-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                      {/* Tombol LIHAT (Coklat Syariah #8c4e24) */}
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-95"
                        title="Buka / Baca Dokumen di Layar"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-200" />
                        <span>Lihat</span>
                      </a>

                      {/* Tombol DOWNLOAD (Emas Amber) */}
                      <a
                        href={downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-95"
                        title="Unduh Berkas ke Perangkat"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-950" />
                        <span>Download</span>
                      </a>

                      {/* Tombol Salin Link */}
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.fileUrl)}
                        title="Salin Tautan Berkas"
                        className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Tombol Bagikan WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleShareWA(item)}
                        title="Bagikan ke WhatsApp Kelas"
                        className="p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-[#8c4e24] transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Tombol Hapus jika berhak */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          title="Hapus Berkas Ini"
                          className="p-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* UPLOAD / TAMBAH TUGAS MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#8c4e24] flex items-center justify-center shadow-2xs">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">Unggah Karya / Tugas Baru</h3>
                  <p className="text-xs text-stone-500">Perpustakaan Digital HK A 2025</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {uploadNotice && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[#723f1c] text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{uploadNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              {/* Semester & Kategori in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Semester</label>
                  <select
                    value={uploadSemester}
                    onChange={(e) => setUploadSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s} {s === activeSemester ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Jenis Dokumen</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as LibraryCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30"
                  >
                    {(Object.keys(CATEGORY_CONFIG) as LibraryCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mata Kuliah Selector */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Mata Kuliah</label>
                <select
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30"
                >
                  {courses
                    .filter((c) => Number(c.semester) === Number(uploadSemester))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name} ({c.sks} SKS)
                      </option>
                    ))}
                  <option value="custom">+ Lainnya / Tulis Manual</option>
                </select>
              </div>

              {/* Custom Course Name input if custom */}
              {uploadCourseId === 'custom' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nama Mata Kuliah Baru</label>
                  <input
                    type="text"
                    required
                    value={uploadCustomCourse}
                    onChange={(e) => setUploadCustomCourse(e.target.value)}
                    placeholder="Contoh: Metodologi Penelitian Hukum Islam..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30"
                  />
                </div>
              )}

              {/* Judul Tugas / Karya */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Tugas / Makalah / Karya</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Makalah Analisis Hadits Hak Hadhanah Anak Pasca Perceraian"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 font-medium"
                />
              </div>

              {/* Penulis / Anggota Kelompok */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Penyusun / Anggota Kelompok
                </label>
                <input
                  type="text"
                  required
                  value={uploadAuthors}
                  onChange={(e) => setUploadAuthors(e.target.value)}
                  placeholder="Contoh: Kelompok 1 (Sufyan Tsaury, Wahdan Hamdun, Subhan Nur R.)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 font-medium"
                />
              </div>

              {/* Tautan Berkas (Google Drive / Cloud Link) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-700">
                    Tautan Dokumen (Google Drive / Cloud Link)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDriveGuide(!showDriveGuide)}
                    className="text-[11px] text-[#8c4e24] hover:underline font-semibold"
                  >
                    {showDriveGuide ? 'Tutup Panduan' : '💡 Panduan Link Drive'}
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={uploadFileUrl}
                  onChange={(e) => setUploadFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... atau link dokumen lainnya"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 font-mono text-[11px]"
                />

                {showDriveGuide && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1 leading-relaxed animate-in fade-in">
                    <p className="font-bold">Cara mengambil link dari Google Drive:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Buka Google Drive Anda, klik kanan pada file tugas/makalah.</li>
                      <li>Pilih menu <strong>Bagikan (Share)</strong>.</li>
                      <li>Ubah akses umum menjadi: <strong>"Siapa saja yang memiliki link"</strong>.</li>
                      <li>Klik <strong>Salin Link (Copy link)</strong> dan tempelkan di kotak di atas.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Deskripsi / Abstrak Singkat */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Deskripsi Singkat / Catatan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Keterangan singkat mengenai topik pembahasan tugas ini..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Perpustakaan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

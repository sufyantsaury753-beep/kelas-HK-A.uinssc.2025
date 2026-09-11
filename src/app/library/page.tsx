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
  ChevronRight,
  ChevronDown,
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
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession, LibraryItem, LibraryCategory } from '@/lib/types';

// Category metadata for styling and icons
const CATEGORY_CONFIG: Record<
  LibraryCategory,
  { label: string; icon: any; badgeBg: string; border: string; text: string }
> = {
  MAKALAH: {
    label: 'Makalah',
    icon: FileText,
    badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  ARTIKEL: {
    label: 'Artikel Ilmiah',
    icon: FileCode,
    badgeBg: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  PPT: {
    label: 'Slide Presentasi (PPT)',
    icon: Presentation,
    badgeBg: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
  },
  RESUME: {
    label: 'Resume & Peta Konsep',
    icon: FileCheck,
    badgeBg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
  },
  TUGAS: {
    label: 'Tugas Proyek',
    icon: CheckCircle2,
    badgeBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
  },
  MODUL: {
    label: 'Modul & Buku',
    icon: BookOpen,
    badgeBg: 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-700 dark:text-teal-300',
  },
  RPS: {
    label: 'RPS & Silabus',
    icon: Info,
    badgeBg: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
};

export default function LibraryPage() {
  const router = useRouter();

  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [activeSemester, setActiveSemester] = useState<number>(3);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
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

  // Update default selected course when uploadSemester changes
  useEffect(() => {
    const semCourses = courses.filter((c) => Number(c.semester) === Number(uploadSemester));
    if (semCourses.length > 0) {
      setUploadCourseId(semCourses[0].id);
    } else {
      setUploadCourseId('custom');
    }
  }, [uploadSemester, courses]);

  // Handle open upload modal with prefilled data
  const handleOpenUpload = (targetCourseId?: string, targetSem?: number) => {
    const sem = targetSem || selectedSemester;
    setUploadSemester(sem);
    if (targetCourseId) {
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

  // Filter courses & library items for the current view
  const semesterCourses = useMemo(() => {
    return courses.filter((c) => Number(c.semester) === Number(selectedSemester));
  }, [courses, selectedSemester]);

  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      const matchSem = Number(item.semester) === Number(selectedSemester);
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.authors.toLowerCase().includes(q) ||
        (item.courseName || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
      return matchSem && matchCat && matchQuery;
    });
  }, [libraryItems, selectedSemester, selectedCategory, searchQuery]);

  // Statistics
  const totalItemsAll = libraryItems.length;
  const totalMakalah = libraryItems.filter((i) => i.category === 'MAKALAH').length;
  const totalArtikelPpt = libraryItems.filter((i) => i.category === 'ARTIKEL' || i.category === 'PPT').length;
  const currentSemItemsCount = libraryItems.filter((i) => Number(i.semester) === Number(selectedSemester)).length;

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* BREADCRUMB & HERO HEADER */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs text-stone-500">
            <Link href="/" className="hover:text-[#8c4e24] transition-colors flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>
            <span>/</span>
            <Link href="/mahasiswa" className="hover:text-[#8c4e24] transition-colors">
              Portal Presensi
            </Link>
            <span>/</span>
            <span className="font-semibold text-stone-800">E-Library HK A 2025</span>
          </div>

          <div className="bg-gradient-to-br from-[#1a0f08] via-[#2d180d] to-[#120703] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-amber-500/20 to-transparent pointer-events-none blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>E-Repository & Digital Library</span>
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-stone-300 border border-white/10">
                    Semester 1 s.d. 8
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Perpustakaan & Repositori Karya HK A 2025
                </h1>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Pusat arsip tugas, makalah kelompok, artikel ilmiah, resume, dan materi presentasi mahasiswa Hukum Keluarga A 2025 dari awal perkuliahan hingga skripsi.
                </p>

                <div className="flex items-center space-x-2 text-xs text-amber-200/90 pt-1">
                  <User className="w-3.5 h-3.5" />
                  <span>
                    Masuk sebagai: <strong>{auth.name}</strong> ({auth.nim || auth.role})
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenUpload()}
                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/40 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Unggah Karya / Tugas Baru</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs text-center space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Karya</span>
            <span className="text-2xl font-black text-stone-900">{totalItemsAll}</span>
            <span className="text-[10px] text-stone-400 block">Sem 1–8 Tersimpan</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs text-center space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Makalah Kelompok</span>
            <span className="text-2xl font-black text-emerald-700">{totalMakalah}</span>
            <span className="text-[10px] text-stone-400 block">Kajian Fiqih & Hukum</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs text-center space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Artikel & Slide PPT</span>
            <span className="text-2xl font-black text-blue-700">{totalArtikelPpt}</span>
            <span className="text-[10px] text-stone-400 block">Bahan Tayang Presentasi</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs text-center space-y-1">
            <span className="text-[10px] font-bold text-[#8c4e24] uppercase tracking-wider block">Semester {selectedSemester}</span>
            <span className="text-2xl font-black text-[#8c4e24]">{currentSemItemsCount} Berkas</span>
            <span className="text-[10px] text-stone-400 block">Dalam Tampilan Aktif</span>
          </div>
        </div>

        {/* SEMESTER TAB NAVIGATION (1 to 8) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-[#8c4e24]" />
              <span>Pilih Semester (1 s.d. 8)</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              Semester Saat Ini: <strong className="text-[#8c4e24]">Semester {activeSemester}</strong>
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
                  onClick={() => setSelectedSemester(sem)}
                  className={`py-3 px-2 rounded-2xl text-center transition-all relative border ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#8c4e24] to-[#723f1c] text-white border-[#723f1c] shadow-md shadow-[#8c4e24]/25 scale-102'
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
                placeholder="Cari judul makalah, nama penyusun, mata kuliah, atau topik..."
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
              onClick={() => handleOpenUpload(undefined, selectedSemester)}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8c4e24] border border-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Berkas di Sem {selectedSemester}</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Semua Kategori ({currentSemItemsCount})
            </button>

            {(Object.keys(CATEGORY_CONFIG) as LibraryCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isCatSelected = selectedCategory === cat;
              const countInCat = libraryItems.filter(
                (i) => Number(i.semester) === Number(selectedSemester) && i.category === cat
              ).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap flex items-center space-x-1.5 border ${
                    isCatSelected
                      ? `${cfg.badgeBg} ${cfg.border} font-bold ring-2 ring-amber-400/50`
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10">
                    {countInCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* REPOSITORY CONTENT: LIST OF COURSES & FILES */}
        <div className="space-y-6">
          {semesterCourses.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
              <Folder className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-bold text-stone-800 text-sm">Belum Ada Mata Kuliah di Semester {selectedSemester}</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Mata kuliah untuk semester ini belum dikonfigurasi. Anda tetap dapat mengunggah berkas dengan memasukkan nama mata kuliah secara manual.
              </p>
              <button
                type="button"
                onClick={() => handleOpenUpload(undefined, selectedSemester)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#8c4e24] text-white font-bold text-xs shadow-xs hover:bg-[#723f1c]"
              >
                <Plus className="w-4 h-4" />
                <span>Unggah Berkas Baru</span>
              </button>
            </div>
          ) : (
            semesterCourses.map((course) => {
              const courseItems = filteredItems.filter((i) => i.courseId === course.id);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden transition-all"
                >
                  {/* Course Header Banner */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-50 via-amber-50/20 to-stone-50 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-[#8c4e24] border border-amber-200/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700">
                            {course.code}
                          </span>
                          <span className="text-[11px] font-semibold text-stone-500">
                            {course.sks} SKS • Dosen: <strong className="text-stone-700">{course.dosen}</strong>
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-stone-900 mt-0.5">
                          {course.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                        {courseItems.length} Berkas
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenUpload(course.id, selectedSemester)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 text-[#8c4e24] text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload Tugas</span>
                      </button>
                    </div>
                  </div>

                  {/* Course Files Grid */}
                  <div className="p-4 sm:p-5">
                    {courseItems.length === 0 ? (
                      <div className="py-6 px-4 rounded-2xl bg-stone-50/60 border border-dashed border-stone-200 text-center space-y-2">
                        <Folder className="w-7 h-7 text-stone-300 mx-auto" />
                        <p className="text-xs text-stone-500">
                          {searchQuery || selectedCategory !== 'ALL'
                            ? 'Tidak ada berkas yang sesuai dengan filter pencarian.'
                            : 'Belum ada makalah atau tugas yang diunggah untuk mata kuliah ini.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenUpload(course.id, selectedSemester)}
                          className="text-xs text-[#8c4e24] font-bold hover:underline"
                        >
                          + Tambahkan Berkas Pertama
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {courseItems.map((item) => {
                          const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.MAKALAH;
                          const CatIcon = cfg.icon;
                          const canDelete =
                            auth.role === 'ADMIN' ||
                            item.uploadedByNim === auth.nim ||
                            (Array.isArray(course.pjNims) && course.pjNims.includes(auth.nim || ''));

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-2xl p-4 border border-stone-200/80 hover:border-amber-300/80 hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
                            >
                              <div className="space-y-2">
                                {/* Top Category & Delete Action */}
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center space-x-1 ${cfg.badgeBg} ${cfg.border}`}
                                  >
                                    <CatIcon className="w-3 h-3" />
                                    <span>{cfg.label}</span>
                                  </span>

                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-stone-400 font-mono">
                                      {item.uploadedAt}
                                    </span>
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteItem(item)}
                                        title="Hapus berkas ini"
                                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Title */}
                                <h4 className="text-sm font-bold text-stone-900 leading-snug">
                                  {item.title}
                                </h4>

                                {/* Description / Abstract */}
                                {item.description && (
                                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                                    {item.description}
                                  </p>
                                )}

                                {/* Authors / Kelompok */}
                                <div className="flex items-center space-x-1.5 text-xs text-stone-600 pt-0.5">
                                  <Users className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                                  <span className="font-semibold line-clamp-1">{item.authors}</span>
                                </div>
                              </div>

                              {/* Footer Action Buttons */}
                              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-2 px-3 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold flex items-center justify-center space-x-1.5 transition-all shadow-2xs active:scale-95 text-center"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Buka / Baca Dokumen</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.id, item.fileUrl)}
                                  title="Salin tautan dokumen"
                                  className="py-2 px-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                                >
                                  {copiedId === item.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleShareWA(item)}
                                  title="Bagikan ke WhatsApp"
                                  className="py-2 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
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
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
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

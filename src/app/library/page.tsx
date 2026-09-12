'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Library,
  Search,
  Upload,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Clock,
  Trash2,
  Filter,
  CheckCircle2,
  FolderOpen,
  FolderDown,
  GraduationCap,
  Layers,
  FileCode,
  FileSpreadsheet,
  Presentation,
  File,
  Settings,
  Share2,
  Eye,
  AlertCircle,
  HardDrive,
  Check,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession, LibraryItem, LibraryCategory } from '@/lib/types';
import {
  formatFileSize,
  detectFileType,
  uploadLibraryFile,
  readFileAsDataUrl,
} from '@/lib/storage';

// Kategori Filter Kotak Persegi Panjang
interface CategoryFilterOption {
  key: string;
  label: string;
  icon: any;
  categoryMatch?: LibraryCategory[];
}

const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { key: 'ALL', label: 'Semua Berkas', icon: FolderOpen },
  { key: 'TUGAS', label: 'Tugas Kuliah', icon: FileText, categoryMatch: ['TUGAS'] },
  { key: 'MAKALAH', label: 'Makalah & Karya Ilmiah', icon: BookOpen, categoryMatch: ['MAKALAH'] },
  { key: 'ARTIKEL', label: 'Artikel & Jurnal', icon: GraduationCap, categoryMatch: ['ARTIKEL'] },
  { key: 'BUKU_MODUL', label: 'Buku & Modul', icon: Layers, categoryMatch: ['MODUL', 'BUKU'] },
  { key: 'RPS', label: 'RPS & Silabus', icon: FileCode, categoryMatch: ['RPS'] },
  { key: 'PPT', label: 'PPT / Slide', icon: Presentation, categoryMatch: ['PPT'] },
  { key: 'RESUME', label: 'Resume & Catatan', icon: Sparkles, categoryMatch: ['RESUME'] },
];

export default function LibraryDirectoryPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [activeSemester, setActiveSemester] = useState<number>(3);
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'TITLE'>('NEWEST');

  // Google Drive URL
  const [classDriveUrl, setClassDriveUrl] = useState<string>('');
  const [showDriveEditModal, setShowDriveEditModal] = useState(false);
  const [newDriveUrlInput, setNewDriveUrlInput] = useState('');

  // Upload Modal (Bisa diakses seluruh mahasiswa login)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSemester, setUploadSemester] = useState<number>(3);
  const [uploadCourseId, setUploadCourseId] = useState<string>('');
  const [uploadCustomCourse, setUploadCustomCourse] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<LibraryCategory>('TUGAS');
  const [uploadAuthors, setUploadAuthors] = useState<string>('');
  const [uploadFileUrl, setUploadFileUrl] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'FILE' | 'LINK'>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Unduh otomatis langsung ke penyimpanan perangkat
  const handleDirectDownload = async (item: LibraryItem) => {
    setDownloadingId(item.id);
    try {
      const url = item.fileUrl;
      // Konversi link view Google Drive ke direct download
      if (url.includes('drive.google.com/file/d/')) {
        const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
          window.open(`https://drive.google.com/uc?export=download&id=${driveMatch[1]}`, '_blank');
          return;
        }
      }

      let ext = (item.fileType || 'pdf').toLowerCase();
      if (ext === 'docx') ext = 'docx';
      else if (ext === 'pptx') ext = 'pptx';
      else if (ext === 'img') ext = 'jpg';
      else if (ext === 'link' || ext === 'drive') ext = 'pdf';

      const urlPath = url.split('?')[0];
      const existingExt = urlPath.split('.').pop()?.toLowerCase();
      if (existingExt && ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp'].includes(existingExt)) {
        ext = existingExt;
      }

      const cleanTitle = (item.title || 'Berkas-Tugas')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const fileName = `${cleanTitle}.${ext}`;

      // Ambil berkas sebagai blob (CORS Supabase Storage aktif)
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      // Trigger unduhan langsung ke perangkat
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.warn('Direct fetch download fallback:', err);
      const a = document.createElement('a');
      a.href = item.fileUrl;
      a.download = item.title;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const init = () => {
      const currentAuth = appStore.getAuth();
      setAuth(currentAuth);
      const allCourses = appStore.getCourses();
      setCourses(allCourses);
      const currentActiveSem = appStore.getActiveSemester() || 3;
      setActiveSemester(currentActiveSem);
      setLibraryItems(appStore.getLibraryItems());
      const driveLink = appStore.getClassDriveUrl();
      setClassDriveUrl(driveLink);
      setNewDriveUrlInput(driveLink);
    };

    init();
    const unsub = appStore.subscribe(init);
    return () => unsub();
  }, []);

  const isAdmin = auth?.role === 'ADMIN';

  // Handle Pilih Berkas
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    if (!uploadTitle.trim()) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const formattedTitle = nameWithoutExt.replace(/[-_]+/g, ' ').trim();
      setUploadTitle(formattedTitle);
    }

    // Auto-detect kategori dari ekstensi / nama file
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.ppt') || lower.endsWith('.pptx') || lower.includes('presentasi') || lower.includes('slide')) {
      setUploadCategory('PPT');
    } else if (lower.includes('rps') || lower.includes('silabus')) {
      setUploadCategory('RPS');
    } else if (lower.includes('artikel') || lower.includes('jurnal')) {
      setUploadCategory('ARTIKEL');
    } else if (lower.includes('resume') || lower.includes('catatan') || lower.includes('rangkuman')) {
      setUploadCategory('RESUME');
    } else if (lower.includes('modul') || lower.includes('buku')) {
      setUploadCategory('MODUL');
    } else if (lower.includes('makalah')) {
      setUploadCategory('MAKALAH');
    } else {
      setUploadCategory('TUGAS');
    }
  };

  // Open Upload Modal
  const openUploadModal = () => {
    if (!auth) {
      alert('Silakan login dengan NIM atau akun kelas terlebih dahulu untuk mengunggah tugas!');
      return;
    }
    setUploadSemester(activeSemester);
    setUploadCourseId(courses[0]?.id || 'custom');
    setUploadAuthors(auth.name);
    setShowUploadModal(true);
  };

  // Handle Simpan Berkas (Mahasiswa & Admin)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadMode === 'FILE' && !selectedFile) {
      alert('Mohon pilih berkas dari perangkat Anda terlebih dahulu!');
      return;
    }

    if (uploadMode === 'LINK' && !uploadFileUrl.trim()) {
      alert('Mohon isi tautan berkas (Google Drive / tautan online)!');
      return;
    }

    if (!uploadTitle.trim()) {
      alert('Mohon isi judul tugas / karya!');
      return;
    }

    setIsSubmitting(true);
    setUploadProgressText('Sedang memproses berkas...');

    try {
      let finalCourseName = '';
      if (uploadCourseId === 'custom') {
        finalCourseName = uploadCustomCourse.trim() || 'Mata Kuliah Umum';
      } else {
        const found = courses.find((c) => c.id === uploadCourseId);
        finalCourseName = found ? found.name : 'Mata Kuliah';
      }

      let finalFileUrl = uploadFileUrl.trim();
      let finalFileType: 'PDF' | 'DOCX' | 'PPTX' | 'IMG' | 'LINK' | 'DRIVE' = 'LINK';
      let finalFileSize: string | undefined = undefined;

      if (uploadMode === 'FILE' && selectedFile) {
        finalFileType = detectFileType(selectedFile.name);
        finalFileSize = formatFileSize(selectedFile.size);

        const uploadRes = await uploadLibraryFile(
          selectedFile,
          uploadCourseId === 'custom' ? 'general' : uploadCourseId,
          (status) => setUploadProgressText(status)
        );

        if (uploadRes.url) {
          finalFileUrl = uploadRes.url;
          if (uploadRes.file) {
            finalFileSize = formatFileSize(uploadRes.file.size);
          }
        } else {
          console.warn('Storage upload note:', uploadRes.error);
          const allowLocal = confirm(
            `${uploadRes.error}\n\nSimpan sementara di perangkat ini agar berkas tidak hilang?`
          );
          if (allowLocal) {
            setUploadProgressText('Menyimpan secara lokal...');
            finalFileUrl = await readFileAsDataUrl(selectedFile);
          } else {
            setIsSubmitting(false);
            setUploadProgressText('');
            return;
          }
        }
      } else {
        if (finalFileUrl.includes('drive.google.com') || finalFileUrl.includes('docs.google.com')) {
          finalFileType = 'DRIVE';
        }
      }

      appStore.addLibraryItem({
        courseId: uploadCourseId === 'custom' ? `custom-${Date.now()}` : uploadCourseId,
        courseName: finalCourseName,
        semester: Number(uploadSemester),
        title: uploadTitle.trim(),
        category: uploadCategory,
        authors: uploadAuthors.trim() || auth?.name || 'Mahasiswa HK A',
        fileUrl: finalFileUrl,
        fileType: finalFileType,
        fileSize: finalFileSize,
        description: uploadDescription.trim() || undefined,
        uploadedByNim: auth?.nim || 'ADMIN',
        uploadedByName: auth?.name || 'Mahasiswa HK A',
      });

      setUploadNotice('Berkas berhasil disimpan ke E-Library!');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadNotice(null);
        setUploadTitle('');
        setUploadFileUrl('');
        setSelectedFile(null);
        setUploadDescription('');
        setUploadProgressText('');
      }, 1200);
    } catch (err: any) {
      alert('Gagal menyimpan berkas: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Hapus Berkas (Hanya pemilik berkas atau Admin)
  const handleDeleteItem = (item: LibraryItem) => {
    const isOwner = auth?.nim && item.uploadedByNim === auth.nim;
    if (!isAdmin && !isOwner) {
      alert('Anda hanya dapat menghapus berkas yang Anda unggah sendiri.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus berkas "${item.title}"?`)) {
      return;
    }

    const success = appStore.deleteLibraryItem(item.id, auth?.nim, isAdmin);
    if (success) {
      alert('Berkas berhasil dihapus.');
    }
  };

  // Handle Update Google Drive URL oleh Admin
  const handleSaveDriveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    appStore.setClassDriveUrl(newDriveUrlInput);
    setClassDriveUrl(newDriveUrlInput.trim());
    setShowDriveEditModal(false);
    alert('Tautan Google Drive kelas berhasil diperbarui!');
  };

  // Filter & Search Berkas
  const filteredItems = useMemo(() => {
    const activeFilter = CATEGORY_FILTERS.find((f) => f.key === selectedCategoryKey);

    return libraryItems
      .filter((item) => {
        // Filter Kategori
        if (activeFilter && activeFilter.categoryMatch) {
          if (!activeFilter.categoryMatch.includes(item.category)) {
            return false;
          }
        }

        // Filter Semester
        if (selectedSemester !== 'ALL') {
          if (Number(item.semester) !== Number(selectedSemester)) {
            return false;
          }
        }

        // Filter Pencarian
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCourse = (item.courseName || '').toLowerCase().includes(q);
          const matchAuthor = (item.authors || '').toLowerCase().includes(q);
          const matchUploader = (item.uploadedByName || '').toLowerCase().includes(q);
          const matchDesc = (item.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCourse && !matchAuthor && !matchUploader && !matchDesc) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return (b.uploadedAt || '').localeCompare(a.uploadedAt || '');
        }
        if (sortBy === 'OLDEST') {
          return (a.uploadedAt || '').localeCompare(b.uploadedAt || '');
        }
        if (sortBy === 'TITLE') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [libraryItems, selectedCategoryKey, selectedSemester, searchQuery, sortBy]);

  // Hitung jumlah per kategori
  const getCategoryCount = (key: string) => {
    const f = CATEGORY_FILTERS.find((filter) => filter.key === key);
    if (!f || !f.categoryMatch) return libraryItems.length;
    return libraryItems.filter((i) => f.categoryMatch?.includes(i.category)).length;
  };

  // Helper Ikon Format Berkas
  const renderFileTypeIcon = (fileType?: string) => {
    switch (fileType) {
      case 'PDF':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'DOCX':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'PPTX':
      case 'PPT':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
            <Presentation className="w-5 h-5" />
          </div>
        );
      case 'IMG':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
            <ImageIcon className="w-5 h-5" />
          </div>
        );
      case 'DRIVE':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <HardDrive className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 shadow-xs">
            <File className="w-5 h-5" />
          </div>
        );
    }
  };

  // Gate jika belum login
  if (!auth) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#faf8f5]">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8c4e24] to-[#5a2a0c] text-amber-200 flex items-center justify-center mx-auto shadow-md">
            <Library className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-stone-900">E-Library & Repositori Tugas</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            Koleksi makalah, tugas, silabus, dan modul perkuliahan kelas Hukum Keluarga A 2025 hanya dapat diakses setelah login.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full py-3 rounded-2xl bg-[#8c4e24] hover:bg-[#783e18] text-white font-bold text-xs justify-center items-center space-x-2 shadow-md transition-all active:scale-98"
          >
            <span>Masuk dengan NIM / Akun Kelas</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-6 sm:py-10 select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        {/* BREADCRUMB */}
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-[#8c4e24] transition-colors flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">E-Library Kelas HK A</span>
        </div>

        {/* HERO BANNER & AKSI UTAMA */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1306] via-[#1c0c04] to-[#100602] text-white p-6 sm:p-9 border-2 border-amber-500/30 shadow-xl shadow-stone-900/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full text-[11px] font-bold text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Repositori Tugas & Dokumen Akademik Bersama</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                E-Library HK A 2025
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
                Pusat pengumpulan dan pertukaran makalah, tugas kelompok, artikel jurnal, buku referensi, dan modul perkuliahan seluruh mahasiswa kelas.
              </p>
              <div className="flex items-center space-x-4 pt-1 text-xs text-amber-200/90 font-medium">
                <span>📚 Total: <b>{libraryItems.length} Berkas</b></span>
                <span>•</span>
                <span>🎓 Status: <b>{auth.role === 'ADMIN' ? 'Admin Kelas' : `Mahasiswa (${auth.name})`}</b></span>
              </div>
            </div>

            {/* ACTION BUTTONS (GOOGLE DRIVE + UNGGAH TUGAS) */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              {/* TOMBOL GOOGLE DRIVE KELAS */}
              <div className="flex items-center space-x-1.5">
                <a
                  href={classDriveUrl || 'https://drive.google.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2.5 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-102 active:scale-98"
                  title="Buka Folder Google Drive Utama Kelas"
                >
                  <HardDrive className="w-4 h-4 text-emerald-200" />
                  <span>📁 Buka Google Drive Kelas</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowDriveEditModal(true)}
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/30 transition-all"
                    title="Ubah Tautan Google Drive (Admin Only)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* TOMBOL UNGGAH BERKAS (SEMUA MAHASISWA LOGIN) */}
              <button
                type="button"
                onClick={openUploadModal}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/30 transition-all hover:scale-102 active:scale-98"
              >
                <Upload className="w-4 h-4" />
                <span>+ Unggah Tugas / Berkas</span>
              </button>
            </div>
          </div>
        </div>

        {/* KOTAK FILTER PERSEGI PANJANG (KARYA ILMIAH, TUGAS, BUKU, DLL) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Kategori Berkas & Tugas
            </h2>
            <span className="text-[11px] text-stone-500">
              Menampilkan {filteredItems.length} dari {libraryItems.length} berkas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {CATEGORY_FILTERS.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategoryKey === cat.key;
              const count = getCategoryCount(cat.key);

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategoryKey(cat.key)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-98 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#2a1306] to-[#1a0b04] text-white border-amber-500/50 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold truncate">{cat.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 font-black'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TOOLBAR PENCARIAN & FILTER SEMESTER */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* SEARCH BAR */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul tugas, mata kuliah, nama penyusun, atau pengunggah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#8c4e24] focus:border-transparent bg-stone-50/50 text-stone-900 placeholder:text-stone-400"
            />
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            {/* FILTER SEMESTER */}
            <div className="flex items-center space-x-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <span className="text-stone-500 font-bold px-2">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-white text-stone-900 font-bold px-2.5 py-1 rounded-lg border-none text-xs focus:outline-none shadow-xs"
              >
                <option value="ALL">Semua (1-8)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s} {s === activeSemester ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* SORTING */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white text-stone-800 font-semibold px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none shadow-xs"
            >
              <option value="NEWEST">Terbaru</option>
              <option value="OLDEST">Terlama</option>
              <option value="TITLE">Judul A-Z</option>
            </select>
          </div>
        </div>

        {/* FEED DAFTAR BERKAS TUGAS (GRID MODERN) */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#8c4e24] flex items-center justify-center mx-auto">
              <FolderDown className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Belum Ada Berkas yang Cocok</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Tidak ada tugas atau berkas yang sesuai dengan filter kategori atau kata kunci pencarian Anda.
            </p>
            <button
              type="button"
              onClick={openUploadModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#8c4e24] text-white font-bold text-xs shadow-sm hover:bg-[#753e1f] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Berkas Pertama di Kategori Ini</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isOwner = auth?.nim && item.uploadedByNim === auth.nim;
              const canDelete = isAdmin || isOwner;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group hover:border-amber-300"
                >
                  <div className="space-y-3">
                    {/* TOP BADGES */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        {renderFileTypeIcon(item.fileType)}
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-[#723f1c] border border-amber-200">
                            {item.category}
                          </span>
                          <span className="ml-1.5 text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                            Sem. {item.semester}
                          </span>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title={isAdmin ? 'Hapus berkas (Moderasi Admin)' : 'Hapus berkas saya'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* MATA KULIAH TAG */}
                    <div className="text-[11px] font-bold text-[#8c4e24] truncate">
                      📖 {item.courseName || 'Mata Kuliah Umum'}
                    </div>

                    {/* JUDUL TUGAS */}
                    <h3 className="font-extrabold text-sm text-stone-900 leading-snug line-clamp-2 group-hover:text-[#8c4e24] transition-colors">
                      {item.title}
                    </h3>

                    {/* PENYUSUN / AUTHORS */}
                    <p className="text-[11px] text-stone-500 font-medium line-clamp-1">
                      Penyusun: <span className="text-stone-700 font-semibold">{item.authors || 'Mahasiswa HK A'}</span>
                    </p>

                    {/* DESKRIPSI JIKA ADA */}
                    {item.description && (
                      <p className="text-[11px] text-stone-600 line-clamp-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* BOTTOM INFO & ACTION BUTTONS */}
                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span className="truncate max-w-[150px]" title={`Diupload oleh ${item.uploadedByName} (${item.uploadedByNim})`}>
                        👤 {item.uploadedByName}
                      </span>
                      <span>{item.fileSize ? `${item.fileSize} • ` : ''}{item.uploadedAt}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors text-center"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-600" />
                        <span>Buka / Lihat</span>
                      </a>

                      <button
                        type="button"
                        disabled={downloadingId === item.id}
                        onClick={() => handleDirectDownload(item)}
                        className="py-2 px-3 rounded-xl bg-[#8c4e24] hover:bg-[#753e1f] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs text-center disabled:opacity-60 cursor-pointer active:scale-98"
                        title="Unduh langsung ke penyimpanan perangkat"
                      >
                        {downloadingId === item.id ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Mengunduh...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL UPLOAD TUGAS (MAHASISWA & ADMIN) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">Unggah Tugas & Berkas</h3>
                  <p className="text-[11px] text-stone-500">
                    Oleh: {auth.name} ({auth.nim || 'Admin'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            {uploadNotice ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center border border-emerald-200 font-bold text-xs flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{uploadNotice}</span>
              </div>
            ) : (
              <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
                {/* PILIHAN MODE UPLOAD */}
                <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadMode('FILE')}
                    className={`py-2 rounded-lg font-bold transition-all text-xs flex items-center justify-center space-x-1.5 ${
                      uploadMode === 'FILE'
                        ? 'bg-white text-[#8c4e24] shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>Upload HP / Laptop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('LINK')}
                    className={`py-2 rounded-lg font-bold transition-all text-xs flex items-center justify-center space-x-1.5 ${
                      uploadMode === 'LINK'
                        ? 'bg-white text-[#8c4e24] shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Link Google Drive</span>
                  </button>
                </div>

                {/* DROPZONE ATAU LINK */}
                {uploadMode === 'FILE' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Pilih Berkas dari Perangkat:</label>
                    <div className="border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-2xl p-4 text-center transition-colors bg-stone-50/50">
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#8c4e24] flex items-center justify-center mx-auto">
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="font-bold text-stone-800 text-xs truncate max-w-[280px] mx-auto">
                            {selectedFile.name}
                          </p>
                          <span className="text-[10px] text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full font-semibold">
                            {formatFileSize(selectedFile.size)}
                          </span>
                          <div>
                            <label
                              htmlFor="reselect-file"
                              className="inline-block mt-1 text-[11px] text-[#8c4e24] font-bold hover:underline cursor-pointer"
                            >
                              Ganti Berkas
                            </label>
                            <input
                              id="reselect-file"
                              type="file"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer block space-y-1.5 py-2">
                          <Upload className="w-6 h-6 text-[#8c4e24] mx-auto" />
                          <p className="font-bold text-stone-700 text-xs">
                            Ketuk untuk memilih berkas dokumen atau foto
                          </p>
                          <p className="text-[10px] text-stone-400">
                            PDF, Word (DOC/DOCX), PPT, Modul, Gambar (Auto-Compress)
                          </p>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-stone-700">Tautan Berkas (Google Drive / URL Publik):</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={uploadFileUrl}
                      onChange={(e) => setUploadFileUrl(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none"
                    />
                  </div>
                )}

                {/* MATA KULIAH */}
                <div>
                  <label className="font-bold text-stone-700">Mata Kuliah Terkait:</label>
                  <select
                    value={uploadCourseId}
                    onChange={(e) => setUploadCourseId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none bg-white font-medium"
                  >
                    <optgroup label="Mata Kuliah Semester 3">
                      {courses
                        .filter((c) => Number(c.semester) === 3)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Lainnya">
                      <option value="custom">Mata Kuliah Lain / Umum (Ketik Manual)</option>
                    </optgroup>
                  </select>

                  {uploadCourseId === 'custom' && (
                    <input
                      type="text"
                      placeholder="Ketik nama mata kuliah / kegiatan..."
                      value={uploadCustomCourse}
                      onChange={(e) => setUploadCustomCourse(e.target.value)}
                      className="w-full mt-2 px-3 py-2 rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none"
                    />
                  )}
                </div>

                {/* SEMESTER & KATEGORI */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-stone-700">Semester:</label>
                    <select
                      value={uploadSemester}
                      onChange={(e) => setUploadSemester(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none bg-white font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700">Kategori:</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none bg-white font-medium"
                    >
                      <option value="TUGAS">Tugas Kuliah</option>
                      <option value="MAKALAH">Makalah</option>
                      <option value="ARTIKEL">Artikel & Jurnal</option>
                      <option value="MODUL">Modul & Buku</option>
                      <option value="RPS">RPS & Silabus</option>
                      <option value="PPT">PPT / Slide</option>
                      <option value="RESUME">Resume & Catatan</option>
                    </select>
                  </div>
                </div>

                {/* JUDUL TUGAS */}
                <div>
                  <label className="font-bold text-stone-700">Judul Tugas / Berkas:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Makalah Hukum Perdata Internasional Kelompok 1"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none"
                  />
                </div>

                {/* PENYUSUN / KELOMPOK */}
                <div>
                  <label className="font-bold text-stone-700">Penyusun / Nama Kelompok:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kelompok 2 (Siti, Ahmad, Budi) atau Nama Anda"
                    value={uploadAuthors}
                    onChange={(e) => setUploadAuthors(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none"
                  />
                </div>

                {/* KETERANGAN OPSIONAL */}
                <div>
                  <label className="font-bold text-stone-700">Keterangan / Catatan (Opsional):</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan tambahan untuk teman sekelas..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none resize-none"
                  />
                </div>

                {uploadProgressText && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 animate-pulse text-center font-bold">
                    ⏳ {uploadProgressText}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#783e18] text-white font-bold transition-colors shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengunggah...' : 'Simpan Berkas'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT GOOGLE DRIVE URL (ADMIN ONLY) */}
      {showDriveEditModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-[#8c4e24]" />
                <h3 className="font-extrabold text-stone-900 text-sm">Pengaturan Google Drive Kelas</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDriveEditModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriveUrl} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700">Tautan Folder Google Drive Utama Kelas:</label>
                <p className="text-[11px] text-stone-500 mb-1.5">
                  Masukkan link share folder Google Drive yang telah Anda buat untuk kelas HK A 2025.
                </p>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newDriveUrlInput}
                  onChange={(e) => setNewDriveUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#8c4e24] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDriveEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#783e18] text-white font-bold shadow-md"
                >
                  Simpan Tautan Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Search,
  Plus,
  Eye,
  Download,
  Trash2,
  Users,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Presentation,
  FileCode,
  FileCheck,
  CheckCircle2,
  Info,
  Folder,
  X,
  Check,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession, LibraryItem, LibraryCategory } from '@/lib/types';

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

export default function CourseLibraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<LibraryCategory>('MAKALAH');
  const [uploadAuthors, setUploadAuthors] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [showDriveGuide, setShowDriveGuide] = useState(false);

  useEffect(() => {
    const init = () => {
      const currentAuth = appStore.getAuth();
      setAuth(currentAuth);
      const allCourses = appStore.getCourses();
      const target = allCourses.find((c) => c.id === courseId) || null;
      setCourse(target);
      setLibraryItems(appStore.getLibraryItems());
    };

    init();
    const unsub = appStore.subscribe(init);
    return () => unsub();
  }, [courseId]);

  const isAdmin = auth?.role === 'ADMIN';

  // Handle submit new task (Admin only)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFileUrl.trim() || !course) {
      alert('Mohon isi judul karya dan tautan berkas!');
      return;
    }

    setIsSubmitting(true);
    try {
      appStore.addLibraryItem({
        courseId: course.id,
        courseName: course.name,
        semester: Number(course.semester) || 3,
        title: uploadTitle.trim(),
        category: uploadCategory,
        authors: uploadAuthors.trim() || 'Mahasiswa HK A',
        fileUrl: uploadFileUrl.trim(),
        description: uploadDescription.trim() || undefined,
        uploadedByNim: auth?.nim || 'ADMIN',
        uploadedByName: auth?.name || 'Administrator',
      });

      setUploadNotice('Berkas berhasil disimpan ke mata kuliah ini!');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadNotice(null);
        setUploadTitle('');
        setUploadFileUrl('');
        setUploadDescription('');
      }, 1000);
    } catch (err) {
      alert('Gagal menyimpan berkas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (item: LibraryItem) => {
    if (!confirm(`Hapus berkas "${item.title}"?`)) return;
    appStore.deleteLibraryItem(item.id);
  };

  // Filter tasks for this course
  const courseItems = useMemo(() => {
    return libraryItems.filter((item) => {
      const matchCourse = item.courseId === courseId;
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || item.title.toLowerCase().includes(q) || item.authors.toLowerCase().includes(q);
      return matchCourse && matchCat && matchQuery;
    });
  }, [libraryItems, courseId, selectedCategory, searchQuery]);

  // If user not logged in
  if (!auth) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl text-center space-y-5">
          <h2 className="text-lg font-bold text-stone-900">Akses Terbatas</h2>
          <p className="text-xs text-stone-600">Silakan login untuk mengakses berkas mata kuliah ini.</p>
          <Link
            href="/login"
            className="inline-flex px-5 py-2.5 rounded-xl bg-[#8c4e24] text-white font-bold text-xs shadow-md"
          >
            Masuk Portal
          </Link>
        </div>
      </div>
    );
  }

  // If course not found
  if (!course) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-lg font-bold text-stone-900">Mata Kuliah Tidak Ditemukan</h2>
        <Link
          href="/library"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#8c4e24] text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke E-Library</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* TOP NAVIGATION BACK BUTTON */}
        <div className="flex items-center justify-between">
          <Link
            href="/library"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#8c4e24] hover:underline p-1.5 -ml-1.5 rounded-xl transition-all select-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Mata Kuliah (Semester {course.semester})</span>
          </Link>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setUploadTitle('');
                setUploadFileUrl('');
                setUploadAuthors('');
                setUploadDescription('');
                setUploadNotice(null);
                setShowUploadModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload Tugas (Mode Admin)</span>
            </button>
          )}
        </div>

        {/* COURSE HEADER HERO CARD */}
        <div className="bg-gradient-to-br from-[#1a0f08] via-[#2d180d] to-[#120703] rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-amber-900/40">
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/15 text-amber-300 border border-white/15">
                {course.code}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-semibold">
                {course.sks} SKS • Semester {course.semester}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                {courseItems.length} Berkas Tersedia
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {course.name}
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-1">
                Dosen Pengampu: <strong className="text-white font-bold">{course.dosen}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul tugas, makalah, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['ALL', 'MAKALAH', 'ARTIKEL', 'PPT', 'RESUME', 'TUGAS', 'MODUL'].map((cat) => {
              const isSelected = selectedCategory === cat;
              const label = cat === 'ALL' ? 'Semua Berkas' : cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#8c4e24] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DAFTAR KOTAK TUGAS COKLAT MEWAH & MINIMALIS */}
        <div className="space-y-3.5">
          {courseItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-stone-300 text-center space-y-3 shadow-xs">
              <Folder className="w-10 h-10 text-stone-300 mx-auto" />
              <h4 className="font-bold text-stone-800 text-sm">Belum Ada Berkas di Mata Kuliah Ini</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {isAdmin
                  ? 'Sebagai Admin, Anda dapat mengunggah makalah atau tugas pertama menggunakan tombol di bawah.'
                  : 'Belum ada tugas atau materi yang diunggah untuk mata kuliah ini oleh Admin.'}
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#8c4e24] text-white font-bold text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Unggah Berkas Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            courseItems.map((item) => {
              const downloadLink = getDownloadUrl(item.fileUrl);

              return (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-[#2a1408] via-[#381a0b] to-[#1e0d04] text-white rounded-2xl p-4 sm:p-5 border border-amber-500/40 shadow-md hover:shadow-xl hover:border-amber-400/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
                >
                  {/* Sisi Kiri: Jenis Tugas, Mata Kuliah, & Judul (Tanpa teks berlebihan) */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Jenis Tugas Badge Emas */}
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {/* Mata Kuliah */}
                      <span className="text-[11px] font-semibold text-stone-300">
                        {course.name}
                      </span>
                    </div>

                    {/* Judul Tugas */}
                    <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  {/* Sisi Kanan: Tombol [Lihat] & [Download] */}
                  <div className="flex items-center justify-end space-x-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    {/* Tombol LIHAT */}
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all flex items-center space-x-1.5 active:scale-95 shadow-xs"
                      title="Lihat Dokumen"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Lihat</span>
                    </a>

                    {/* Tombol DOWNLOAD */}
                    <a
                      href={downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
                      title="Download Dokumen"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-950" />
                      <span>Download</span>
                    </a>

                    {/* Tombol Hapus khusus Admin */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        title="Hapus Berkas (Admin)"
                        className="p-2 rounded-xl border border-rose-400/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL UPLOAD TUGAS (KHUSUS MODE ADMIN) */}
      {showUploadModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-black text-stone-900 text-base">Upload Tugas (Mode Admin)</h3>
                <p className="text-xs text-stone-500">{course.name}</p>
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
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[#723f1c] text-xs font-semibold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{uploadNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Jenis Dokumen</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as LibraryCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30"
                >
                  <option value="MAKALAH">Makalah</option>
                  <option value="ARTIKEL">Artikel Ilmiah</option>
                  <option value="PPT">Slide Presentasi (PPT)</option>
                  <option value="RESUME">Resume & Catatan</option>
                  <option value="TUGAS">Tugas Proyek</option>
                  <option value="MODUL">Modul & Buku</option>
                  <option value="RPS">RPS & Silabus</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Tugas / Karya</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Makalah Analisis Hak Hadhanah Anak"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-700">Tautan Berkas (Google Drive)</label>
                  <button
                    type="button"
                    onClick={() => setShowDriveGuide(!showDriveGuide)}
                    className="text-[10px] text-[#8c4e24] underline"
                  >
                    Panduan Drive
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={uploadFileUrl}
                  onChange={(e) => setUploadFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px]"
                />
                {showDriveGuide && (
                  <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200">
                    Pastikan akses file di Google Drive diset ke &quot;Siapa saja yang memiliki link&quot;.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#8c4e24] hover:bg-[#723f1c] text-white font-bold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

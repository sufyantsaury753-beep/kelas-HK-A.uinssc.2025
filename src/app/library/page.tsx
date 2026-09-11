'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Library,
  GraduationCap,
  Search,
  Plus,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Layers,
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
  Check,
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

export default function LibraryDirectoryPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [activeSemester, setActiveSemester] = useState<number>(3);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload modal for Admin only
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

  const isAdmin = auth?.role === 'ADMIN';

  // Filter courses for the selected semester and search query
  const filteredSemesterCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSem = Number(c.semester) === Number(selectedSemester);
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.dosen.toLowerCase().includes(q);
      return matchSem && matchQuery;
    });
  }, [courses, selectedSemester, searchQuery]);

  // Handle Admin Save
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFileUrl.trim()) {
      alert('Mohon isi judul dan link berkas!');
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
        authors: uploadAuthors.trim() || 'Mahasiswa HK A',
        fileUrl: uploadFileUrl.trim(),
        description: uploadDescription.trim() || undefined,
        uploadedByNim: auth?.nim || 'ADMIN',
        uploadedByName: auth?.name || 'Administrator',
      });

      setUploadNotice('Berkas berhasil disimpan!');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadNotice(null);
      }, 900);
    } catch (err) {
      alert('Gagal menyimpan berkas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#8c4e24] flex items-center justify-center mx-auto">
            <Library className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-stone-900">Perpustakaan & Repositori Tugas</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            Koleksi makalah dan materi perkuliahan kelas Hukum Keluarga A 2025 hanya dapat diakses setelah login.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full py-3 rounded-2xl bg-[#8c4e24] text-white font-bold text-xs justify-center items-center space-x-2"
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
        {/* BREADCRUMB & HERO */}
        <div className="space-y-3">
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

          <div className="bg-gradient-to-br from-[#1a0f08] via-[#2d180d] to-[#120703] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-amber-900/40">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>E-Repository & Digital Library</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Perpustakaan & Repositori Tugas HK A 2025
                </h1>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Pilih semester dan klik lingkaran mata kuliah untuk masuk ke halaman berkas tugas, makalah, dan materi presentasi.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadSemester(selectedSemester);
                    const sc = courses.filter((c) => Number(c.semester) === Number(selectedSemester));
                    setUploadCourseId(sc[0]?.id || 'custom');
                    setUploadTitle('');
                    setUploadFileUrl('');
                    setUploadNotice(null);
                    setShowUploadModal(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Unggah Tugas (Mode Admin)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SEMESTER SELECTION PILLS (1 to 8) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-[#8c4e24]" />
              <span>Pilih Semester Perkuliahan</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              Semester Aktif: <strong className="text-[#8c4e24]">Semester {activeSemester}</strong>
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
                  className={`py-2.5 px-2 rounded-2xl text-center transition-all relative border outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${
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

        {/* TAMPILAN MATA KULIAH BULAT MEWAH (KLIK MASUK KE HALAMAN BARU) */}
        <section className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8c4e24] border border-amber-200 flex items-center justify-center shadow-2xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  Daftar Mata Kuliah Semester {selectedSemester}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Klik lingkaran mata kuliah untuk membuka halaman berkas tugas:
                </p>
              </div>
            </div>

            {/* Live Search for courses */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mata kuliah..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c4e24]/30"
              />
            </div>
          </div>

          {/* CIRCULAR BUBBLES GRID */}
          {filteredSemesterCourses.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              Tidak ada mata kuliah yang cocok dengan kata kunci &quot;{searchQuery}&quot; di Semester {selectedSemester}.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-y-7 gap-x-2 sm:gap-5 py-2">
              {filteredSemesterCourses.map((c) => {
                const CourseIcon = getCourseIcon(c.id, c.name);
                const courseFilesCount = libraryItems.filter(
                  (i) => Number(i.semester) === Number(selectedSemester) && i.courseId === c.id
                ).length;

                return (
                  <Link
                    key={c.id}
                    href={`/library/${c.id}`}
                    className="group flex flex-col items-center text-center focus:outline-none transition-all hover:-translate-y-1 active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]"
                  >
                    {/* Circular Bubble with luxury espresso gradient & golden ring */}
                    <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-gradient-to-b from-[#2a1306] via-[#1c0c04] to-[#100602] text-white p-1 shadow-md shadow-amber-950/30 group-hover:shadow-xl group-hover:shadow-[#8c4e24]/30 transition-all duration-300 flex flex-col items-center justify-center border-2 border-amber-500/40 group-hover:border-amber-300 group-hover:scale-105">
                      <div className="absolute inset-1 rounded-full bg-radial from-amber-500/10 to-transparent pointer-events-none" />
                      <CourseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 mb-1 relative z-10" />
                      <span className="relative z-10 text-[9px] sm:text-[10px] font-mono font-extrabold text-amber-200/95 tracking-tight px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/25">
                        {c.sks} SKS
                      </span>
                    </div>

                    <span className="text-[11px] sm:text-xs font-bold text-stone-900 mt-2 line-clamp-2 max-w-[90px] sm:max-w-[105px] leading-tight group-hover:text-[#8c4e24] transition-colors">
                      {c.name}
                    </span>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full mt-1 font-semibold ${
                        courseFilesCount > 0
                          ? 'bg-amber-100 text-[#723f1c] font-bold'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {courseFilesCount} Berkas →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* MODAL UPLOAD TUGAS (KHUSUS MODE ADMIN) */}
      {showUploadModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-black text-stone-900 text-base">Unggah Tugas Baru (Admin)</h3>
                <p className="text-xs text-stone-500">Perpustakaan Digital HK A 2025</p>
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
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Semester</label>
                  <select
                    value={uploadSemester}
                    onChange={(e) => {
                      const sem = Number(e.target.value);
                      setUploadSemester(sem);
                      const sc = courses.filter((c) => Number(c.semester) === sem);
                      setUploadCourseId(sc[0]?.id || 'custom');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Jenis Dokumen</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as LibraryCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold"
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
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mata Kuliah</label>
                <select
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold"
                >
                  {courses
                    .filter((c) => Number(c.semester) === Number(uploadSemester))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  <option value="custom">+ Tulis Manual</option>
                </select>
              </div>

              {uploadCourseId === 'custom' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nama Mata Kuliah Baru</label>
                  <input
                    type="text"
                    required
                    value={uploadCustomCourse}
                    onChange={(e) => setUploadCustomCourse(e.target.value)}
                    placeholder="Nama mata kuliah..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Tugas / Karya</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Makalah Analisis Hak Hadhanah Anak"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tautan Berkas (Google Drive)</label>
                <input
                  type="url"
                  required
                  value={uploadFileUrl}
                  onChange={(e) => setUploadFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px]"
                />
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

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  BookOpen,
  UserPlus,
  Upload,
  Sparkles,
  KeyRound,
  Trash2,
  Edit2,
  FileText,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Bell,
  Database,
  Calendar,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, Student, Announcement, AuthSession, Gender } from '@/lib/types';
import { parsePdfRoster, parseCsvRoster } from '@/lib/pdfParser';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<'PJ' | 'STUDENTS' | 'ANNOUNCEMENTS' | 'SETTINGS'>('PJ');

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [adminPin, setAdminPin] = useState<string>('');

  // Modals & Form States
  const [searchStudent, setSearchStudent] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newNim, setNewNim] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('L');

  // PJ Assignment Modal
  const [selectedCourseForPj, setSelectedCourseForPj] = useState<Course | null>(null);
  const [pjModalSearch, setPjModalSearch] = useState('');

  // PDF / CSV Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Student[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Announcement Form Modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'PENTING' | 'AKADEMIK' | 'TUGAS' | 'UMUM'>('AKADEMIK');

  // Change Admin Pin
  const [newMasterPin, setNewMasterPin] = useState('');
  const [pinNotice, setPinNotice] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const currentAuth = appStore.getAuth();
      if (!currentAuth || currentAuth.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setAuth(currentAuth);
      setCourses(appStore.getCourses());
      setStudents(appStore.getStudents());
      setAnnouncements(appStore.getAnnouncements());
      setAdminPin(appStore.getAdminPin());
    };

    update();
    const unsub = appStore.subscribe(update);
    return () => unsub();
  }, [router]);

  if (!auth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#9d5f2f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle Add Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNim || !newName) return;

    const success = appStore.addStudent({
      nim: newNim.trim(),
      name: newName.trim(),
      gender: newGender,
      isPinSet: false,
      status: 'AKTIF',
      createdAt: new Date().toISOString().split('T')[0],
    });

    if (success) {
      setShowAddStudentModal(false);
      setNewNim('');
      setNewName('');
    } else {
      alert('NIM sudah terdaftar di sistem!');
    }
  };

  // Handle Reset PIN
  const handleResetPin = (student: Student) => {
    if (confirm(`Reset PIN untuk ${student.name} (${student.nim})? Mahasiswa akan diminta membuat PIN baru saat login berikutnya.`)) {
      appStore.updateStudent(student.nim, {
        pin: undefined,
        isPinSet: false,
      });
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Hapus ${student.name} (${student.nim}) dari Whitelist kelas? Tindakan ini akan mencabut akses login mahasiswa ini.`)) {
      appStore.deleteStudent(student.nim);
    }
  };

  // Toggle PJ assignment for a student on selected course
  const handleTogglePj = (courseId: string, studentNim: string) => {
    const crs = courses.find((c) => c.id === courseId);
    if (!crs) return;

    let updatedPjs = [...crs.pjNims];
    if (updatedPjs.includes(studentNim)) {
      updatedPjs = updatedPjs.filter((p) => p !== studentNim);
    } else {
      updatedPjs.push(studentNim);
    }

    appStore.assignPj(courseId, updatedPjs);
  };

  // Handle PDF File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setUploadError(null);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const res = await parsePdfRoster(file);
        if (res.success && res.data.length > 0) {
          setParsedPreview(res.data);
        } else {
          setUploadError(res.error || 'Tidak dapat membaca tabel mahasiswa dari PDF.');
        }
      } else {
        // Assume text / csv
        const text = await file.text();
        const res = parseCsvRoster(text);
        if (res.length > 0) {
          setParsedPreview(res);
        } else {
          setUploadError('Format berkas CSV tidak memuat kolom NIM dan Nama yang valid.');
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal memproses berkas.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyImport = (replace: boolean) => {
    if (parsedPreview.length === 0) return;
    appStore.importStudents(parsedPreview, replace);
    setShowUploadModal(false);
    setParsedPreview([]);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  // Handle Create Announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    appStore.addAnnouncement({
      title: annTitle,
      content: annContent,
      category: annCategory,
      author: 'Administrator Kelas HK A',
      pinned: true,
    });

    setShowAnnModal(false);
    setAnnTitle('');
    setAnnContent('');
  };

  // Filtered students for student list
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nim.includes(searchStudent)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Admin Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-stone-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-stone-950 flex items-center space-x-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-950" />
              <span>Superadmin Portal</span>
            </span>
            <span className="text-xs text-stone-400 font-mono">HK A 2025 • UIN SSC</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black mt-2 text-white">
            Panel Kendali Utama Administrator
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            Kelola penugasan PJ 11 mata kuliah, whitelist mahasiswa dari PDF, pengumuman, dan sistem presensi.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/pj"
            className="px-4 py-2.5 rounded-xl bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Mode PJ Presensi</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition-all"
          >
            Lihat Beranda Publik
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-stone-200 gap-2 pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('PJ')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'PJ'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Penugasan PJ (11 Mata Kuliah)</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'STUDENTS'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Whitelist Mahasiswa ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Papan Pengumuman</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'SETTINGS'
              ? 'border-[#9d5f2f] text-[#9d5f2f] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Pengaturan & Backup</span>
        </button>
      </div>

      {/* TAB 1: PENUGASAN PJ 11 MATA KULIAH */}
      {activeTab === 'PJ' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Distribusi Penanggung Jawab (PJ) Per Mata Kuliah
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Admin dapat memilih siapa saja dari keseluruhan {students.length} mahasiswa kelas untuk menjadi PJ di masing-masing 11 mata kuliah.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-900 rounded-full w-fit">
              11 Mata Kuliah Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((crs) => {
              const assignedStudents = students.filter((s) => crs.pjNims.includes(s.nim));

              return (
                <div
                  key={crs.id}
                  className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:border-[#9d5f2f] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono font-bold text-[#9d5f2f] bg-amber-50 px-2 py-0.5 rounded">
                        {crs.code}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500">
                        {crs.sks} SKS • {crs.day}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-stone-900 group-hover:text-[#9d5f2f] transition-colors mb-1">
                      {crs.name}
                    </h3>
                    <p className="text-xs text-stone-600 mb-3">{crs.dosen}</p>

                    {/* Assigned PJ List */}
                    <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                        <span>Penanggung Jawab ({assignedStudents.length})</span>
                      </div>

                      {assignedStudents.length === 0 ? (
                        <p className="text-xs text-amber-700 italic py-1">
                          Belum ada PJ yang ditugaskan.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {assignedStudents.map((st) => (
                            <div
                              key={st.nim}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs"
                            >
                              <div>
                                <p className="font-bold text-stone-900">{st.name}</p>
                                <p className="text-[10px] text-stone-400 font-mono">{st.nim}</p>
                              </div>
                              <button
                                onClick={() => handleTogglePj(crs.id, st.nim)}
                                title="Cabut Penugasan PJ"
                                className="text-stone-400 hover:text-red-600 p-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assign PJ Button */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => setSelectedCourseForPj(crs)}
                      className="w-full py-2.5 bg-stone-100 hover:bg-[#9d5f2f] hover:text-white text-stone-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Atur & Tambah PJ Mata Kuliah</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WHITELIST MAHASISWA & UPLOAD PDF */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Daftar Whitelist Mahasiswa Resmi HK A 2025
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Hanya mahasiswa yang tercantum di sini yang diizinkan masuk ke portal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 bg-stone-900 hover:bg-black text-amber-300 text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Unggah Berkas PDF / CSV Roster</span>
              </button>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold rounded-xl shadow-md shadow-[#9d5f2f]/20 transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mahasiswa Manual</span>
              </button>
            </div>
          </div>

          {/* Student Table Card */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIM mahasiswa..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f]"
                />
              </div>
              <span className="text-xs text-stone-500 font-medium">
                Total: <strong>{students.length} Mahasiswa</strong> Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3 w-32">NIM</th>
                    <th className="py-3 px-3">Nama Lengkap</th>
                    <th className="py-3 px-3 text-center w-14">L/P</th>
                    <th className="py-3 px-3 text-center w-28">Status PIN</th>
                    <th className="py-3 px-3">PJ Mata Kuliah</th>
                    <th className="py-3 px-3 text-center w-36">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStudents.map((st, idx) => {
                    const pjForCourses = courses.filter((c) => c.pjNims.includes(st.nim));

                    return (
                      <tr key={st.nim} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-stone-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#9d5f2f]">
                          {st.nim}
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {st.name}
                        </td>
                        <td className="py-3 px-3 text-center text-stone-500 font-semibold">
                          {st.gender}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {st.isPinSet ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PIN Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500">
                              Belum Dibuat
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {pjForCourses.length === 0 ? (
                            <span className="text-stone-400 text-[11px]">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {pjForCourses.map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-semibold"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center space-x-1.5">
                            {st.isPinSet && (
                              <button
                                onClick={() => handleResetPin(st)}
                                title="Reset PIN Keamanan (Beri kesempatan mahasiswa buat PIN baru)"
                                className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStudent(st)}
                              title="Hapus dari Whitelist"
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENGUMUMAN KELAS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Papan Pengumuman & Informasi Kelas</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Pengumuman yang dibuat di sini akan tampil di halaman depan untuk seluruh mahasiswa.
              </p>
            </div>
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold rounded-xl shadow-md shadow-[#9d5f2f]/20 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900">
                      {ann.category}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">{ann.date}</span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 mb-1.5">{ann.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{ann.content}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Diposting oleh: {ann.author}</span>
                  <button
                    onClick={() => appStore.deleteAnnouncement(ann.id)}
                    className="text-stone-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PENGATURAN & BACKUP */}
      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Admin PIN */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Ganti Password Master Admin</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Password saat ini:{' '}
                <code className="bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-800">
                  {adminPin}
                </code>
              </p>
            </div>

            {pinNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                {pinNotice}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Password Admin Baru</label>
                <input
                  type="text"
                  placeholder="Masukkan password baru..."
                  value={newMasterPin}
                  onChange={(e) => setNewMasterPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-900 font-mono"
                />
              </div>
              <button
                onClick={() => {
                  if (newMasterPin.trim().length < 4) {
                    alert('Password admin minimal 4 karakter.');
                    return;
                  }
                  appStore.setAdminPin(newMasterPin.trim());
                  setPinNotice('Password Admin Master berhasil diperbarui!');
                  setNewMasterPin('');
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-amber-300 font-bold rounded-xl transition-colors"
              >
                Simpan Password Baru
              </button>
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Pencadangan & Pemulihan Data</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Simpan seluruh basis data (mahasiswa, PJ, presensi, materi) sebagai file JSON.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <button
                onClick={() => {
                  const data = appStore.exportJson();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Backup_HK_A_2025_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan Basis Data (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('PERINGATAN: Reset ke data bawaan awal 30 mahasiswa HK A 2025? Perubahan manual akan dikembalikan ke kondisi awal.')) {
                    appStore.resetToDefault();
                    alert('Basis data berhasil direset ke data default.');
                  }
                }}
                className="w-full py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl transition-colors"
              >
                Reset Basis Data ke Kondisi Awal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN PJ FOR A COURSE */}
      {selectedCourseForPj && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded text-amber-200">
                  {selectedCourseForPj.code}
                </span>
                <h3 className="text-base font-bold mt-1">
                  Penugasan PJ: {selectedCourseForPj.name}
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Centang mahasiswa dari daftar di bawah untuk menjadikannya PJ mata kuliah ini.
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseForPj(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-stone-200 bg-stone-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari mahasiswa untuk ditugaskan..."
                  value={pjModalSearch}
                  onChange={(e) => setPjModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] bg-white"
                />
              </div>
            </div>

            {/* Student Checkbox List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-1.5">
              {students
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(pjModalSearch.toLowerCase()) ||
                    s.nim.includes(pjModalSearch)
                )
                .map((st) => {
                  const isChecked = selectedCourseForPj.pjNims.includes(st.nim);

                  return (
                    <label
                      key={st.nim}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50/80 border-[#9d5f2f] text-stone-900'
                          : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePj(selectedCourseForPj.id, st.nim)}
                          className="w-4 h-4 rounded text-[#9d5f2f] focus:ring-[#9d5f2f]"
                        />
                        <div>
                          <p className="font-bold text-xs">{st.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">NIM: {st.nim}</p>
                        </div>
                      </div>
                      {isChecked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#9d5f2f] text-white">
                          Ditugaskan PJ
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedCourseForPj(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNGGAH PDF / CSV ROSTER */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Unggah PDF Daftar Kelas / SK Mahasiswa</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Sistem otomatis mengekstrak NIM dan Nama mahasiswa langsung di browser.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedPreview([]);
                  setUploadError(null);
                }}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="border-2 border-dashed border-stone-300 hover:border-[#9d5f2f] rounded-2xl p-6 text-center transition-colors bg-stone-50">
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="font-semibold text-stone-700">
                  Pilih file PDF atau CSV (Daftar Mahasiswa)
                </p>
                <p className="text-[11px] text-stone-400 mt-1 mb-3">
                  Mendukung berkas SK, pembagian kelompok, atau daftar absensi resmi UIN SSC.
                </p>
                <input
                  type="file"
                  accept=".pdf,.csv,.txt"
                  onChange={handleFileUpload}
                  className="block mx-auto text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#9d5f2f] file:text-white hover:file:bg-[#864d23]"
                />
              </div>

              {isParsing && (
                <div className="text-center py-4 text-xs text-stone-500 font-medium">
                  Sedang membaca berkas dan mengekstrak tabel mahasiswa...
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {parsedPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">
                      Pratinjau Hasil Pembacaan: {parsedPreview.length} Mahasiswa
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      ✓ Berhasil diurai
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100">
                    {parsedPreview.map((st, i) => (
                      <div key={i} className="p-2 flex items-center justify-between text-xs">
                        <span className="font-mono text-[#9d5f2f] font-bold">{st.nim}</span>
                        <span className="font-medium text-stone-800">{st.name}</span>
                        <span className="text-stone-400">{st.gender}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => handleApplyImport(false)}
                      className="w-1/2 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl font-bold shadow-sm"
                    >
                      Gabungkan (Merge)
                    </button>
                    <button
                      onClick={() => handleApplyImport(true)}
                      className="w-1/2 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl font-bold shadow-sm"
                    >
                      Gantikan Semua (Replace)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MAHASISWA MANUAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Tambah Mahasiswa ke Whitelist</h3>
            <p className="text-xs text-stone-500 mb-4">
              Mahasiswa baru ini akan langsung diizinkan login menggunakan NIM-nya.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nomor Induk Mahasiswa (NIM)</label>
                <input
                  type="text"
                  placeholder="Contoh: 2530311090"
                  value={newNim}
                  onChange={(e) => setNewNim(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Zakaria"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Jenis Kelamin</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="w-1/3 py-2 border border-stone-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#9d5f2f] text-white font-bold rounded-xl shadow-sm"
                >
                  Simpan Mahasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT PENGUMUMAN */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Buat Pengumuman Baru</h3>
            <p className="text-xs text-stone-500 mb-4">
              Pemberitahuan untuk seluruh anggota kelas HK A 2025.
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  placeholder="Contoh: Perubahan Jadwal Ujian Tengah Semester"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Kategori</label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  <option value="PENTING">Penting</option>
                  <option value="AKADEMIK">Akademik</option>
                  <option value="TUGAS">Tugas</option>
                  <option value="UMUM">Umum</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Isi Pengumuman</label>
                <textarea
                  rows={3}
                  placeholder="Rincian informasi atau pengumuman..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="w-1/3 py-2 border border-stone-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#9d5f2f] text-white font-bold rounded-xl shadow-sm"
                >
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

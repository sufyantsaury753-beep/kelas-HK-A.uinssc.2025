'use client';

import React from 'react';
import { Course, AttendanceSession, AttendanceRecord, Student } from '@/lib/types';
import { Printer, Download, X, CheckCircle2 } from 'lucide-react';
import { exportSingleSessionCsv } from '@/lib/exportUtils';

interface AttendanceSheetPrintProps {
  course: Course;
  session: AttendanceSession;
  students: Student[];
  records: AttendanceRecord[];
  onClose: () => void;
}

export default function AttendanceSheetPrint({
  course,
  session,
  students,
  records,
  onClose,
}: AttendanceSheetPrintProps) {
  // CRITICAL: Filter only records for THIS specific session!
  const sessionRecords = records.filter(
    (r) => !r.sessionId || r.sessionId === session.id
  );

  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alpaCount = 0;
  let dispensasiCount = 0;

  students.forEach((st) => {
    const rec = sessionRecords.find((r) => r.studentNim.trim() === st.nim.trim());
    const status = rec ? rec.status : 'ALPA';
    if (status === 'HADIR') hadirCount++;
    else if (status === 'IZIN') izinCount++;
    else if (status === 'SAKIT') sakitCount++;
    else if (status === 'DISPENSASI') dispensasiCount++;
    else alpaCount++;
  });

  const total = students.length;
  const pct = total > 0 ? (((hadirCount + dispensasiCount) / total) * 100).toFixed(1) : '0';

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    exportSingleSessionCsv(course, session, students, sessionRecords);
  };

  const pjStudents = students.filter((s) => course.pjNims.includes(s.nim));
  const pjNames = pjStudents.length > 0 ? pjStudents.map((s) => s.name).join(' & ') : 'Penanggung Jawab MK';

  const cleanCourseName = (course.name || '').replace(/[’‘]/g, "'");
  const cleanCourseCode = (course.code || '').replace(/[–—]/g, "-");

  const formattedDate = (() => {
    try {
      const parts = session.date.split('-');
      const d =
        parts.length === 3
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          : new Date(session.date);
      if (isNaN(d.getTime())) return `${course.day}, ${session.date}`;
      const dayName = course.day || d.toLocaleDateString('id-ID', { weekday: 'long' });
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthName = d.toLocaleDateString('id-ID', { month: 'long' });
      const yearNum = d.getFullYear();
      return `${dayName}, ${dayNum} ${monthName} ${yearNum}`;
    } catch {
      return `${course.day}, ${session.date}`;
    }
  })();

  const formattedDateOnly = (() => {
    try {
      const parts = session.date.split('-');
      const d =
        parts.length === 3
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          : new Date(session.date);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthName = d.toLocaleDateString('id-ID', { month: 'long' });
      const yearNum = d.getFullYear();
      return `${dayNum} ${monthName} ${yearNum}`;
    } catch {
      return session.date;
    }
  })();

  return (
    <div
      id="printable-attendance-sheet-wrapper"
      className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full print:h-auto print:block"
    >
      <div
        id="printable-attendance-sheet"
        className="bg-white text-stone-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200 my-6 print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:border-none print:rounded-none print:overflow-visible"
      >
        {/* Action Header - Hidden when printing */}
        <div className="no-print bg-stone-100 p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Pratinjau Cetak Lembar Presensi Resmi
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
              Siap Cetak / Simpan PDF
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCsvDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-[#9d5f2f] hover:bg-[#864d23] text-white text-xs font-bold shadow-md shadow-[#9d5f2f]/20 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-xl transition-colors ml-2"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 sm:p-10 print:p-0 font-sans text-stone-900">
          {/* Kop Surat Resmi Universitas */}
          <div className="text-center pb-2 mb-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-800">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </h3>
            <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-stone-950 mt-0.5">
              UNIVERSITAS ISLAM NEGERI SIBER SYEKH NURJATI CIREBON
            </h1>
            <h2 className="text-xs sm:text-sm font-bold uppercase text-stone-800 mt-0.5">
              FAKULTAS SYARIAH — PROGRAM STUDI HUKUM KELUARGA (AHWAL SYAKHSHIYYAH)
            </h2>
            <p className="text-[10px] text-stone-600 mt-0.5">
              Alamat: Jl. Perjuangan, Sunyaragi, Kec. Kesambi, Kota Cirebon, Jawa Barat 45132 | Website: syekhnurjati.ac.id
            </p>
            <div className="border-b-2 border-stone-900 mt-2 mb-0.5"></div>
            <div className="border-b border-stone-900"></div>
          </div>

          {/* Document Title */}
          <div className="text-center my-3">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider underline text-stone-950">
              BERITA ACARA & DAFTAR HADIR PERKULIAHAN
            </h3>
            <p className="text-[11px] font-semibold text-stone-700 mt-0.5 tracking-wide">
              KELAS HUKUM KELUARGA A (HK A) — ANGKATAN 2025 / SEMESTER GANJIL
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs bg-stone-50/70 print:bg-transparent p-3 rounded-lg border border-stone-200 print:border-none mb-3">
            <div className="flex items-center">
              <span className="w-32 text-stone-600 font-medium">Mata Kuliah</span>
              <span className="font-bold text-stone-900">: {cleanCourseName} ({cleanCourseCode})</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 text-stone-600 font-medium">Pertemuan Ke</span>
              <span className="font-bold text-stone-900">: Ke-{session.meetingNumber}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 text-stone-600 font-medium">Dosen Pengampu</span>
              <span className="font-bold text-stone-900">: {course.dosen}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 text-stone-600 font-medium">Hari / Tanggal</span>
              <span className="text-stone-900 font-medium">: {formattedDate}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 text-stone-600 font-medium">Bobot SKS / Ruang</span>
              <span className="text-stone-900 font-medium">: {course.sks} SKS / {course.room}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 text-stone-600 font-medium">Waktu Perkuliahan</span>
              <span className="text-stone-900 font-medium">: {session.startTime} - {session.endTime} WIB</span>
            </div>
            <div className="col-span-2 flex mt-1 pt-1 border-t border-stone-200 print:border-stone-300">
              <span className="w-32 text-stone-600 font-medium flex-shrink-0">Materi / Topik</span>
              <span className="text-stone-900 font-medium italic">: &quot;{session.topic}&quot;</span>
            </div>
          </div>

          {/* Attendance Table */}
          <table className="w-full text-left border-collapse border border-stone-700 font-sans text-[10.5px] mb-3">
            <thead>
              <tr className="bg-stone-100 print:bg-stone-200/80 text-stone-900">
                <th className="border border-stone-600 px-2 py-1 text-center w-8">No</th>
                <th className="border border-stone-600 px-2 py-1 text-center w-28 font-mono">NIM</th>
                <th className="border border-stone-600 px-2.5 py-1">Nama Mahasiswa</th>
                <th className="border border-stone-600 px-2 py-1 text-center w-10">L/P</th>
                <th className="border border-stone-600 px-2 py-1 text-center w-20">Status</th>
                <th className="border border-stone-600 px-2 py-1 text-center w-16">Waktu</th>
                <th className="border border-stone-600 px-2.5 py-1 text-left w-28">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, index) => {
                const rec = sessionRecords.find((r) => r.studentNim.trim() === st.nim.trim());
                const status = rec ? rec.status : 'ALPA';
                const time = rec?.timestamp
                  ? new Date(rec.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : '-';
                const notes = rec?.notes || (status === 'HADIR' ? 'Hadir di kelas' : '-');

                return (
                  <tr
                    key={st.nim}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50/40 print:bg-transparent'}
                  >
                    <td className="border border-stone-400 px-2 py-0.5 text-center text-stone-700">{index + 1}</td>
                    <td className="border border-stone-400 px-2 py-0.5 text-center font-mono text-stone-800">{st.nim}</td>
                    <td className="border border-stone-400 px-2.5 py-0.5 font-semibold text-stone-900">{st.name}</td>
                    <td className="border border-stone-400 px-2 py-0.5 text-center text-stone-700">{st.gender}</td>
                    <td className="border border-stone-400 px-2 py-0.5 text-center font-bold">
                      {status === 'HADIR' && <span className="text-emerald-800">HADIR</span>}
                      {status === 'IZIN' && <span className="text-blue-800">IZIN</span>}
                      {status === 'SAKIT' && <span className="text-amber-800">SAKIT</span>}
                      {status === 'DISPENSASI' && <span className="text-purple-800">DISPENSASI</span>}
                      {status === 'ALPA' && <span className="text-red-800">ALPA</span>}
                    </td>
                    <td className="border border-stone-400 px-2 py-0.5 text-center text-stone-600 font-mono text-[10px]">
                      {time}
                    </td>
                    <td className="border border-stone-400 px-2.5 py-0.5 text-stone-700 text-[10px] whitespace-nowrap">
                      {notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary Box */}
          <div className="font-sans text-xs border border-stone-400 p-2.5 rounded-lg bg-stone-50/50 print:bg-transparent flex flex-wrap items-center justify-between mb-4">
            <div className="space-x-1">
              <span className="font-bold text-stone-900">Rekapitulasi: </span>
              <span>Total: <strong>{total} Mahasiswa</strong> | </span>
              <span className="text-emerald-800 font-bold">Hadir: {hadirCount}</span> |{' '}
              <span className="text-blue-800 font-bold">Izin: {izinCount}</span> |{' '}
              <span className="text-amber-800 font-bold">Sakit: {sakitCount}</span> |{' '}
              <span className="text-purple-800 font-bold">Dispensasi: {dispensasiCount}</span> |{' '}
              <span className="text-red-800 font-bold">Alpa: {alpaCount}</span>
            </div>
            <div className="font-bold text-stone-900 mt-1 sm:mt-0">
              Persentase Kehadiran: <span className="text-[#9d5f2f] font-black">{pct}%</span>
            </div>
          </div>

          {/* Signature Block */}
          <div className="font-sans grid grid-cols-2 gap-8 text-xs pt-4 signature-block">
            <div className="text-center space-y-16">
              <p className="text-stone-800 font-medium">Mengetahui,<br />Dosen Pengampu Mata Kuliah</p>
              <div className="pt-2 border-b border-stone-900 w-52 mx-auto">
                <p className="font-bold text-stone-900">{course.dosen}</p>
              </div>
              <p className="text-[10px] text-stone-600 -mt-14 font-mono">NIP/NIDN. —</p>
            </div>

            <div className="text-center space-y-16">
              <p className="text-stone-800 font-medium">
                Cirebon, {formattedDateOnly}<br />
                Penanggung Jawab (PJ) Mata Kuliah
              </p>
              <div className="pt-2 border-b border-stone-900 w-52 mx-auto">
                <p className="font-bold text-stone-900">{pjNames}</p>
              </div>
              <p className="text-[10px] text-stone-600 -mt-14 font-mono">NIM Mahasiswa PJ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

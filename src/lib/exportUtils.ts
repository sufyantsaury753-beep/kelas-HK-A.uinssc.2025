import { Course, AttendanceSession, AttendanceRecord, Student } from './types';

export function exportSingleSessionCsv(
  course: Course,
  session: AttendanceSession,
  students: Student[],
  records: AttendanceRecord[]
) {
  const dateStr = session.date;
  const title = `REKAPITULASI PRESENSI KELAS HK A 2025`;
  const subTitle = `UIN SIBER SYEKH NURJATI CIREBON — FAKULTAS SYARIAH`;

  const metaRows = [
    [title],
    [subTitle],
    ['Mata Kuliah', course.name],
    ['Kode MK / SKS', `${course.code} / ${course.sks} SKS`],
    ['Dosen Pengampu', course.dosen],
    ['Pertemuan Ke', `Pertemuan ke-${session.meetingNumber}`],
    ['Hari / Tanggal', `${course.day}, ${session.date}`],
    ['Waktu Perkuliahan', `${session.startTime} - ${session.endTime} WIB`],
    ['Ruang Perkuliahan', course.room],
    ['Materi / Topik', `"${session.topic.replace(/"/g, '""')}"`],
    [''],
    ['NO', 'NIM', 'NAMA MAHASISWA', 'JK', 'STATUS KEHADIRAN', 'WAKTU ABSEN', 'METODE', 'CATATAN'],
  ];

  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alpaCount = 0;

  const studentRows = students.map((st, idx) => {
    const rec = records.find((r) => r.studentNim.trim() === st.nim.trim());
    const status = rec ? rec.status : 'ALPA';
    if (status === 'HADIR') hadirCount++;
    else if (status === 'IZIN') izinCount++;
    else if (status === 'SAKIT') sakitCount++;
    else alpaCount++;

    const time = rec?.timestamp ? new Date(rec.timestamp).toLocaleTimeString('id-ID') : '-';
    const method = rec?.verifiedBy === 'MANDIRI' ? 'Presensi Mandiri' : 'Verifikasi PJ';
    const notes = rec?.notes || '-';

    return [
      (idx + 1).toString(),
      `'${st.nim}`, // prevent Excel scientific notation
      st.name,
      st.gender,
      status,
      time,
      method,
      `"${notes.replace(/"/g, '""')}"`,
    ];
  });

  const total = students.length;
  const presentPct = total > 0 ? ((hadirCount / total) * 100).toFixed(1) : '0';

  const summaryRows = [
    [''],
    ['RINGKASAN KEHADIRAN'],
    ['Total Mahasiswa Terdaftar', total.toString()],
    ['Hadir', hadirCount.toString()],
    ['Izin', izinCount.toString()],
    ['Sakit', sakitCount.toString()],
    ['Alpa / Tanpa Keterangan', alpaCount.toString()],
    ['Persentase Kehadiran', `${presentPct}%`],
  ];

  const allRows = [...metaRows, ...studentRows, ...summaryRows];
  const csvContent = '\uFEFF' + allRows.map((r) => r.join(',')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Presensi_HK_A_2025_${course.name.replace(/\s+/g, '_')}_P${session.meetingNumber}_${dateStr}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMatrixAttendanceCsv(
  course: Course,
  sessions: AttendanceSession[],
  students: Student[],
  records: AttendanceRecord[]
) {
  const sortedSessions = [...sessions].sort((a, b) => a.meetingNumber - b.meetingNumber);

  const headerRow = [
    'NO',
    'NIM',
    'NAMA MAHASISWA',
    ...sortedSessions.map((s) => `P${s.meetingNumber} (${s.date})`),
    'HADIR',
    'IZIN',
    'SAKIT',
    'ALPA',
    '% HADIR',
  ];

  const dataRows = students.map((st, idx) => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    const sessionStatuses = sortedSessions.map((sess) => {
      const r = records.find((rec) => rec.sessionId === sess.id && rec.studentNim.trim() === st.nim.trim());
      const stt = r ? r.status : 'ALPA';
      if (stt === 'HADIR') hadir++;
      else if (stt === 'IZIN') izin++;
      else if (stt === 'SAKIT') sakit++;
      else alpa++;
      return stt[0]; // H, I, S, A
    });

    const totalSessions = sortedSessions.length;
    const pct = totalSessions > 0 ? ((hadir / totalSessions) * 100).toFixed(1) + '%' : '0%';

    return [
      (idx + 1).toString(),
      `'${st.nim}`,
      st.name,
      ...sessionStatuses,
      hadir.toString(),
      izin.toString(),
      sakit.toString(),
      alpa.toString(),
      pct,
    ];
  });

  const allRows = [
    [`REKAPITULASI PRESENSI SEMESTER KELAS HK A 2025`],
    [`UIN SIBER SYEKH NURJATI CIREBON — FAKULTAS SYARIAH`],
    [`Mata Kuliah: ${course.name} (${course.code}) | Dosen: ${course.dosen}`],
    [''],
    headerRow,
    ...dataRows,
  ];

  const csvContent = '\uFEFF' + allRows.map((r) => r.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Rekap_Semester_HK_A_2025_${course.name.replace(/\s+/g, '_')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

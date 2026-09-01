// Script to seed HK A 2025 data to Supabase
const url = 'https://xjpkfdalokarxmbousvj.supabase.co/rest/v1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcGtmZGFsb2thcnhtYm91c3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTM3MjksImV4cCI6MjEwMzU2OTcyOX0.ukLS09nUcqYzn9soXrNwngYRfK7hFPnzlH0wkOR69l8';

const headers = {
  'Content-Type': 'application/json',
  'apikey': key,
  'Authorization': 'Bearer ' + key,
  'Prefer': 'resolution=merge-duplicates'
};

const students = [
  { nim: '2530311065', name: 'Moh. Raihan', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311086', name: 'Sufyan Tsaury', gender: 'L', is_pin_set: true, pin: '123456', status: 'AKTIF' },
  { nim: '2530311003', name: 'Wahdan Hamdun', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311063', name: 'Rizqi Asdi Pauzi', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311085', name: 'Syahrul Abdul Latif', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311036', name: 'Annissa Nurdieni Utami', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311043', name: 'Suci Angellina', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311004', name: 'Mishbah Fauzi S R', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311084', name: 'Hujroh Nurullah', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311087', name: 'Fatifatul Alzahra', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311009', name: 'Mohamad Rizky Mubarok', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311089', name: 'Nurlela Hasanah', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311088', name: 'Mohamad Choirun Nabik Endirob', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311010', name: 'Gilang Ahmad Rizqi', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311028', name: 'Titi Zumayka', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311083', name: 'Topan Fadilah', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311061', name: 'Ahmad Hanif Mun\'im', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311060', name: 'Alfin Aufa', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311062', name: 'Alfan Ibnu Sulaeman', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311068', name: 'Mochamad Firmansyah Andika Putra', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311005', name: 'Agung Faujan Ramdani', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311067', name: 'Faiz Nur Fajar', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311069', name: 'Rafa Erlansyah Putra', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311080', name: 'Fahra Siti Al Khumaira', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311031', name: 'Firda Amalinda Hutami', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311081', name: 'Subhan Nur Rochman', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311012', name: 'Pramady Ahmad Faqih', gender: 'L', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311026', name: 'Tasya Larasaty', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311045', name: 'Dhurrotul Khikmah', gender: 'P', is_pin_set: false, status: 'AKTIF' },
  { nim: '2530311049', name: 'Muhammad Hasbiyallah', gender: 'L', is_pin_set: false, status: 'AKTIF' },
];

const courses = [
  {
    id: 'hadits-hukum-keluarga',
    code: 'HKI-301',
    name: 'Hadits Hukum Keluarga',
    dosen: 'Dr. H. Ahmad Dahlan, M.Ag.',
    sks: 2,
    semester: 3,
    day: 'Senin',
    time: '07:30 - 09:10 WIB',
    room: 'Ruang 204 Gedung FASYA',
    pj_nims: ['2530311065', '2530311003'],
    description: 'Kajian hadits-hadits ahkam seputar munakahat, nafkah, hak-kewajiban suami istri, hadhanah, dan thalaq.'
  },
  {
    id: 'hukum-agraria',
    code: 'HKI-302',
    name: 'Hukum Agraria',
    dosen: 'Dr. Hj. Nurul Fadhilah, S.H., M.H.',
    sks: 2,
    semester: 3,
    day: 'Senin',
    time: '09:30 - 11:10 WIB',
    room: 'Ruang 204 Gedung FASYA',
    pj_nims: ['2530311063', '2530311085'],
    description: 'Konsep hukum pertanahan nasional, UUPA No. 5 Tahun 1960, pendaftaran tanah, dan hak milik.'
  },
  {
    id: 'hukum-bisnis-islam',
    code: 'HKI-303',
    name: 'Hukum Bisnis Islam',
    dosen: 'H. M. Syukron, M.E.Sy.',
    sks: 2,
    semester: 3,
    day: 'Selasa',
    time: '08:00 - 09:40 WIB',
    room: 'Ruang 205 Gedung FASYA',
    pj_nims: ['2530311036', '2530311043'],
    description: 'Akad-akad muamalah kontemporer, perbankan syariah, fintech syariah, dan sengketa bisnis.'
  },
  {
    id: 'hukum-kewarisan-islam',
    code: 'HKI-304',
    name: 'Hukum Kewarisan Islam',
    dosen: 'Dr. H. Didin Nurul Rosidin, M.A.',
    sks: 3,
    semester: 3,
    day: 'Selasa',
    time: '10:00 - 12:30 WIB',
    room: 'Ruang 205 Gedung FASYA',
    pj_nims: ['2530311086', '2530311004'],
    description: 'Asas faraidh, rukun waris, hijab-mahjub, mawani\' al-irts, dan implementasi KHI di Indonesia.'
  },
  {
    id: 'hukum-perdata-internasional',
    code: 'HKI-305',
    name: 'Hukum Perdata Internasional',
    dosen: 'Prof. Dr. H. Jamali, M.Ag.',
    sks: 2,
    semester: 3,
    day: 'Rabu',
    time: '08:00 - 09:40 WIB',
    room: 'Ruang 206 Gedung FASYA',
    pj_nims: ['2530311087', '2530311009'],
    description: 'Prinsip HPI, titik taut, kualifikasi hukum, perkawinan campuran, dan adopsi internasional.'
  },
  {
    id: 'hukum-perdata-islam-indonesia',
    code: 'HKI-306',
    name: 'Hukum Perdata Islam di Indonesia',
    dosen: 'Dr. H. Ayep Rosidi, M.Ag.',
    sks: 3,
    semester: 3,
    day: 'Rabu',
    time: '10:00 - 12:30 WIB',
    room: 'Ruang 206 Gedung FASYA',
    pj_nims: ['2530311088', '2530311010'],
    description: 'Positivisasi hukum Islam, Kompilasi Hukum Islam (Inpres No. 1/1991), dan UU Peradilan Agama.'
  },
  {
    id: 'hukum-perkawinan-islam',
    code: 'HKI-307',
    name: 'Hukum Perkawinan Islam',
    dosen: 'Dr. Hj. Masri\'ah, M.Ag.',
    sks: 3,
    semester: 3,
    day: 'Kamis',
    time: '08:00 - 10:30 WIB',
    room: 'Ruang 204 Gedung FASYA',
    pj_nims: ['2530311028', '2530311083'],
    description: 'UU Perkawinan No. 1/1974 jo UU 16/2019, fikih munakahat empat mazhab, dan perceraian.'
  },
  {
    id: 'ilmu-tafsir',
    code: 'HKI-308',
    name: 'Ilmu Tafsir',
    dosen: 'Dr. H. Aan Jaelani, M.Ag.',
    sks: 2,
    semester: 3,
    day: 'Kamis',
    time: '10:45 - 12:25 WIB',
    room: 'Ruang 204 Gedung FASYA',
    pj_nims: ['2530311061', '2530311060'],
    description: 'Kaidah penafsiran Al-Qur\'an, manhaj tafsir, dan asbabun nuzul ayat-ayat ahkam keluarga.'
  },
  {
    id: 'praktik-ibadah-1',
    code: 'HKI-309',
    name: 'Praktik Ibadah 1',
    dosen: 'Drs. H. Anwar Sanusi, M.Ag.',
    sks: 2,
    semester: 3,
    day: 'Jumat',
    time: '07:30 - 09:10 WIB',
    room: 'Masjid Kampus Al-Jami\'ah UIN SSC',
    pj_nims: ['2530311062', '2530311068'],
    description: 'Praktik thaharah, fardhu shalat jenazah, manasik haji/umrah, dan tata cara khutbah.'
  },
  {
    id: 'qowaid-fiqhiyah',
    code: 'HKI-310',
    name: 'Qowaid Fiqhiyah',
    dosen: 'Dr. H. Ilman Nafi\'a, M.Ag.',
    sks: 2,
    semester: 3,
    day: 'Jumat',
    time: '09:30 - 11:10 WIB',
    room: 'Ruang 205 Gedung FASYA',
    pj_nims: ['2530311005', '2530311067'],
    description: 'Lima kaidah asasiyah fiqhiyah (al-qawa\'id al-khams) dan aplikasi fatwa kontemporer.'
  },
  {
    id: 'tarikh-tasyrii',
    code: 'HKI-311',
    name: 'Tarikh Tasyri’i',
    dosen: 'Dr. H. Farihin, M.Pd.',
    sks: 2,
    semester: 3,
    day: 'Sabtu',
    time: '08:30 - 10:10 WIB',
    room: 'Cyber Smart Classroom 3 / Online CIU',
    pj_nims: ['2530311069', '2530311080'],
    description: 'Sejarah pembentukan dan perkembangan hukum Islam dari era Rasulullah hingga era modern.'
  }
];

const announcements = [
  {
    id: 'ann-1',
    title: 'Pemberitahuan Perkuliahan Semester Ganjil 2025/2026',
    content: 'Seluruh mahasiswa HK A 2025 dimohon memeriksa jadwal perkuliahan 11 mata kuliah. Jangan lupa mengisi presensi pada setiap sesi perkuliahan melalui portal ini.',
    category: 'PENTING',
    author: 'Admin Kelas HK A',
    date: '2025-09-01',
    pinned: true
  },
  {
    id: 'ann-2',
    title: 'Pembagian Tugas Makalah & Presentasi Kelompok HKI',
    content: 'Tugas kelompok pemateri mata kuliah Hukum Kewarisan Islam telah ditentukan (14 kelompok). Silakan cek materi masing-masing kelompok pada menu repositori mata kuliah.',
    category: 'TUGAS',
    author: 'PJ Hukum Kewarisan Islam',
    date: '2025-09-01',
    pinned: true
  }
];

async function seed() {
  console.log('Seeding students...');
  const resStudents = await fetch(url + '/students', {
    method: 'POST',
    headers,
    body: JSON.stringify(students)
  });
  console.log('Students status:', resStudents.status);

  console.log('Seeding courses...');
  const resCourses = await fetch(url + '/courses', {
    method: 'POST',
    headers,
    body: JSON.stringify(courses)
  });
  console.log('Courses status:', resCourses.status);

  console.log('Seeding announcements...');
  const resAnn = await fetch(url + '/announcements', {
    method: 'POST',
    headers,
    body: JSON.stringify(announcements)
  });
  console.log('Announcements status:', resAnn.status);

  console.log('All seed operations completed successfully!');
}

seed().catch(console.error);

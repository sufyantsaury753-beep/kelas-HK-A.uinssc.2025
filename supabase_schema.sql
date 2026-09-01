-- ==========================================================
-- SKEMA BASIS DATA SUPABASE UNTUK PORTAL KELAS HK A 2025
-- Fakultas Syariah — UIN Siber Syekh Nurjati Cirebon
-- ==========================================================

-- 1. Tabel Mahasiswa (Whitelist & Auth PIN)
CREATE TABLE IF NOT EXISTS students (
  nim VARCHAR(20) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  gender VARCHAR(2) DEFAULT 'L',
  pin VARCHAR(10),
  is_pin_set BOOLEAN DEFAULT FALSE,
  phone VARCHAR(25),
  status VARCHAR(20) DEFAULT 'AKTIF',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel 11 Mata Kuliah
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  dosen VARCHAR(150) NOT NULL,
  sks INT NOT NULL,
  semester INT DEFAULT 3,
  day VARCHAR(20) NOT NULL,
  time VARCHAR(50) NOT NULL,
  room VARCHAR(100) NOT NULL,
  pj_nims TEXT[] DEFAULT '{}',
  description TEXT,
  drive_link TEXT,
  rps_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Sesi Pertemuan Presensi
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id VARCHAR(60) PRIMARY KEY,
  course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
  meeting_number INT NOT NULL,
  date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  topic TEXT NOT NULL,
  dosen_present BOOLEAN DEFAULT TRUE,
  is_open_for_self_checkin BOOLEAN DEFAULT FALSE,
  checkin_code VARCHAR(10),
  created_by_nim VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Rekam Kehadiran Mahasiswa
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(60) PRIMARY KEY,
  session_id VARCHAR(60) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
  student_nim VARCHAR(20) REFERENCES students(nim) ON DELETE CASCADE,
  status VARCHAR(15) NOT NULL CHECK (status IN ('HADIR', 'IZIN', 'SAKIT', 'ALPA', 'DISPENSASI')),
  notes TEXT,
  verified_by VARCHAR(30) DEFAULT 'PJ',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_nim)
);

-- 5. Tabel Repositori Berkas & Materi Kuliah
CREATE TABLE IF NOT EXISTS course_materials (
  id VARCHAR(60) PRIMARY KEY,
  course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('RPS', 'MODUL', 'MAKALAH', 'PPT', 'TUGAS', 'LINK')),
  url TEXT NOT NULL,
  description TEXT,
  uploaded_by VARCHAR(100),
  uploaded_at DATE DEFAULT CURRENT_DATE
);

-- 6. Tabel Papan Pengumuman Kelas
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(60) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(20) NOT NULL,
  author VARCHAR(100) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  pinned BOOLEAN DEFAULT FALSE
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (Read & Insert/Update untuk Client Portal HK A)
CREATE POLICY "Public read all students" ON students FOR SELECT USING (true);
CREATE POLICY "Public update students" ON students FOR ALL USING (true);

CREATE POLICY "Public read all courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public update courses" ON courses FOR ALL USING (true);

CREATE POLICY "Public read all sessions" ON attendance_sessions FOR ALL USING (true);
CREATE POLICY "Public read all records" ON attendance_records FOR ALL USING (true);
CREATE POLICY "Public read all materials" ON course_materials FOR ALL USING (true);
CREATE POLICY "Public read all announcements" ON announcements FOR ALL USING (true);

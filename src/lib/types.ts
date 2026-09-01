export type Gender = 'L' | 'P';

export interface Student {
  nim: string;
  name: string;
  gender: Gender;
  pin?: string;
  isPinSet: boolean;
  phone?: string;
  email?: string;
  status: 'AKTIF' | 'CUTI' | 'NONAKTIF';
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  dosen: string;
  dosenNip?: string;
  sks: number;
  semester: number;
  day: string;
  time: string;
  room: string;
  pjNims: string[]; // List of student NIMs assigned as Penanggung Jawab
  description: string;
  driveLink?: string;
  rpsLink?: string;
  whatsappGroupLink?: string;
}

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';

export interface AttendanceSession {
  id: string;
  courseId: string;
  meetingNumber: number; // 1 to 16
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  dosenPresent: boolean;
  isOpenForSelfCheckin: boolean;
  checkinCode?: string; // 4-digit code if self check-in is enabled
  createdAt: string;
  createdByNim: string; // PJ or Admin who opened the session
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId: string;
  studentNim: string;
  status: AttendanceStatus;
  notes?: string;
  timestamp: string;
  verifiedBy: string; // 'PJ' or 'MANDIRI' or 'ADMIN'
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  type: 'RPS' | 'MODUL' | 'MAKALAH' | 'PPT' | 'TUGAS' | 'LINK';
  url: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'PENTING' | 'AKADEMIK' | 'TUGAS' | 'UMUM';
  author: string;
  date: string;
  pinned?: boolean;
}

export type UserRole = 'ADMIN' | 'PJ' | 'MAHASISWA';

export interface AuthSession {
  role: UserRole;
  nim?: string;
  name: string;
  assignedCourseIds?: string[]; // for PJ
  isLoggedIn: boolean;
}

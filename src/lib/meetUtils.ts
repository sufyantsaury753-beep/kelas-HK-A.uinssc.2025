import { Course } from './types';

// Generate secure lecturer access token for a course
export function generateLecturerToken(courseId: string, courseCode: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(`dosen:${courseId}:${courseCode}:hka2025`).toString('base64');
  }
  return btoa(`dosen:${courseId}:${courseCode}:hka2025`);
}

// Verify if a lecturer token matches the course
export function verifyLecturerToken(courseId: string, courseCode: string, token: string): boolean {
  if (!token) return false;
  try {
    let decoded = '';
    if (typeof window === 'undefined') {
      decoded = Buffer.from(token, 'base64').toString('utf-8');
    } else {
      decoded = atob(token);
    }
    const [role, id, code, secret] = decoded.split(':');
    return role === 'dosen' && id === courseId && code === courseCode && secret === 'hka2025';
  } catch {
    return false;
  }
}

// Generate unique, clean Jitsi Room Name per course
export function getCourseRoomName(courseId: string): string {
  const cleanId = courseId.replace(/[^a-zA-Z0-9]/g, '');
  return `hka2025uinssc${cleanId}`;
}

// Format polite WhatsApp invite message for the lecturer
export function getLecturerInviteMessage(course: Course, baseUrl: string): string {
  const token = generateLecturerToken(course.id, course.code);
  const meetUrl = `${baseUrl}/kuliah-online/${course.id}?role=dosen&token=${encodeURIComponent(token)}`;

  return `Assalamu'alaikum Wr. Wb.

Yth. Bapak/Ibu Dosen Pengampu:
*${course.dosen}*

Berikut tautan ruang tatap muka virtual (kuliah online) untuk perkuliahan:
📚 Mata Kuliah: *${course.name} (${course.code})*
⏱️ Jadwal: *${course.day}, ${course.time}*
🏛️ Kelas: *Hukum Keluarga A (HK A) 2025* — Fakultas Syariah UIN Siber Syekh Nurjati Cirebon

🔗 *Tautan Ruang Kuliah Khusus Dosen:*
${meetUrl}

_Catatan: Bapak/Ibu otomatis bergabung sebagai Dosen Pengampu tanpa perlu registrasi atau login akun._

Terima kasih atas bimbingan dan waktu Bapak/Ibu.
Wassalamu'alaikum Wr. Wb.

_Pengurus & Penanggung Jawab (PJ) Kelas HK A 2025_`;
}

// Format WhatsApp invite message for students in class group
export function getStudentInviteMessage(course: Course, baseUrl: string): string {
  const meetUrl = `${baseUrl}/kuliah-online/${course.id}`;

  return `📢 *PENGUMUMAN KULIAH ONLINE HK A 2025*

Rekan-rekan mahasiswa Kelas Hukum Keluarga A 2025, ruang tatap muka online untuk perkuliahan telah dibuka:

📚 *${course.name} (${course.sks} SKS)*
👤 Dosen: ${course.dosen}
⏱️ Waktu: ${course.day}, ${course.time}

🔗 *Tautan Masuk Ruang Kuliah:*
${meetUrl}

_Pastikan sudah login akun mahasiswa HK A terlebih dahulu untuk masuk ke ruang perkuliahan._

Terima kasih, mohon hadir tepat waktu!`;
}

import { Course } from './types';

export type MeetingPlatform = 'gmeet' | 'zoom' | 'teams' | 'other' | 'none';

export interface PlatformInfo {
  platform: MeetingPlatform;
  label: string;
  actionText: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
}

// Detect whether the link is Google Meet, Zoom, MS Teams, etc.
export function detectMeetingPlatform(url?: string): PlatformInfo {
  if (!url || !url.trim()) {
    return {
      platform: 'none',
      label: 'Belum Ada Link',
      actionText: 'Belum Ada Link',
      shortLabel: 'Kosong',
      badgeBg: 'bg-stone-100 text-stone-500 border-stone-200',
      badgeText: 'text-stone-500',
    };
  }

  const clean = url.trim().toLowerCase();
  if (clean.includes('meet.google.com')) {
    return {
      platform: 'gmeet',
      label: 'Google Meet',
      actionText: 'Gabung Google Meet',
      shortLabel: 'GMeet',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeText: 'text-emerald-700',
    };
  }
  if (clean.includes('zoom.us')) {
    return {
      platform: 'zoom',
      label: 'Zoom Meeting',
      actionText: 'Gabung Zoom',
      shortLabel: 'Zoom',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
      badgeText: 'text-blue-700',
    };
  }
  if (clean.includes('teams.microsoft.com') || clean.includes('teams.live.com')) {
    return {
      platform: 'teams',
      label: 'Microsoft Teams',
      actionText: 'Gabung Teams',
      shortLabel: 'Teams',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      badgeText: 'text-indigo-700',
    };
  }
  return {
    platform: 'other',
    label: 'Kuliah Online',
    actionText: 'Masuk Kuliah Online',
    shortLabel: 'Online',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeText: 'text-amber-700',
  };
}

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
  const portalUrl = `${baseUrl}/kuliah-online/${course.id}?role=dosen&token=${encodeURIComponent(token)}`;
  const directLink = course.meetingUrl?.trim() || portalUrl;

  return `Assalamu'alaikum Wr. Wb.

Yth. Bapak/Ibu Dosen Pengampu:
*${course.dosen}*

Berikut tautan ruang tatap muka virtual (kuliah online) untuk perkuliahan:
📚 Mata Kuliah: *${course.name} (${course.code})*
⏱️ Jadwal: *${course.day}, ${course.time}*
🏛️ Kelas: *Hukum Keluarga A (HK A) 2025* — Fakultas Syariah UIN Siber Syekh Nurjati Cirebon

🔗 *Tautan Ruang Kuliah Langsung:*
${directLink}

${course.meetingUrl?.trim() ? `🌐 *Portal Alternatif Kelas:* ${portalUrl}\n` : ''}Terima kasih atas bimbingan dan waktu Bapak/Ibu.
Wassalamu'alaikum Wr. Wb.

_Pengurus & Penanggung Jawab (PJ) Kelas HK A 2025_`;
}

// Format WhatsApp invite message for students in class group
export function getStudentInviteMessage(course: Course, baseUrl: string): string {
  const portalUrl = `${baseUrl}/kuliah-online/${course.id}`;
  const directLink = course.meetingUrl?.trim() || portalUrl;
  const platform = detectMeetingPlatform(course.meetingUrl);

  return `📢 *PENGUMUMAN KULIAH ONLINE HK A 2025*

Rekan-rekan mahasiswa Kelas Hukum Keluarga A 2025, tautan kuliah online telah tersedia:

📚 *${course.name} (${course.sks} SKS)*
👤 Dosen: ${course.dosen}
⏱️ Waktu: ${course.day}, ${course.time}
📍 Platform: *${platform.label}*

🔗 *Tautan Masuk Perkuliahan:*
${directLink}

${course.meetingUrl?.trim() ? `🌐 *Portal Kelas HK A:* ${portalUrl}\n` : ''}Mohon bergabung tepat waktu dan pastikan koneksi internet stabil. Terima kasih!`;
}

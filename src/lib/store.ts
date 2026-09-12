import {
  Student,
  Course,
  AttendanceSession,
  AttendanceRecord,
  CourseMaterial,
  Announcement,
  AuthSession,
  AttendanceStatus,
  LibraryItem,
  LibraryCategory,
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_COURSES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MATERIALS,
  INITIAL_SESSIONS,
  INITIAL_RECORDS,
  INITIAL_LIBRARY_ITEMS,
} from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'hka2025_app_store_v1';
const AUTH_KEY = 'hka2025_auth_session_v1';

interface AppState {
  students: Student[];
  courses: Course[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  materials: CourseMaterial[];
  announcements: Announcement[];
  adminPin: string;
  activeSemester?: number;
  libraryItems: LibraryItem[];
  classDriveUrl?: string;
}

// Helper to sort students ascending by NIM (e.g. 03, 04, 05, etc.)
export function sortStudentsByNim(studentsList?: Student[] | null): Student[] {
  if (!studentsList || !Array.isArray(studentsList)) return [];
  return [...studentsList].sort((a, b) => {
    const nimA = (a?.nim || '').trim();
    const nimB = (b?.nim || '').trim();
    return nimA.localeCompare(nimB, undefined, { numeric: true });
  });
}

// Helpers to encode/decode enrolled students and meeting link into course description for cloud persistence
export function encodeCourseDescription(cleanDesc?: string, enrolledNims?: string[], meetingUrl?: string): string {
  let base = (cleanDesc || '')
    .replace(/<!--ENROLLED:[\s\S]*?-->/g, '')
    .replace(/<!--MEET:[\s\S]*?-->/g, '')
    .trim();
  if (Array.isArray(enrolledNims) && enrolledNims.length > 0) {
    base += `\n<!--ENROLLED:${enrolledNims.map((n) => n.trim()).join(',')}-->`;
  }
  if (meetingUrl && meetingUrl.trim()) {
    base += `\n<!--MEET:${meetingUrl.trim()}-->`;
  }
  return base;
}

export function decodeCourseDescription(rawDesc?: string): { 
  cleanDescription: string; 
  enrolledStudentNims?: string[];
  meetingUrl?: string;
} {
  if (!rawDesc) return { cleanDescription: '', enrolledStudentNims: undefined, meetingUrl: undefined };
  const matchEnrolled = rawDesc.match(/<!--ENROLLED:(.*?)-->/);
  const matchMeet = rawDesc.match(/<!--MEET:(.*?)-->/);
  const cleanDescription = rawDesc
    .replace(/<!--ENROLLED:[\s\S]*?-->/g, '')
    .replace(/<!--MEET:[\s\S]*?-->/g, '')
    .trim();
  let enrolledStudentNims: string[] | undefined;
  if (matchEnrolled && matchEnrolled[1]) {
    const nims = matchEnrolled[1].split(',').map((n) => n.trim()).filter(Boolean);
    if (nims.length > 0) {
      enrolledStudentNims = nims;
    }
  }
  const meetingUrl = matchMeet && matchMeet[1] ? matchMeet[1].trim() : undefined;
  return { cleanDescription, enrolledStudentNims, meetingUrl };
}


function getInitialState(): AppState {
  return {
    students: sortStudentsByNim(INITIAL_STUDENTS),
    courses: INITIAL_COURSES,
    sessions: INITIAL_SESSIONS,
    records: INITIAL_RECORDS,
    materials: INITIAL_MATERIALS,
    announcements: INITIAL_ANNOUNCEMENTS,
    adminPin: 'adminhk2025',
    activeSemester: 3,
    libraryItems: INITIAL_LIBRARY_ITEMS,
    classDriveUrl: 'https://drive.google.com/drive/folders/1Ps47X2kULhZtao3iyxKSqpHVGRn7fTT2',
  };
}

class Store {
  private state: AppState;
  private listeners: Set<() => void> = new Set();
  private isSyncingWithSupabase = false;

  constructor() {
    this.state = getInitialState();
    if (typeof window !== 'undefined') {
      this.load();
      this.syncFromSupabase();
      this.initRealtimeSync();
    }
  }

  private initRealtimeSync() {
    if (typeof window === 'undefined') return;

    // Sync when tab gets focus
    window.addEventListener('focus', () => {
      this.syncFromSupabase();
    });

    // Periodic heartbeat sync every 5 seconds
    setInterval(() => {
      this.syncFromSupabase();
    }, 5000);

    // Supabase Realtime Channel
    if (isSupabaseConfigured()) {
      try {
        supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'course_materials' },
            () => {
              this.syncFromSupabase();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'library_items' },
            () => {
              console.log('Realtime update: Perubahan data library_items terdeteksi dari cloud.');
              this.syncFromSupabase();
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription notice:', e);
      }
    }
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          students: sortStudentsByNim(Array.isArray(parsed.students) && parsed.students.length > 0 ? parsed.students : INITIAL_STUDENTS),
          courses: Array.isArray(parsed.courses) && parsed.courses.length > 0
            ? parsed.courses.map((c: any) => ({
                ...c,
                pjNims: Array.isArray(c?.pjNims) ? c.pjNims.filter(Boolean) : [],
                day: c?.day || 'Senin',
                time: c?.time || '07:30 - 09:10 WIB',
                code: c?.code || 'HKI-000',
                name: c?.name || 'Mata Kuliah',
                dosen: c?.dosen || '-',
              }))
            : INITIAL_COURSES,
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : INITIAL_SESSIONS,
          records: Array.isArray(parsed.records) ? parsed.records : INITIAL_RECORDS,
          materials: Array.isArray(parsed.materials) ? parsed.materials : INITIAL_MATERIALS,
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements : INITIAL_ANNOUNCEMENTS,
          adminPin: parsed.adminPin || 'adminhk2025',
          libraryItems: Array.isArray(parsed.libraryItems) && parsed.libraryItems.length > 0 ? parsed.libraryItems : INITIAL_LIBRARY_ITEMS,
          classDriveUrl:
            parsed.classDriveUrl && !parsed.classDriveUrl.includes('1w7R9K63YJpP_CLASS_HK_A_2025')
              ? parsed.classDriveUrl
              : 'https://drive.google.com/drive/folders/1Ps47X2kULhZtao3iyxKSqpHVGRn7fTT2',
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      this.state = getInitialState();
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify();
      } catch (e) {
        console.error('Error saving state to localStorage:', e);
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in store listener:', e);
      }
    });
  }

  // --- Background Bidirectional Cloud Sync with Supabase ---
  public async syncFromSupabase() {
    if (!isSupabaseConfigured() || this.isSyncingWithSupabase) return;
    this.isSyncingWithSupabase = true;

    try {
      // 1. Fetch Students
      const { data: remoteStudents } = await supabase.from('students').select('*');
      if (remoteStudents && remoteStudents.length > 0) {
        this.state.students = sortStudentsByNim(remoteStudents.map((s: any) => ({
          nim: s.nim,
          name: s.name,
          gender: s.gender || 'L',
          pin: s.pin || undefined,
          isPinSet: Boolean(s.is_pin_set),
          phone: s.phone || undefined,
          status: s.status || 'AKTIF',
          createdAt: s.created_at || '2025-09-01',
        })));
      }

      // 2. Fetch Courses
      const { data: remoteCourses } = await supabase.from('courses').select('*');
      if (remoteCourses && remoteCourses.length > 0) {
        this.state.courses = remoteCourses.map((c: any) => {
          const { cleanDescription, enrolledStudentNims: decodedEnrolled, meetingUrl: decodedMeet } = decodeCourseDescription(c.description);
          let enrolled = Array.isArray(c.enrolled_student_nims) && c.enrolled_student_nims.length > 0
            ? c.enrolled_student_nims
            : decodedEnrolled;

          // Preserve from existing local state if remote does not specify
          const existing = this.state.courses.find((x) => x.id === c.id);
          if (!enrolled && existing?.enrolledStudentNims && existing.enrolledStudentNims.length > 0) {
            enrolled = existing.enrolledStudentNims;
          }
          const meetingUrl = decodedMeet || existing?.meetingUrl || undefined;

          return {
            id: c.id,
            code: c.code,
            name: c.name,
            dosen: c.dosen,
            sks: c.sks !== undefined && c.sks !== null ? Number(c.sks) : 2,
            semester: c.semester || 3,
            day: c.day,
            time: c.time,
            room: c.room,
            pjNims: c.pj_nims || [],
            description: cleanDescription,
            driveLink: c.drive_link || undefined,
            rpsLink: c.rps_link || undefined,
            enrolledStudentNims: enrolled,
            meetingUrl: meetingUrl,
          };
        });
      }

      // 3. Fetch Sessions
      const { data: remoteSessions } = await supabase.from('attendance_sessions').select('*');
      if (remoteSessions && remoteSessions.length > 0) {
        this.state.sessions = remoteSessions.map((s: any) => ({
          id: s.id,
          courseId: s.course_id,
          meetingNumber: s.meeting_number,
          date: s.date,
          startTime: s.start_time,
          endTime: s.end_time,
          topic: s.topic,
          dosenPresent: Boolean(s.dosen_present),
          isOpenForSelfCheckin: Boolean(s.is_open_for_self_checkin),
          checkinCode: s.checkin_code || undefined,
          createdAt: s.created_at,
          createdByNim: s.created_by_nim || 'ADMIN',
        }));
      }

      // 4. Fetch Attendance Records
      const { data: remoteRecords } = await supabase.from('attendance_records').select('*');
      if (remoteRecords && remoteRecords.length > 0) {
        const remoteMapped: AttendanceRecord[] = remoteRecords.map((r: any) => {
          const isDispensasi =
            r.status === 'DISPENSASI' ||
            (typeof r.notes === 'string' && r.notes.startsWith('[DISPENSASI]'));
          return {
            id: r.id,
            sessionId: r.session_id,
            courseId: r.course_id,
            studentNim: r.student_nim,
            status: (isDispensasi ? 'DISPENSASI' : r.status) as AttendanceStatus,
            notes:
              typeof r.notes === 'string' && r.notes.startsWith('[DISPENSASI]')
                ? r.notes.replace('[DISPENSASI]', '').trim() || undefined
                : r.notes || undefined,
            timestamp: r.timestamp || new Date().toISOString(),
            verifiedBy: r.verified_by || 'PJ',
          };
        });

        // Smart merge: preserve active local changes if local timestamp is newer
        const mergedRecords = [...this.state.records];
        for (const rem of remoteMapped) {
          const idx = mergedRecords.findIndex(
            (lr) =>
              lr.sessionId === rem.sessionId &&
              lr.studentNim.trim() === rem.studentNim.trim()
          );
          if (idx >= 0) {
            const localTime = new Date(mergedRecords[idx].timestamp || 0).getTime();
            const remoteTime = new Date(rem.timestamp || 0).getTime();
            if (remoteTime >= localTime) {
              mergedRecords[idx] = rem;
            }
          } else {
            mergedRecords.push(rem);
          }
        }
        this.state.records = mergedRecords;
      }

      // 5. Fetch Announcements & System Metadata
      const { data: remoteAnn } = await supabase.from('announcements').select('*');
      if (remoteAnn && remoteAnn.length > 0) {
        const semMeta = remoteAnn.find((a: any) => a.id === 'SYS_ACTIVE_SEMESTER' || a.category === 'SISTEM_SEMESTER');
        if (semMeta) {
          this.state.activeSemester = Number(semMeta.content) || 3;
        }

        const driveMeta = remoteAnn.find((a: any) => a.id === 'SYS_CLASS_DRIVE_URL' || a.category === 'SISTEM_DRIVE_URL');
        if (driveMeta && driveMeta.content && !driveMeta.content.includes('1w7R9K63YJpP_CLASS_HK_A_2025')) {
          this.state.classDriveUrl = driveMeta.content;
        }

        this.state.announcements = remoteAnn
          .filter((a: any) => !['SYS_ACTIVE_SEMESTER', 'SYS_CLASS_DRIVE_URL'].includes(a.id) && !['SISTEM_SEMESTER', 'SISTEM_DRIVE_URL'].includes(a.category))
          .map((a: any) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            category: a.category,
            author: a.author,
            date: a.date,
            pinned: Boolean(a.pinned),
          }));
      }

      // 6. Fetch Materials
      const { data: remoteMat } = await supabase.from('course_materials').select('*');
      if (remoteMat) {
        this.state.materials = remoteMat.map((m: any) => ({
          id: m.id,
          courseId: m.course_id,
          title: m.title,
          type: m.type,
          url: m.url,
          description: m.description || undefined,
          uploadedBy: m.uploaded_by || 'Mahasiswa',
          uploadedAt: m.uploaded_at || '2026-09-01',
        }));
      }


      // 7. Fetch Library Items & Auto-Sync Local Uploads to Cloud
      try {
        const { data: remoteLib, error: libErr } = await supabase.from('library_items').select('*');
        if (!libErr && remoteLib) {
          const remoteItems = remoteLib.map((l: any) => ({
            id: l.id,
            courseId: l.course_id,
            courseName: l.course_name || undefined,
            semester: Number(l.semester) || 3,
            title: l.title,
            category: l.category || 'MAKALAH',
            authors: l.authors || 'Mahasiswa HK A',
            fileUrl: l.file_url || l.url,
            fileType: l.file_type || undefined,
            fileSize: l.file_size || undefined,
            description: l.description || undefined,
            uploadedByNim: l.uploaded_by_nim || '',
            uploadedByName: l.uploaded_by_name || 'Mahasiswa',
            uploadedAt: l.uploaded_at || new Date().toISOString().split('T')[0],
          }));

          // Deteksi berkas tugas yang tersimpan di perangkat lokal Admin tapi belum masuk ke Supabase Cloud
          const remoteIds = new Set(remoteItems.map((r: any) => r.id));
          const currentLocal = this.state.libraryItems || [];
          const pendingSync = currentLocal.filter(
            (local) => !remoteIds.has(local.id) && !INITIAL_LIBRARY_ITEMS.some((init) => init.id === local.id)
          );

          if (pendingSync.length > 0) {
            console.log(`Sinkronisasi Cloud: Mengunggah ${pendingSync.length} berkas lokal ke Supabase...`);
            for (const item of pendingSync) {
              await supabase.from('library_items').upsert({
                id: item.id,
                course_id: item.courseId,
                course_name: item.courseName || null,
                semester: item.semester,
                title: item.title,
                category: item.category,
                authors: item.authors,
                file_url: item.fileUrl,
                file_type: item.fileType || 'LINK',
                file_size: item.fileSize || null,
                description: item.description || null,
                uploaded_by_nim: item.uploadedByNim,
                uploaded_by_name: item.uploadedByName,
                uploaded_at: item.uploadedAt,
              });
            }
            this.state.libraryItems = [...pendingSync, ...remoteItems];
          } else {
            this.state.libraryItems = remoteItems.length > 0 ? remoteItems : (this.state.libraryItems || INITIAL_LIBRARY_ITEMS);
          }
        }
      } catch (libErr) {
        // Fallback: table might not exist in Supabase yet, keep local libraryItems
      }

      this.save();
    } catch (err) {
      console.warn('Supabase background sync notice:', err);
    } finally {
      this.isSyncingWithSupabase = false;
    }
  }

  // --- Auth Session ---
  public getAuth(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const s = localStorage.getItem(AUTH_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }

  public setAuth(session: AuthSession | null) {
    if (typeof window === 'undefined') return;
    try {
      if (session) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {
      console.warn('localStorage setAuth notice (private browsing mode):', e);
    }
    this.notify();
  }

  // --- Active Semester Settings ---
  public getActiveSemester(): number {
    return this.state.activeSemester || 3;
  }

  public async setActiveSemester(sem: number): Promise<void> {
    this.state.activeSemester = Number(sem) || 3;
    this.save();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('announcements').upsert({
          id: 'SYS_ACTIVE_SEMESTER',
          title: 'Sistem Semester Aktif',
          content: String(this.state.activeSemester),
          category: 'SISTEM_SEMESTER',
          author: 'Sistem',
          date: new Date().toISOString().split('T')[0],
          pinned: false,
        });
      } catch (e) {
        console.error('Error syncing active semester to Supabase:', e);
      }
    }
  }

  // --- Students Whitelist ---
  public getStudents(): Student[] {
    return sortStudentsByNim(this.state.students);
  }

  public findStudentByNim(nim?: string | null): Student | undefined {
    if (!nim || typeof nim !== 'string') return undefined;
    const clean = nim.trim();
    return this.state.students.find((s) => (s?.nim || '').trim() === clean);
  }

  public addStudent(student: Student): boolean {
    if (this.findStudentByNim(student.nim)) {
      return false;
    }
    this.state.students.push(student);
    this.state.students = sortStudentsByNim(this.state.students);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('students').upsert({
        nim: student.nim,
        name: student.name,
        gender: student.gender,
        is_pin_set: student.isPinSet,
        status: student.status,
      }).then();
    }
    return true;
  }

  public importStudents(newStudents: Student[], replace: boolean = false) {
    if (replace) {
      this.state.students = sortStudentsByNim(newStudents);
    } else {
      newStudents.forEach((ns) => {
        const idx = this.state.students.findIndex((s) => s.nim.trim() === ns.nim.trim());
        if (idx >= 0) {
          this.state.students[idx] = {
            ...ns,
            pin: this.state.students[idx].pin || ns.pin,
            isPinSet: this.state.students[idx].isPinSet || ns.isPinSet,
          };
        } else {
          this.state.students.push(ns);
        }
      });
      this.state.students = sortStudentsByNim(this.state.students);
    }
    this.save();

    if (isSupabaseConfigured()) {
      const dbRows = this.state.students.map((s) => ({
        nim: s.nim,
        name: s.name,
        gender: s.gender,
        is_pin_set: s.isPinSet,
        status: s.status,
      }));
      supabase.from('students').upsert(dbRows).then();
    }
  }

  public updateStudent(nim: string, updates: Partial<Student>) {
    const idx = this.state.students.findIndex((s) => s.nim.trim() === nim.trim());
    if (idx >= 0) {
      this.state.students[idx] = { ...this.state.students[idx], ...updates };
      this.save();

      if (isSupabaseConfigured()) {
        supabase.from('students').update({
          name: this.state.students[idx].name,
          gender: this.state.students[idx].gender,
          is_pin_set: this.state.students[idx].isPinSet,
          pin: this.state.students[idx].pin,
          status: this.state.students[idx].status,
        }).eq('nim', nim.trim()).then();
      }
    }
  }

  public setStudentPin(nim: string, pin: string) {
    const idx = this.state.students.findIndex((s) => s.nim.trim() === nim.trim());
    if (idx >= 0) {
      this.state.students[idx].pin = pin;
      this.state.students[idx].isPinSet = true;
      this.save();

      if (isSupabaseConfigured()) {
        supabase.from('students').update({
          pin,
          is_pin_set: true,
        }).eq('nim', nim.trim()).then();
      }
      return true;
    }
    return false;
  }

  public getStudentNickname(nim: string): string {
    if (typeof window !== 'undefined' && nim) {
      const stored = localStorage.getItem(`hk_nickname_${nim.trim()}`);
      if (stored && stored.trim()) return stored.trim();
    }
    const student = this.state.students.find((s) => (s.nim || '').trim() === (nim || '').trim());
    if (student && student.name) {
      return student.name.split(' ')[0];
    }
    return '';
  }

  public setStudentNickname(nim: string, nickname: string) {
    if (typeof window !== 'undefined' && nim) {
      localStorage.setItem(`hk_nickname_${nim.trim()}`, nickname.trim());
    }
    this.notify();
  }

  public deleteStudent(nim: string) {
    this.state.students = this.state.students.filter((s) => s.nim.trim() !== nim.trim());
    this.state.courses.forEach((c) => {
      c.pjNims = c.pjNims.filter((pNim) => pNim.trim() !== nim.trim());
    });
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('students').delete().eq('nim', nim.trim()).then();
    }
  }

  // --- Courses ---
  public getCourses(): Course[] {
    return [...this.state.courses];
  }

  public getCourseById(id: string): Course | undefined {
    return this.state.courses.find((c) => c.id === id);
  }

  public addCourse(course: Course): boolean {
    const existing = this.getCourseById(course.id);
    if (existing) {
      return false;
    }
    this.state.courses.push(course);
    this.save();

    if (isSupabaseConfigured()) {
      const payload: any = {
        id: course.id,
        code: course.code,
        name: course.name,
        dosen: course.dosen,
        sks: course.sks,
        semester: course.semester || 3,
        day: course.day,
        time: course.time,
        room: course.room,
        pj_nims: course.pjNims || [],
        description: encodeCourseDescription(course.description, course.enrolledStudentNims, course.meetingUrl),
        drive_link: course.driveLink || '',
        rps_link: course.rpsLink || null,
      };
      supabase.from('courses').insert(payload).then();
    }
    this.notify();
    return true;
  }

  public deleteCourse(courseId: string): boolean {
    const idx = this.state.courses.findIndex((c) => c.id === courseId);
    if (idx < 0) return false;

    this.state.courses.splice(idx, 1);
    this.state.sessions = this.state.sessions.filter((s) => s.courseId !== courseId);
    this.state.records = this.state.records.filter((r) => r.courseId !== courseId);
    this.state.materials = this.state.materials.filter((m) => m.courseId !== courseId);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('courses').delete().eq('id', courseId).then();
      supabase.from('attendance_sessions').delete().eq('course_id', courseId).then();
      supabase.from('attendance_records').delete().eq('course_id', courseId).then();
      supabase.from('course_materials').delete().eq('course_id', courseId).then();
    }
    this.notify();
    return true;
  }

  public updateCourse(id: string, updates: Partial<Course>) {
    const idx = this.state.courses.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.state.courses[idx] = { ...this.state.courses[idx], ...updates };
      this.save();

      if (isSupabaseConfigured()) {
        const c = this.state.courses[idx];
        const encodedDesc = encodeCourseDescription(c.description, c.enrolledStudentNims, c.meetingUrl);
        const updatePayload: any = {
          code: c.code,
          name: c.name,
          pj_nims: c.pjNims,
          dosen: c.dosen,
          room: c.room,
          day: c.day,
          time: c.time,
          sks: c.sks,
          semester: c.semester,
          description: encodedDesc,
          drive_link: c.driveLink,
          rps_link: c.rpsLink,
        };
        supabase.from('courses').update(updatePayload).eq('id', id).then();
      }
      this.notify();
    }
  }

  public setCourseMeetingUrl(courseId: string, meetingUrl?: string) {
    this.updateCourse(courseId, { meetingUrl: meetingUrl ? meetingUrl.trim() || undefined : undefined });
  }

  public setCourseEnrolledStudents(courseId: string, studentNims: string[]) {
    const idx = this.state.courses.findIndex((c) => c.id === courseId);
    if (idx >= 0) {
      const cleanNims = studentNims.map((n) => n.trim()).filter(Boolean);
      this.state.courses[idx].enrolledStudentNims = cleanNims;

      // Automatically purge attendance records of students no longer enrolled in this course
      const cleanSet = new Set(cleanNims);
      const removedNims = this.state.records
        .filter((r) => r.courseId === courseId && !cleanSet.has(r.studentNim.trim()))
        .map((r) => r.studentNim.trim());

      this.state.records = this.state.records.filter(
        (r) => r.courseId !== courseId || cleanSet.has(r.studentNim.trim())
      );

      this.save();

      if (isSupabaseConfigured()) {
        try {
          const encodedDesc = encodeCourseDescription(
            this.state.courses[idx].description,
            cleanNims,
            this.state.courses[idx].meetingUrl
          );
          supabase.from('courses').update({
            description: encodedDesc,
          }).eq('id', courseId).then();

          if (removedNims.length > 0) {
            supabase.from('attendance_records')
              .delete()
              .eq('course_id', courseId)
              .in('student_nim', removedNims)
              .then();
          }
        } catch (e) {
          console.warn('Supabase course enrollment sync notice:', e);
        }
      }
      this.notify();
    }
  }

  public getCourseEnrolledStudents(courseId: string): Student[] {
    const course = this.getCourseById(courseId);
    const allStudents = this.getStudents();
    if (!course || !Array.isArray(course.enrolledStudentNims) || course.enrolledStudentNims.length === 0) {
      return allStudents;
    }
    const cleanNims = new Set(course.enrolledStudentNims.map((n) => (n || '').trim()));
    return allStudents.filter((s) => cleanNims.has((s?.nim || '').trim()));
  }

  public assignPj(courseId: string, pjNims: string[]) {
    const idx = this.state.courses.findIndex((c) => c.id === courseId);
    if (idx >= 0) {
      this.state.courses[idx].pjNims = pjNims;
      this.save();

      if (isSupabaseConfigured()) {
        supabase.from('courses').update({
          pj_nims: pjNims,
        }).eq('id', courseId).then();
      }
    }
  }

  // --- Attendance Sessions ---
  public getSessions(courseId?: string): AttendanceSession[] {
    if (courseId) {
      return this.state.sessions
        .filter((s) => s.courseId === courseId)
        .sort((a, b) => b.meetingNumber - a.meetingNumber);
    }
    return [...this.state.sessions].sort((a, b) => b.meetingNumber - a.meetingNumber);
  }

  public getSessionById(sessionId: string): AttendanceSession | undefined {
    return this.state.sessions.find((s) => s.id === sessionId);
  }

  public createSession(sessionData: Omit<AttendanceSession, 'id' | 'createdAt'>): AttendanceSession {
    const id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSession: AttendanceSession = {
      ...sessionData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.state.sessions.unshift(newSession);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('attendance_sessions').insert({
        id,
        course_id: sessionData.courseId,
        meeting_number: sessionData.meetingNumber,
        date: sessionData.date,
        start_time: sessionData.startTime,
        end_time: sessionData.endTime,
        topic: sessionData.topic,
        dosen_present: sessionData.dosenPresent,
        is_open_for_self_checkin: sessionData.isOpenForSelfCheckin,
        checkin_code: sessionData.checkinCode,
        created_by_nim: sessionData.createdByNim,
      }).then();
    }

    return newSession;
  }

  public updateSession(sessionId: string, updates: Partial<AttendanceSession>) {
    const idx = this.state.sessions.findIndex((s) => s.id === sessionId);
    if (idx >= 0) {
      this.state.sessions[idx] = { ...this.state.sessions[idx], ...updates };
      this.save();

      if (isSupabaseConfigured()) {
        supabase.from('attendance_sessions').update({
          date: this.state.sessions[idx].date,
          meeting_number: this.state.sessions[idx].meetingNumber,
          start_time: this.state.sessions[idx].startTime,
          end_time: this.state.sessions[idx].endTime,
          is_open_for_self_checkin: this.state.sessions[idx].isOpenForSelfCheckin,
          checkin_code: this.state.sessions[idx].checkinCode,
          topic: this.state.sessions[idx].topic,
          dosen_present: this.state.sessions[idx].dosenPresent,
        }).eq('id', sessionId).then();
      }
    }
  }

  public deleteSession(sessionId: string) {
    this.state.sessions = this.state.sessions.filter((s) => s.id !== sessionId);
    this.state.records = this.state.records.filter((r) => r.sessionId !== sessionId);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('attendance_sessions').delete().eq('id', sessionId).then();
    }
  }

  // --- Attendance Records ---
  public getRecords(sessionId?: string, courseId?: string): AttendanceRecord[] {
    return this.state.records.filter((r) => {
      if (sessionId && r.sessionId !== sessionId) return false;
      if (courseId && r.courseId !== courseId) return false;
      return true;
    });
  }

  public async setAttendanceRecord(
    sessionId: string,
    courseId: string,
    studentNim: string,
    status: AttendanceStatus,
    verifiedBy: string,
    notes?: string
  ) {
    const existingIdx = this.state.records.findIndex(
      (r) => r.sessionId === sessionId && r.studentNim.trim() === studentNim.trim()
    );

    let recId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    if (existingIdx >= 0) {
      recId = this.state.records[existingIdx].id;
      this.state.records[existingIdx] = {
        ...this.state.records[existingIdx],
        status,
        notes: notes !== undefined ? notes : this.state.records[existingIdx].notes,
        timestamp: now,
        verifiedBy,
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: recId,
        sessionId,
        courseId,
        studentNim: studentNim.trim(),
        status,
        notes,
        timestamp: now,
        verifiedBy,
      };
      this.state.records.push(newRecord);
    }
    this.save();

    if (isSupabaseConfigured()) {
      // Supabase table has check constraint: status IN ('HADIR', 'IZIN', 'SAKIT', 'ALPA')
      // If status is DISPENSASI, store in Supabase as status: 'IZIN' with '[DISPENSASI]' in notes
      const isDispensasi = status === 'DISPENSASI';
      const supabaseStatus = isDispensasi ? 'IZIN' : status;
      const actualNotes =
        notes !== undefined
          ? notes
          : existingIdx >= 0
          ? this.state.records[existingIdx].notes
          : undefined;
      const supabaseNotes = isDispensasi
        ? actualNotes
          ? `[DISPENSASI] ${actualNotes}`
          : '[DISPENSASI]'
        : actualNotes || null;

      try {
        await supabase.from('attendance_records').upsert(
          {
            id: recId,
            session_id: sessionId,
            course_id: courseId,
            student_nim: studentNim.trim(),
            status: supabaseStatus,
            notes: supabaseNotes,
            verified_by: verifiedBy,
          },
          { onConflict: 'session_id, student_nim' }
        );
      } catch (err) {
        console.error('Error syncing record to Supabase:', err);
      }
    }
  }

  public async batchMarkAll(
    sessionId: string,
    courseId: string,
    status: AttendanceStatus,
    verifiedBy: string
  ) {
    const targetStudents = this.getCourseEnrolledStudents(courseId);
    const isDispensasi = status === 'DISPENSASI';
    const supabaseStatus = isDispensasi ? 'IZIN' : status;
    const supabaseNotes = isDispensasi ? '[DISPENSASI]' : null;
    const now = new Date().toISOString();

    const upsertPayload: any[] = [];

    targetStudents.forEach((student) => {
      const existingIdx = this.state.records.findIndex(
        (r) =>
          r.sessionId === sessionId && r.studentNim.trim() === student.nim.trim()
      );
      let recId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      if (existingIdx >= 0) {
        recId = this.state.records[existingIdx].id;
        this.state.records[existingIdx] = {
          ...this.state.records[existingIdx],
          status,
          timestamp: now,
          verifiedBy,
        };
      } else {
        this.state.records.push({
          id: recId,
          sessionId,
          courseId,
          studentNim: student.nim.trim(),
          status,
          timestamp: now,
          verifiedBy,
        });
      }

      upsertPayload.push({
        id: recId,
        session_id: sessionId,
        course_id: courseId,
        student_nim: student.nim.trim(),
        status: supabaseStatus,
        notes: supabaseNotes,
        verified_by: verifiedBy,
      });
    });

    this.save();

    if (isSupabaseConfigured() && upsertPayload.length > 0) {
      try {
        await supabase
          .from('attendance_records')
          .upsert(upsertPayload, { onConflict: 'session_id, student_nim' });
      } catch (err) {
        console.error('Error batch syncing records to Supabase:', err);
      }
    }
  }


  // --- E-Library & Repositori Tugas (Semester 1 s.d. 8) ---
  public getLibraryItems(semester?: number, courseId?: string, category?: string): LibraryItem[] {
    let list = this.state.libraryItems || [];
    if (semester !== undefined && semester !== null) {
      list = list.filter((item) => Number(item.semester) === Number(semester));
    }
    if (courseId) {
      list = list.filter((item) => item.courseId === courseId);
    }
    if (category && category !== 'ALL') {
      list = list.filter((item) => item.category === category);
    }
    return [...list].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public addLibraryItem(itemData: Omit<LibraryItem, 'id' | 'uploadedAt'>): LibraryItem {
    const id = `lib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: LibraryItem = {
      ...itemData,
      id,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    if (!this.state.libraryItems) {
      this.state.libraryItems = [];
    }
    this.state.libraryItems.unshift(newItem);
    this.save();

    if (isSupabaseConfigured()) {
      supabase
        .from('library_items')
        .upsert({
          id,
          course_id: itemData.courseId,
          course_name: itemData.courseName || null,
          semester: itemData.semester,
          title: itemData.title,
          category: itemData.category,
          authors: itemData.authors,
          file_url: itemData.fileUrl,
          file_type: itemData.fileType || 'LINK',
          file_size: itemData.fileSize || null,
          description: itemData.description || null,
          uploaded_by_nim: itemData.uploadedByNim,
          uploaded_by_name: itemData.uploadedByName,
          uploaded_at: newItem.uploadedAt,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase library_items sync note:', error);
        });
    }

    return newItem;
  }

  public deleteLibraryItem(id: string, requesterNim?: string, isAdmin?: boolean): boolean {
    if (!this.state.libraryItems) return false;
    const target = this.state.libraryItems.find((i) => i.id === id);
    if (!target) return false;

    // Hanya Admin atau mahasiswa yang mengunggah berkas tersebut yang berhak menghapus
    if (!isAdmin && requesterNim && target.uploadedByNim && target.uploadedByNim !== requesterNim) {
      return false;
    }

    this.state.libraryItems = this.state.libraryItems.filter((i) => i.id !== id);
    this.save();

    if (isSupabaseConfigured()) {
      supabase
        .from('library_items')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Supabase library_items delete note:', error);
        });
    }
    return true;
  }

  public getClassDriveUrl(): string {
    if (!this.state.classDriveUrl || this.state.classDriveUrl.includes('1w7R9K63YJpP_CLASS_HK_A_2025')) {
      return 'https://drive.google.com/drive/folders/1Ps47X2kULhZtao3iyxKSqpHVGRn7fTT2';
    }
    return this.state.classDriveUrl;
  }

  public async setClassDriveUrl(url: string) {
    this.state.classDriveUrl = url.trim();
    this.save();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('announcements').upsert({
          id: 'SYS_CLASS_DRIVE_URL',
          title: 'Sistem Google Drive Kelas',
          content: this.state.classDriveUrl,
          category: 'SISTEM_DRIVE_URL',
          author: 'Sistem',
          date: new Date().toISOString().split('T')[0],
          pinned: false,
        });
      } catch (e) {
        console.error('Error syncing class drive url to Supabase:', e);
      }
    }
  }

  // --- Materials ---
  public getMaterials(courseId?: string): CourseMaterial[] {
    if (courseId) {
      return this.state.materials.filter((m) => m.courseId === courseId);
    }
    return [...this.state.materials];
  }

  public addMaterial(materialData: Omit<CourseMaterial, 'id' | 'uploadedAt'>): CourseMaterial {
    const id = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMaterial: CourseMaterial = {
      ...materialData,
      id,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    this.state.materials.unshift(newMaterial);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('course_materials').upsert({
        id,
        course_id: materialData.courseId,
        title: materialData.title,
        type: materialData.type,
        url: materialData.url,
        description: materialData.description || null,
        uploaded_by: materialData.uploadedBy || 'Mahasiswa',
        uploaded_at: newMaterial.uploadedAt,
      }).then(({ error }) => {
        if (error) console.error('Supabase material upload error:', error);
      });
    }

    return newMaterial;
  }

  public deleteMaterial(id: string) {
    this.state.materials = this.state.materials.filter((m) => m.id !== id);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('course_materials').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase material delete error:', error);
      });
    }
  }

  // --- Announcements ---
  public getAnnouncements(): Announcement[] {
    return [...this.state.announcements];
  }

  public addAnnouncement(announcementData: Omit<Announcement, 'id' | 'date'>): Announcement {
    const id = `ann-${Date.now()}`;
    const newAnn: Announcement = {
      ...announcementData,
      id,
      date: new Date().toISOString().split('T')[0],
    };
    this.state.announcements.unshift(newAnn);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('announcements').insert({
        id,
        title: announcementData.title,
        content: announcementData.content,
        category: announcementData.category,
        author: announcementData.author,
        pinned: announcementData.pinned || false,
      }).then();
    }

    return newAnn;
  }

  public deleteAnnouncement(id: string) {
    this.state.announcements = this.state.announcements.filter((a) => a.id !== id);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.from('announcements').delete().eq('id', id).then();
    }
  }

  // --- Admin PIN ---
  public getAdminPin(): string {
    return this.state.adminPin;
  }

  public setAdminPin(pin: string) {
    this.state.adminPin = pin;
    this.save();
  }

  // --- Reset & Backup ---
  public resetToDefault() {
    this.state = getInitialState();
    this.save();
  }

  public exportJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.students && parsed.courses) {
        this.state = parsed;
        this.save();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const appStore = new Store();

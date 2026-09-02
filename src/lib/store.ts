import {
  Student,
  Course,
  AttendanceSession,
  AttendanceRecord,
  CourseMaterial,
  Announcement,
  AuthSession,
  AttendanceStatus,
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_COURSES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MATERIALS,
  INITIAL_SESSIONS,
  INITIAL_RECORDS,
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

function getInitialState(): AppState {
  return {
    students: sortStudentsByNim(INITIAL_STUDENTS),
    courses: INITIAL_COURSES,
    sessions: INITIAL_SESSIONS,
    records: INITIAL_RECORDS,
    materials: INITIAL_MATERIALS,
    announcements: INITIAL_ANNOUNCEMENTS,
    adminPin: 'adminhk2025',
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
        this.state.courses = remoteCourses.map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          dosen: c.dosen,
          sks: c.sks,
          semester: c.semester || 3,
          day: c.day,
          time: c.time,
          room: c.room,
          pjNims: c.pj_nims || [],
          description: c.description || '',
          driveLink: c.drive_link || undefined,
          rpsLink: c.rps_link || undefined,
          enrolledStudentNims: c.enrolled_student_nims || undefined,
        }));
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

      // 5. Fetch Announcements
      const { data: remoteAnn } = await supabase.from('announcements').select('*');
      if (remoteAnn && remoteAnn.length > 0) {
        this.state.announcements = remoteAnn.map((a: any) => ({
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

  public updateCourse(id: string, updates: Partial<Course>) {
    const idx = this.state.courses.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.state.courses[idx] = { ...this.state.courses[idx], ...updates };
      this.save();

      if (isSupabaseConfigured()) {
        const updatePayload: any = {
          name: this.state.courses[idx].name,
          pj_nims: this.state.courses[idx].pjNims,
          dosen: this.state.courses[idx].dosen,
          room: this.state.courses[idx].room,
          day: this.state.courses[idx].day,
          time: this.state.courses[idx].time,
          sks: this.state.courses[idx].sks,
          description: this.state.courses[idx].description,
          drive_link: this.state.courses[idx].driveLink,
          rps_link: this.state.courses[idx].rpsLink,
        };
        if (this.state.courses[idx].enrolledStudentNims !== undefined) {
          updatePayload.enrolled_student_nims = this.state.courses[idx].enrolledStudentNims;
        }
        supabase.from('courses').update(updatePayload).eq('id', id).then();
      }
    }
  }

  public setCourseEnrolledStudents(courseId: string, studentNims: string[]) {
    const idx = this.state.courses.findIndex((c) => c.id === courseId);
    if (idx >= 0) {
      this.state.courses[idx].enrolledStudentNims = studentNims;
      this.save();

      if (isSupabaseConfigured()) {
        try {
          supabase.from('courses').update({
            enrolled_student_nims: studentNims,
          }).eq('id', courseId).then();
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

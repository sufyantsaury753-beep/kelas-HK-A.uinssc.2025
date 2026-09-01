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

function getInitialState(): AppState {
  return {
    students: INITIAL_STUDENTS,
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

  constructor() {
    this.state = getInitialState();
    if (typeof window !== 'undefined') {
      this.load();
    }
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          students: parsed.students || INITIAL_STUDENTS,
          courses: parsed.courses || INITIAL_COURSES,
          sessions: parsed.sessions || INITIAL_SESSIONS,
          records: parsed.records || INITIAL_RECORDS,
          materials: parsed.materials || INITIAL_MATERIALS,
          announcements: parsed.announcements || INITIAL_ANNOUNCEMENTS,
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
    if (session) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    this.notify();
  }

  // --- Students Whitelist ---
  public getStudents(): Student[] {
    return [...this.state.students];
  }

  public findStudentByNim(nim: string): Student | undefined {
    const clean = nim.trim();
    return this.state.students.find((s) => s.nim.trim() === clean);
  }

  public addStudent(student: Student): boolean {
    if (this.findStudentByNim(student.nim)) {
      return false;
    }
    this.state.students.push(student);
    this.save();
    return true;
  }

  public importStudents(newStudents: Student[], replace: boolean = false) {
    if (replace) {
      this.state.students = newStudents;
    } else {
      newStudents.forEach((ns) => {
        const idx = this.state.students.findIndex((s) => s.nim.trim() === ns.nim.trim());
        if (idx >= 0) {
          // preserve existing PIN if already set
          this.state.students[idx] = {
            ...ns,
            pin: this.state.students[idx].pin || ns.pin,
            isPinSet: this.state.students[idx].isPinSet || ns.isPinSet,
          };
        } else {
          this.state.students.push(ns);
        }
      });
    }
    this.save();
  }

  public updateStudent(nim: string, updates: Partial<Student>) {
    const idx = this.state.students.findIndex((s) => s.nim.trim() === nim.trim());
    if (idx >= 0) {
      this.state.students[idx] = { ...this.state.students[idx], ...updates };
      this.save();
    }
  }

  public setStudentPin(nim: string, pin: string) {
    const idx = this.state.students.findIndex((s) => s.nim.trim() === nim.trim());
    if (idx >= 0) {
      this.state.students[idx].pin = pin;
      this.state.students[idx].isPinSet = true;
      this.save();
      return true;
    }
    return false;
  }

  public deleteStudent(nim: string) {
    this.state.students = this.state.students.filter((s) => s.nim.trim() !== nim.trim());
    // remove from course PJs if assigned
    this.state.courses.forEach((c) => {
      c.pjNims = c.pjNims.filter((pNim) => pNim.trim() !== nim.trim());
    });
    this.save();
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
    }
  }

  public assignPj(courseId: string, pjNims: string[]) {
    const idx = this.state.courses.findIndex((c) => c.id === courseId);
    if (idx >= 0) {
      this.state.courses[idx].pjNims = pjNims;
      this.save();
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
    return newSession;
  }

  public updateSession(sessionId: string, updates: Partial<AttendanceSession>) {
    const idx = this.state.sessions.findIndex((s) => s.id === sessionId);
    if (idx >= 0) {
      this.state.sessions[idx] = { ...this.state.sessions[idx], ...updates };
      this.save();
    }
  }

  public deleteSession(sessionId: string) {
    this.state.sessions = this.state.sessions.filter((s) => s.id !== sessionId);
    this.state.records = this.state.records.filter((r) => r.sessionId !== sessionId);
    this.save();
  }

  // --- Attendance Records ---
  public getRecords(sessionId?: string, courseId?: string): AttendanceRecord[] {
    return this.state.records.filter((r) => {
      if (sessionId && r.sessionId !== sessionId) return false;
      if (courseId && r.courseId !== courseId) return false;
      return true;
    });
  }

  public setAttendanceRecord(
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

    if (existingIdx >= 0) {
      this.state.records[existingIdx] = {
        ...this.state.records[existingIdx],
        status,
        notes: notes !== undefined ? notes : this.state.records[existingIdx].notes,
        timestamp: new Date().toISOString(),
        verifiedBy,
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId,
        courseId,
        studentNim: studentNim.trim(),
        status,
        notes,
        timestamp: new Date().toISOString(),
        verifiedBy,
      };
      this.state.records.push(newRecord);
    }
    this.save();
  }

  public batchMarkAll(sessionId: string, courseId: string, status: AttendanceStatus, verifiedBy: string) {
    const allStudents = this.getStudents();
    allStudents.forEach((student) => {
      this.setAttendanceRecord(sessionId, courseId, student.nim, status, verifiedBy);
    });
  }

  // --- Materials ---
  public getMaterials(courseId?: string): CourseMaterial[] {
    if (courseId) {
      return this.state.materials.filter((m) => m.courseId === courseId);
    }
    return [...this.state.materials];
  }

  public addMaterial(materialData: Omit<CourseMaterial, 'id' | 'uploadedAt'>): CourseMaterial {
    const newMaterial: CourseMaterial = {
      ...materialData,
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    this.state.materials.unshift(newMaterial);
    this.save();
    return newMaterial;
  }

  public deleteMaterial(id: string) {
    this.state.materials = this.state.materials.filter((m) => m.id !== id);
    this.save();
  }

  // --- Announcements ---
  public getAnnouncements(): Announcement[] {
    return [...this.state.announcements];
  }

  public addAnnouncement(announcementData: Omit<Announcement, 'id' | 'date'>): Announcement {
    const newAnn: Announcement = {
      ...announcementData,
      id: `ann-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    this.state.announcements.unshift(newAnn);
    this.save();
    return newAnn;
  }

  public deleteAnnouncement(id: string) {
    this.state.announcements = this.state.announcements.filter((a) => a.id !== id);
    this.save();
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

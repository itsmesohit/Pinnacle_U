// ==========================================
// Data Service - CRUD operations for all entities
// ==========================================

import {
  Student, Teacher, Department, Course, Enrollment,
  AttendanceSession, AttendanceRecord, Grade, Announcement,
  Activity, AppSettings, User, Notification, StudentFormData,
  TeacherFormData, CourseFormData, DepartmentFormData, GradeFormData,
  AnnouncementFormData
} from '../types';
import { getStorageItem, setStorageItem, generateId, isDataSeeded, setDataVersion, clearAllData } from './storage';
import { generateSeedData, getGradeLetter } from './seedData';

// ==========================================
// Initialize / Seed
// ==========================================

export function initializeData(): void {
  if (!isDataSeeded()) {
    seedData();
  }
}

export function seedData(): void {
  const data = generateSeedData();
  setStorageItem('users', data.users);
  setStorageItem('students', data.students);
  setStorageItem('teachers', data.teachers);
  setStorageItem('departments', data.departments);
  setStorageItem('courses', data.courses);
  setStorageItem('enrollments', data.enrollments);
  setStorageItem('attendanceSessions', data.attendanceSessions);
  setStorageItem('attendanceRecords', data.attendanceRecords);
  setStorageItem('grades', data.grades);
  setStorageItem('announcements', data.announcements);
  setStorageItem('activities', data.activities);
  setStorageItem('notifications', data.notifications);
  setStorageItem('settings', data.settings);
  setDataVersion();
}

export function resetData(): void {
  clearAllData();
  seedData();
}

// ==========================================
// Event System - notify components of data changes
// ==========================================

type DataChangeCallback = () => void;
const listeners = new Map<string, Set<DataChangeCallback>>();

export function subscribeToChanges(key: string, callback: DataChangeCallback): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);
  return () => {
    listeners.get(key)?.delete(callback);
  };
}

function notifyChange(key: string): void {
  listeners.get(key)?.forEach(cb => cb());
  listeners.get('*')?.forEach(cb => cb());
}

// ==========================================
// Users
// ==========================================

export function getUsers(): User[] {
  return getStorageItem<User[]>('users', []);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email === email);
}

// ==========================================
// Students
// ==========================================

export function getStudents(): Student[] {
  return getStorageItem<Student[]>('students', []);
}

export function getStudentById(id: string): Student | undefined {
  return getStudents().find(s => s.id === id);
}

export function createStudent(data: StudentFormData): Student {
  const students = getStudents();
  const newIndex = students.length + 1;
  const student: Student = {
    ...data,
    id: generateId(),
    studentId: `STU-2024-${String(newIndex).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  students.push(student);
  setStorageItem('students', students);

  // Automatically create a login account for the student with default password
  const users = getUsers();
  users.push({
    id: generateId(),
    email: student.email,
    name: `${student.firstName} ${student.lastName}`,
    role: 'student',
    password: 'student123',
    linkedEntityId: student.id,
  });
  setStorageItem('users', users);

  addActivity('student_added', student.id, `${student.firstName} ${student.lastName}`, `New student ${student.firstName} ${student.lastName} enrolled (login created)`);
  notifyChange('students');
  notifyChange('users');
  return student;
}

export function updateStudent(id: string, data: Partial<StudentFormData>): Student | null {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const prevEmail = students[idx].email;
  students[idx] = { ...students[idx], ...data, updatedAt: new Date().toISOString() };
  setStorageItem('students', students);

  // If email or name changed, sync user record
  const users = getUsers();
  const userIdx = users.findIndex(u => u.linkedEntityId === id || u.email.toLowerCase() === prevEmail.toLowerCase());
  if (userIdx !== -1) {
    if (data.email) users[userIdx].email = data.email;
    if (data.firstName || data.lastName) {
      users[userIdx].name = `${students[idx].firstName} ${students[idx].lastName}`;
    }
    setStorageItem('users', users);
    notifyChange('users');
  }

  addActivity('student_updated', id, `${students[idx].firstName} ${students[idx].lastName}`, `Student ${students[idx].firstName} ${students[idx].lastName} record updated`);
  notifyChange('students');
  return students[idx];
}

export function deleteStudent(id: string): boolean {
  let students = getStudents();
  const student = students.find(s => s.id === id);
  if (!student) return false;
  students = students.filter(s => s.id !== id);
  setStorageItem('students', students);

  // Clean up user account
  const users = getUsers().filter(u => u.linkedEntityId !== id && u.email.toLowerCase() !== student.email.toLowerCase());
  setStorageItem('users', users);

  // Clean up enrollments
  const enrollments = getEnrollments().filter(e => e.studentId !== id);
  setStorageItem('enrollments', enrollments);
  // Clean up attendance records
  const records = getAttendanceRecords().filter(r => r.studentId !== id);
  setStorageItem('attendanceRecords', records);
  // Clean up grades
  const grades = getGrades().filter(g => g.studentId !== id);
  setStorageItem('grades', grades);
  addActivity('student_deleted', id, `${student.firstName} ${student.lastName}`, `Student ${student.firstName} ${student.lastName} removed`);
  notifyChange('students');
  notifyChange('users');
  notifyChange('enrollments');
  notifyChange('attendanceRecords');
  notifyChange('grades');
  return true;
}

export function resetUserPassword(email: string, newPassword = 'student123'): { success: boolean; error?: string } {
  const users = getUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) {
    const student = getStudents().find(s => s.email.toLowerCase() === email.toLowerCase());
    const teacher = getTeachers().find(t => t.email.toLowerCase() === email.toLowerCase());
    if (student) {
      users.push({
        id: generateId(),
        email: student.email,
        name: `${student.firstName} ${student.lastName}`,
        role: 'student',
        password: newPassword,
        linkedEntityId: student.id,
      });
      setStorageItem('users', users);
      notifyChange('users');
      return { success: true };
    }
    if (teacher) {
      users.push({
        id: generateId(),
        email: teacher.email,
        name: `${teacher.firstName} ${teacher.lastName}`,
        role: 'teacher',
        password: newPassword,
        linkedEntityId: teacher.id,
      });
      setStorageItem('users', users);
      notifyChange('users');
      return { success: true };
    }
    return { success: false, error: 'No student or faculty account found for this email.' };
  }
  users[idx].password = newPassword;
  setStorageItem('users', users);
  notifyChange('users');
  return { success: true };
}

// ==========================================
// Teachers
// ==========================================

export function getTeachers(): Teacher[] {
  return getStorageItem<Teacher[]>('teachers', []);
}

export function getTeacherById(id: string): Teacher | undefined {
  return getTeachers().find(t => t.id === id);
}

export function createTeacher(data: TeacherFormData): Teacher {
  const teachers = getTeachers();
  const newIndex = teachers.length + 1;
  const teacher: Teacher = {
    ...data,
    id: generateId(),
    teacherId: `TCH-${String(newIndex).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  teachers.push(teacher);
  setStorageItem('teachers', teachers);
  // Create user account
  const users = getUsers();
  users.push({
    id: generateId(),
    email: teacher.email,
    name: `${teacher.firstName} ${teacher.lastName}`,
    role: 'teacher',
    linkedEntityId: teacher.id,
  });
  setStorageItem('users', users);
  addActivity('teacher_added', teacher.id, `${teacher.firstName} ${teacher.lastName}`, `New teacher ${teacher.firstName} ${teacher.lastName} joined`);
  notifyChange('teachers');
  return teacher;
}

export function updateTeacher(id: string, data: Partial<TeacherFormData>): Teacher | null {
  const teachers = getTeachers();
  const idx = teachers.findIndex(t => t.id === id);
  if (idx === -1) return null;
  teachers[idx] = { ...teachers[idx], ...data, updatedAt: new Date().toISOString() };
  setStorageItem('teachers', teachers);
  addActivity('teacher_updated', id, `${teachers[idx].firstName} ${teachers[idx].lastName}`, `Teacher ${teachers[idx].firstName} ${teachers[idx].lastName} record updated`);
  notifyChange('teachers');
  return teachers[idx];
}

export function deleteTeacher(id: string): boolean {
  let teachers = getTeachers();
  const teacher = teachers.find(t => t.id === id);
  if (!teacher) return false;
  teachers = teachers.filter(t => t.id !== id);
  setStorageItem('teachers', teachers);
  // Remove from courses
  const courses = getCourses().map(c => c.teacherId === id ? { ...c, teacherId: undefined } : c);
  setStorageItem('courses', courses);
  addActivity('teacher_deleted', id, `${teacher.firstName} ${teacher.lastName}`, `Teacher ${teacher.firstName} ${teacher.lastName} removed`);
  notifyChange('teachers');
  notifyChange('courses');
  return true;
}

// ==========================================
// Departments
// ==========================================

export function getDepartments(): Department[] {
  return getStorageItem<Department[]>('departments', []);
}

export function getDepartmentById(id: string): Department | undefined {
  return getDepartments().find(d => d.id === id);
}

export function createDepartment(data: DepartmentFormData): Department {
  const departments = getDepartments();
  const department: Department = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  departments.push(department);
  setStorageItem('departments', departments);
  addActivity('department_added', department.id, department.name, `New department ${department.name} created`);
  notifyChange('departments');
  return department;
}

export function updateDepartment(id: string, data: Partial<DepartmentFormData>): Department | null {
  const departments = getDepartments();
  const idx = departments.findIndex(d => d.id === id);
  if (idx === -1) return null;
  departments[idx] = { ...departments[idx], ...data, updatedAt: new Date().toISOString() };
  setStorageItem('departments', departments);
  addActivity('department_updated', id, departments[idx].name, `Department ${departments[idx].name} updated`);
  notifyChange('departments');
  return departments[idx];
}

export function deleteDepartment(id: string): { success: boolean; error?: string } {
  const students = getStudents().filter(s => s.departmentId === id);
  const teachers = getTeachers().filter(t => t.departmentId === id);
  const courses = getCourses().filter(c => c.departmentId === id);
  if (students.length > 0 || teachers.length > 0 || courses.length > 0) {
    return { success: false, error: `Cannot delete: ${students.length} students, ${teachers.length} teachers, and ${courses.length} courses belong to this department.` };
  }
  let departments = getDepartments();
  departments = departments.filter(d => d.id !== id);
  setStorageItem('departments', departments);
  notifyChange('departments');
  return { success: true };
}

// ==========================================
// Courses
// ==========================================

export function getCourses(): Course[] {
  return getStorageItem<Course[]>('courses', []);
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find(c => c.id === id);
}

export function createCourse(data: CourseFormData): Course {
  const courses = getCourses();
  const course: Course = {
    ...data,
    id: generateId(),
    courseId: `CRS-${data.code}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  courses.push(course);
  setStorageItem('courses', courses);
  addActivity('course_added', course.id, course.name, `New course ${course.name} created`);
  notifyChange('courses');
  return course;
}

export function updateCourse(id: string, data: Partial<CourseFormData>): Course | null {
  const courses = getCourses();
  const idx = courses.findIndex(c => c.id === id);
  if (idx === -1) return null;
  courses[idx] = { ...courses[idx], ...data, updatedAt: new Date().toISOString() };
  setStorageItem('courses', courses);
  addActivity('course_updated', id, courses[idx].name, `Course ${courses[idx].name} updated`);
  notifyChange('courses');
  return courses[idx];
}

export function deleteCourse(id: string): boolean {
  let courses = getCourses();
  courses = courses.filter(c => c.id !== id);
  setStorageItem('courses', courses);
  // Clean up enrollments
  const enrollments = getEnrollments().filter(e => e.courseId !== id);
  setStorageItem('enrollments', enrollments);
  notifyChange('courses');
  notifyChange('enrollments');
  return true;
}

// ==========================================
// Enrollments
// ==========================================

export function getEnrollments(): Enrollment[] {
  return getStorageItem<Enrollment[]>('enrollments', []);
}

export function enrollStudent(studentId: string, courseId: string): { success: boolean; error?: string } {
  const enrollments = getEnrollments();
  const existing = enrollments.find(e => e.studentId === studentId && e.courseId === courseId && e.status === 'enrolled');
  if (existing) return { success: false, error: 'Student is already enrolled in this course.' };
  const course = getCourseById(courseId);
  if (!course) return { success: false, error: 'Course not found.' };
  const currentCount = enrollments.filter(e => e.courseId === courseId && e.status === 'enrolled').length;
  if (currentCount >= course.maxEnrollment) return { success: false, error: 'Course has reached maximum enrollment.' };

  const enrollment: Enrollment = {
    id: generateId(),
    studentId,
    courseId,
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'enrolled',
    createdAt: new Date().toISOString(),
  };
  enrollments.push(enrollment);
  setStorageItem('enrollments', enrollments);
  addActivity('enrollment_added', courseId, course.name, `Student enrolled in ${course.name}`);
  notifyChange('enrollments');
  return { success: true };
}

export function unenrollStudent(studentId: string, courseId: string): boolean {
  const enrollments = getEnrollments();
  const idx = enrollments.findIndex(e => e.studentId === studentId && e.courseId === courseId && e.status === 'enrolled');
  if (idx === -1) return false;
  enrollments[idx].status = 'dropped';
  setStorageItem('enrollments', enrollments);
  notifyChange('enrollments');
  return true;
}

export function getEnrollmentsByCourse(courseId: string): Enrollment[] {
  return getEnrollments().filter(e => e.courseId === courseId && e.status === 'enrolled');
}

export function getEnrollmentsByStudent(studentId: string): Enrollment[] {
  return getEnrollments().filter(e => e.studentId === studentId);
}

// ==========================================
// Attendance
// ==========================================

export function getAttendanceSessions(): AttendanceSession[] {
  return getStorageItem<AttendanceSession[]>('attendanceSessions', []);
}

export function getAttendanceRecords(): AttendanceRecord[] {
  return getStorageItem<AttendanceRecord[]>('attendanceRecords', []);
}

export function getSessionByCourseAndDate(courseId: string, date: string): AttendanceSession | undefined {
  return getAttendanceSessions().find(s => s.courseId === courseId && s.date === date);
}

export function saveAttendance(courseId: string, date: string, teacherId: string, records: { studentId: string; status: AttendanceRecord['status'] }[]): void {
  const sessions = getAttendanceSessions();
  let allRecords = getAttendanceRecords();

  let session = sessions.find(s => s.courseId === courseId && s.date === date);
  if (session) {
    // Update existing - remove old records for this session
    allRecords = allRecords.filter(r => r.sessionId !== session!.id);
    session.updatedAt = new Date().toISOString();
    const idx = sessions.findIndex(s => s.id === session!.id);
    sessions[idx] = session;
  } else {
    // Create new session
    session = {
      id: generateId(),
      courseId,
      date,
      teacherId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    sessions.push(session);
  }

  // Add new records
  const newRecords: AttendanceRecord[] = records.map((r, i) => ({
    id: `${session!.id}-${i}`,
    sessionId: session!.id,
    studentId: r.studentId,
    status: r.status,
  }));
  allRecords.push(...newRecords);

  setStorageItem('attendanceSessions', sessions);
  setStorageItem('attendanceRecords', allRecords);
  const course = getCourseById(courseId);
  addActivity('attendance_marked', courseId, course?.name || 'Unknown', `Attendance marked for ${course?.name || 'course'} on ${date}`);
  notifyChange('attendanceSessions');
  notifyChange('attendanceRecords');
}

export function getStudentAttendance(studentId: string): { total: number; present: number; absent: number; late: number; excused: number; percentage: number } {
  const records = getAttendanceRecords().filter(r => r.studentId === studentId);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  // Excused absences excluded from denominator
  const denominator = total - excused;
  const percentage = denominator > 0 ? Math.round(((present + late) / denominator) * 100) : 100;
  return { total, present, absent, late, excused, percentage };
}

export function getCourseAttendanceStats(courseId: string): { total: number; present: number; absent: number; late: number; excused: number; percentage: number } {
  const sessions = getAttendanceSessions().filter(s => s.courseId === courseId);
  const sessionIds = new Set(sessions.map(s => s.id));
  const records = getAttendanceRecords().filter(r => sessionIds.has(r.sessionId));
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const denominator = total - excused;
  const percentage = denominator > 0 ? Math.round(((present + late) / denominator) * 100) : 100;
  return { total, present, absent, late, excused, percentage };
}

// ==========================================
// Grades
// ==========================================

export function getGrades(): Grade[] {
  return getStorageItem<Grade[]>('grades', []);
}

export function createGrade(data: GradeFormData, teacherId: string): Grade {
  const grades = getGrades();
  const percentage = Math.round((data.marksObtained / data.maxMarks) * 100);
  const band = getGradeLetter(percentage);
  const grade: Grade = {
    ...data,
    id: generateId(),
    percentage,
    gradeLetter: band.letter,
    teacherId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  grades.push(grade);
  setStorageItem('grades', grades);
  addActivity('grade_added', data.courseId, data.assessmentName, `Grade entered for ${data.assessmentName}`);
  notifyChange('grades');
  return grade;
}

export function updateGrade(id: string, data: Partial<GradeFormData>): Grade | null {
  const grades = getGrades();
  const idx = grades.findIndex(g => g.id === id);
  if (idx === -1) return null;
  const updated = { ...grades[idx], ...data };
  if (data.marksObtained !== undefined || data.maxMarks !== undefined) {
    updated.percentage = Math.round((updated.marksObtained / updated.maxMarks) * 100);
    updated.gradeLetter = getGradeLetter(updated.percentage).letter;
  }
  updated.updatedAt = new Date().toISOString();
  grades[idx] = updated;
  setStorageItem('grades', grades);
  notifyChange('grades');
  return updated;
}

export function deleteGrade(id: string): boolean {
  let grades = getGrades();
  grades = grades.filter(g => g.id !== id);
  setStorageItem('grades', grades);
  notifyChange('grades');
  return true;
}

export function getGradesByStudent(studentId: string): Grade[] {
  return getGrades().filter(g => g.studentId === studentId);
}

export function getGradesByCourse(courseId: string): Grade[] {
  return getGrades().filter(g => g.courseId === courseId);
}

// ==========================================
// Announcements
// ==========================================

export function getAnnouncements(): Announcement[] {
  return getStorageItem<Announcement[]>('announcements', []);
}

export function createAnnouncement(data: AnnouncementFormData, authorId: string): Announcement {
  const announcements = getAnnouncements();
  const announcement: Announcement = {
    ...data,
    id: generateId(),
    authorId,
    createdAt: new Date().toISOString(),
  };
  announcements.unshift(announcement);
  setStorageItem('announcements', announcements);
  addActivity('announcement_created', announcement.id, announcement.title, `New announcement: ${announcement.title}`);
  // Also create notification
  addNotification(announcement.title, announcement.message, 'info');
  notifyChange('announcements');
  return announcement;
}

export function updateAnnouncement(id: string, data: Partial<AnnouncementFormData>): Announcement | null {
  const announcements = getAnnouncements();
  const idx = announcements.findIndex(a => a.id === id);
  if (idx === -1) return null;
  announcements[idx] = { ...announcements[idx], ...data };
  setStorageItem('announcements', announcements);
  notifyChange('announcements');
  return announcements[idx];
}

export function deleteAnnouncement(id: string): boolean {
  let announcements = getAnnouncements();
  announcements = announcements.filter(a => a.id !== id);
  setStorageItem('announcements', announcements);
  notifyChange('announcements');
  return true;
}

// ==========================================
// Activities
// ==========================================

export function getActivities(): Activity[] {
  return getStorageItem<Activity[]>('activities', []);
}

function addActivity(type: Activity['type'], entityId: string, entityName: string, description: string): void {
  const activities = getActivities();
  const currentUser = getCurrentUser();
  activities.unshift({
    id: generateId(),
    type,
    entityId,
    entityName,
    userId: currentUser?.id || 'system',
    description,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 100
  if (activities.length > 100) activities.length = 100;
  setStorageItem('activities', activities);
  notifyChange('activities');
}

// ==========================================
// Notifications
// ==========================================

export function getNotifications(): Notification[] {
  return getStorageItem<Notification[]>('notifications', []);
}

export function addNotification(title: string, message: string, type: Notification['type']): Notification {
  const notifications = getNotifications();
  const notif: Notification = {
    id: generateId(),
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);
  if (notifications.length > 50) notifications.length = 50;
  setStorageItem('notifications', notifications);
  notifyChange('notifications');
  return notif;
}

export function markNotificationRead(id: string): void {
  const notifications = getNotifications();
  const idx = notifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    notifications[idx].read = true;
    setStorageItem('notifications', notifications);
    notifyChange('notifications');
  }
}

export function markAllNotificationsRead(): void {
  const notifications = getNotifications().map(n => ({ ...n, read: true }));
  setStorageItem('notifications', notifications);
  notifyChange('notifications');
}

// ==========================================
// Settings
// ==========================================

export function getSettings(): AppSettings {
  return getStorageItem<AppSettings>('settings', {
    version: '1.0.0',
    theme: 'light',
    attendanceThreshold: 75,
    academicYear: 2024,
    collegeName: 'Pinnacle University',
    sidebarCollapsed: false,
  });
}

export function updateSettings(data: Partial<AppSettings>): AppSettings {
  const settings = getSettings();
  const updated = { ...settings, ...data };
  setStorageItem('settings', updated);
  notifyChange('settings');
  return updated;
}

// ==========================================
// Auth - Session
// ==========================================

export function getCurrentUser(): User | null {
  return getStorageItem<User | null>('currentUser', null);
}

export function setCurrentUser(user: User | null): void {
  setStorageItem('currentUser', user);
  notifyChange('currentUser');
}

// ==========================================
// CSV Export
// ==========================================

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '');
        // Escape values containing commas, quotes, or newlines
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    ),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

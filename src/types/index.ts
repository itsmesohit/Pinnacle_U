// ==========================================
// Core Entity Types
// ==========================================

export type UserRole = 'admin' | 'teacher' | 'student';
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';
export type EmploymentStatus = 'active' | 'on_leave' | 'retired' | 'terminated';
export type CourseStatus = 'active' | 'inactive' | 'completed' | 'upcoming';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AnnouncementAudience = 'all' | 'teachers' | 'students';
export type AssessmentType = 'quiz' | 'midterm' | 'final' | 'assignment' | 'project' | 'lab' | 'presentation';
export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';
export type GradeLetter = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
export type Theme = 'light' | 'dark' | 'system';

// ==========================================
// User / Auth
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  linkedEntityId?: string; // links to student or teacher ID
}

export interface DemoCredential {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

// ==========================================
// Department
// ==========================================

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headId?: string; // teacher ID
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Student
// ==========================================

export interface Student {
  id: string;
  studentId: string; // e.g., STU-2024-001
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  avatar?: string;
  departmentId: string;
  program: string;
  academicYear: number;
  semester: number;
  enrollmentDate: string;
  status: StudentStatus;
  address: string;
  guardianName: string;
  guardianContact: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Teacher
// ==========================================

export interface Teacher {
  id: string;
  teacherId: string; // e.g., TCH-001
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  specialization: string;
  joiningDate: string;
  status: EmploymentStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Course
// ==========================================

export interface Course {
  id: string;
  courseId: string; // e.g., CS101
  code: string;
  name: string;
  description: string;
  departmentId: string;
  credits: number;
  semester: number;
  academicYear: number;
  teacherId?: string;
  maxEnrollment: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Enrollment
// ==========================================

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: string;
  status: 'enrolled' | 'dropped' | 'completed';
  createdAt: string;
}

// ==========================================
// Attendance
// ==========================================

export interface AttendanceSession {
  id: string;
  courseId: string;
  date: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

// ==========================================
// Grades
// ==========================================

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  assessmentName: string;
  assessmentType: AssessmentType;
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  gradeLetter?: GradeLetter;
  assessmentDate: string;
  teacherId: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeBand {
  letter: GradeLetter;
  minPercentage: number;
  maxPercentage: number;
  gradePoints: number;
}

// ==========================================
// Announcements
// ==========================================

export interface Announcement {
  id: string;
  title: string;
  message: string;
  authorId: string;
  audience: AnnouncementAudience;
  createdAt: string;
  expiryDate?: string;
  isRead?: boolean;
}

// ==========================================
// Activity Log
// ==========================================

export interface Activity {
  id: string;
  type: 'student_added' | 'student_updated' | 'student_deleted' |
        'teacher_added' | 'teacher_updated' | 'teacher_deleted' |
        'course_added' | 'course_updated' | 'course_deleted' |
        'enrollment_added' | 'attendance_marked' | 'grade_added' |
        'announcement_created' | 'department_added' | 'department_updated';
  entityId: string;
  entityName: string;
  userId: string;
  description: string;
  timestamp: string;
}

// ==========================================
// Settings
// ==========================================

export interface AppSettings {
  version: string;
  theme: Theme;
  attendanceThreshold: number;
  academicYear: number;
  collegeName: string;
  sidebarCollapsed: boolean;
}

// ==========================================
// Notifications
// ==========================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  userId?: string;
  link?: string;
}

// ==========================================
// Navigation
// ==========================================

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  badge?: number;
}

// ==========================================
// Table / Filter Types
// ==========================================

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterOption {
  label: string;
  value: string;
}

// ==========================================
// Form Types
// ==========================================

export interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  avatar?: string;
  departmentId: string;
  program: string;
  academicYear: number;
  semester: number;
  enrollmentDate: string;
  status: StudentStatus;
  address: string;
  guardianName: string;
  guardianContact: string;
  emergencyContact?: string;
}

export interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  specialization: string;
  joiningDate: string;
  status: EmploymentStatus;
  avatar?: string;
}

export interface CourseFormData {
  code: string;
  name: string;
  description: string;
  departmentId: string;
  credits: number;
  semester: number;
  academicYear: number;
  teacherId?: string;
  maxEnrollment: number;
  status: CourseStatus;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
  headId?: string;
}

export interface GradeFormData {
  studentId: string;
  courseId: string;
  assessmentName: string;
  assessmentType: AssessmentType;
  maxMarks: number;
  marksObtained: number;
  assessmentDate: string;
  feedback?: string;
}

export interface AnnouncementFormData {
  title: string;
  message: string;
  audience: AnnouncementAudience;
  expiryDate?: string;
}

import {
  User, Student, Teacher, Department, Course, Enrollment,
  AttendanceSession, AttendanceRecord, Grade, Announcement,
  Activity, AppSettings, Notification, GradeBand
} from '../types';
import { generateId } from './storage';

// ==========================================
// Grade Bands
// ==========================================

export const GRADE_BANDS: GradeBand[] = [
  { letter: 'A+', minPercentage: 95, maxPercentage: 100, gradePoints: 4.0 },
  { letter: 'A',  minPercentage: 90, maxPercentage: 94,  gradePoints: 4.0 },
  { letter: 'A-', minPercentage: 85, maxPercentage: 89,  gradePoints: 3.7 },
  { letter: 'B+', minPercentage: 80, maxPercentage: 84,  gradePoints: 3.3 },
  { letter: 'B',  minPercentage: 75, maxPercentage: 79,  gradePoints: 3.0 },
  { letter: 'B-', minPercentage: 70, maxPercentage: 74,  gradePoints: 2.7 },
  { letter: 'C+', minPercentage: 65, maxPercentage: 69,  gradePoints: 2.3 },
  { letter: 'C',  minPercentage: 60, maxPercentage: 64,  gradePoints: 2.0 },
  { letter: 'C-', minPercentage: 55, maxPercentage: 59,  gradePoints: 1.7 },
  { letter: 'D',  minPercentage: 50, maxPercentage: 54,  gradePoints: 1.0 },
  { letter: 'F',  minPercentage: 0,  maxPercentage: 49,  gradePoints: 0.0 },
];

export function getGradeLetter(percentage: number): GradeBand {
  return GRADE_BANDS.find(b => percentage >= b.minPercentage && percentage <= b.maxPercentage) || GRADE_BANDS[GRADE_BANDS.length - 1];
}

// ==========================================
// Demo Users
// ==========================================

export const DEMO_CREDENTIALS = [
  { email: 'admin@college.edu', password: 'admin123', role: 'admin' as const, name: 'Dr. Sarah Mitchell' },
  { email: 'teacher@college.edu', password: 'teacher123', role: 'teacher' as const, name: 'Prof. James Wilson' },
  { email: 'student@college.edu', password: 'student123', role: 'student' as const, name: 'Alex Johnson' },
];

// ==========================================
// Seed Data Generator
// ==========================================

export function generateSeedData() {
  const now = new Date().toISOString();

  // -- Departments --
  const departments: Department[] = [
    { id: 'dept-cs', name: 'Computer Science', code: 'CS', description: 'Department of Computer Science and Engineering', headId: 'teacher-1', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'dept-math', name: 'Mathematics', code: 'MATH', description: 'Department of Mathematics and Statistics', headId: 'teacher-2', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'dept-phy', name: 'Physics', code: 'PHY', description: 'Department of Physics and Applied Sciences', headId: 'teacher-3', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'dept-eng', name: 'English', code: 'ENG', description: 'Department of English Literature and Linguistics', headId: 'teacher-4', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'dept-bus', name: 'Business Administration', code: 'BUS', description: 'Department of Business and Management Studies', headId: 'teacher-5', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'dept-bio', name: 'Biology', code: 'BIO', description: 'Department of Biological Sciences', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
  ];

  // -- Teachers --
  const teachers: Teacher[] = [
    { id: 'teacher-1', teacherId: 'TCH-001', firstName: 'James', lastName: 'Wilson', email: 'teacher@college.edu', phone: '+1-555-0101', departmentId: 'dept-cs', designation: 'Associate Professor', specialization: 'Machine Learning', joiningDate: '2019-08-15', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'teacher-2', teacherId: 'TCH-002', firstName: 'Emily', lastName: 'Chen', email: 'emily.chen@college.edu', phone: '+1-555-0102', departmentId: 'dept-math', designation: 'Professor', specialization: 'Abstract Algebra', joiningDate: '2015-06-01', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'teacher-3', teacherId: 'TCH-003', firstName: 'Robert', lastName: 'Martinez', email: 'robert.martinez@college.edu', phone: '+1-555-0103', departmentId: 'dept-phy', designation: 'Assistant Professor', specialization: 'Quantum Mechanics', joiningDate: '2021-01-10', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'teacher-4', teacherId: 'TCH-004', firstName: 'Lisa', lastName: 'Patel', email: 'lisa.patel@college.edu', phone: '+1-555-0104', departmentId: 'dept-eng', designation: 'Professor', specialization: 'Victorian Literature', joiningDate: '2012-09-01', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'teacher-5', teacherId: 'TCH-005', firstName: 'David', lastName: 'Kim', email: 'david.kim@college.edu', phone: '+1-555-0105', departmentId: 'dept-bus', designation: 'Associate Professor', specialization: 'Corporate Finance', joiningDate: '2018-03-20', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'teacher-6', teacherId: 'TCH-006', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@college.edu', phone: '+1-555-0106', departmentId: 'dept-cs', designation: 'Assistant Professor', specialization: 'Cybersecurity', joiningDate: '2022-08-01', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'teacher-7', teacherId: 'TCH-007', firstName: 'Thomas', lastName: 'Brown', email: 'thomas.brown@college.edu', phone: '+1-555-0107', departmentId: 'dept-bio', designation: 'Professor', specialization: 'Molecular Biology', joiningDate: '2014-01-15', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
    { id: 'teacher-8', teacherId: 'TCH-008', firstName: 'Sarah', lastName: 'Mitchell', email: 'admin@college.edu', phone: '+1-555-0100', departmentId: 'dept-cs', designation: 'Dean', specialization: 'Computer Science Education', joiningDate: '2010-06-15', status: 'active', createdAt: '2024-01-15T08:00:00Z', updatedAt: now },
  ];

  // -- Users (demo accounts) --
  const users: User[] = [
    { id: 'user-admin', email: 'admin@college.edu', name: 'Dr. Sarah Mitchell', role: 'admin', linkedEntityId: 'teacher-8' },
    { id: 'user-teacher', email: 'teacher@college.edu', name: 'Prof. James Wilson', role: 'teacher', linkedEntityId: 'teacher-1' },
    { id: 'user-student', email: 'student@college.edu', name: 'Alex Johnson', role: 'student', linkedEntityId: 'student-1' },
  ];

  // -- Courses --
  const courses: Course[] = [
    { id: 'course-1', courseId: 'CRS-CS101', code: 'CS101', name: 'Introduction to Computer Science', description: 'Fundamental concepts of programming and computational thinking', departmentId: 'dept-cs', credits: 4, semester: 1, academicYear: 2024, teacherId: 'teacher-1', maxEnrollment: 40, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-2', courseId: 'CRS-CS201', code: 'CS201', name: 'Data Structures and Algorithms', description: 'Advanced data structures, algorithm design and analysis', departmentId: 'dept-cs', credits: 4, semester: 2, academicYear: 2024, teacherId: 'teacher-1', maxEnrollment: 35, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-3', courseId: 'CRS-CS301', code: 'CS301', name: 'Database Management Systems', description: 'Relational databases, SQL, normalization, and database design', departmentId: 'dept-cs', credits: 3, semester: 3, academicYear: 2024, teacherId: 'teacher-6', maxEnrollment: 30, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-4', courseId: 'CRS-MATH101', code: 'MATH101', name: 'Calculus I', description: 'Limits, derivatives, integrals and their applications', departmentId: 'dept-math', credits: 4, semester: 1, academicYear: 2024, teacherId: 'teacher-2', maxEnrollment: 45, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-5', courseId: 'CRS-MATH201', code: 'MATH201', name: 'Linear Algebra', description: 'Vector spaces, matrices, eigenvalues and linear transformations', departmentId: 'dept-math', credits: 3, semester: 2, academicYear: 2024, teacherId: 'teacher-2', maxEnrollment: 40, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-6', courseId: 'CRS-PHY101', code: 'PHY101', name: 'Physics I - Mechanics', description: 'Newton\'s laws, kinematics, energy, and momentum', departmentId: 'dept-phy', credits: 4, semester: 1, academicYear: 2024, teacherId: 'teacher-3', maxEnrollment: 40, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-7', courseId: 'CRS-ENG101', code: 'ENG101', name: 'English Composition', description: 'Academic writing, critical reading, and rhetoric', departmentId: 'dept-eng', credits: 3, semester: 1, academicYear: 2024, teacherId: 'teacher-4', maxEnrollment: 35, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-8', courseId: 'CRS-BUS101', code: 'BUS101', name: 'Principles of Management', description: 'Introduction to management theory and organizational behavior', departmentId: 'dept-bus', credits: 3, semester: 1, academicYear: 2024, teacherId: 'teacher-5', maxEnrollment: 50, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-9', courseId: 'CRS-BIO101', code: 'BIO101', name: 'General Biology', description: 'Cell biology, genetics, evolution, and ecology', departmentId: 'dept-bio', credits: 4, semester: 1, academicYear: 2024, teacherId: 'teacher-7', maxEnrollment: 40, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
    { id: 'course-10', courseId: 'CRS-CS401', code: 'CS401', name: 'Machine Learning Fundamentals', description: 'Supervised and unsupervised learning, neural networks, model evaluation', departmentId: 'dept-cs', credits: 4, semester: 4, academicYear: 2024, teacherId: 'teacher-1', maxEnrollment: 25, status: 'active', createdAt: '2024-01-20T08:00:00Z', updatedAt: now },
  ];

  // -- Students --
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Cameron', 'Skyler', 'Dakota', 'Reese', 'Finley', 'Rowan', 'Sage', 'Harper', 'Emerson', 'Blake', 'Drew', 'Hayden', 'Kendall', 'Logan', 'Parker', 'Peyton', 'Spencer', 'Jamie', 'Devon', 'Addison', 'Charlie', 'Frankie', 'Jesse', 'Kai', 'Lane', 'Micah', 'Nico', 'Oakley', 'Remy', 'Sam', 'Shay', 'Tatum'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'];
  const genders: ('male' | 'female' | 'non-binary')[] = ['male', 'female', 'non-binary'];
  const programs = ['B.Sc. Computer Science', 'B.Sc. Mathematics', 'B.Sc. Physics', 'B.A. English', 'BBA', 'B.Sc. Biology'];
  const deptIds = ['dept-cs', 'dept-math', 'dept-phy', 'dept-eng', 'dept-bus', 'dept-bio'];
  const statuses: ('active' | 'inactive' | 'graduated')[] = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'inactive', 'graduated'];
  const cities = ['Springfield', 'Riverside', 'Lakewood', 'Fairview', 'Georgetown', 'Madison', 'Arlington', 'Burlington', 'Franklin', 'Greenville'];

  const students: Student[] = [];
  for (let i = 0; i < 40; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const deptIndex = i % deptIds.length;
    const year = Math.floor(Math.random() * 4) + 1;
    const sem = Math.floor(Math.random() * 2) + 1 + (year - 1) * 2;
    const enrollMonth = Math.floor(Math.random() * 12) + 1;
    const enrollYear = 2024 - Math.floor(Math.random() * 3);
    students.push({
      id: `student-${i + 1}`,
      studentId: `STU-2024-${String(i + 1).padStart(3, '0')}`,
      firstName: fn,
      lastName: ln,
      email: i === 0 ? 'student@college.edu' : `${fn.toLowerCase()}.${ln.toLowerCase()}@student.college.edu`,
      phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
      dateOfBirth: `${2000 + Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      gender: genders[i % genders.length],
      departmentId: deptIds[deptIndex],
      program: programs[deptIndex],
      academicYear: year,
      semester: Math.min(sem, 8),
      enrollmentDate: `${enrollYear}-${String(enrollMonth).padStart(2, '0')}-01`,
      status: statuses[i % statuses.length],
      address: `${100 + i} ${cities[i % cities.length]} Ave, State ${String(10000 + i)}`,
      guardianName: `${firstNames[(i + 10) % firstNames.length]} ${ln}`,
      guardianContact: `+1-555-${String(2000 + i).padStart(4, '0')}`,
      emergencyContact: i % 3 === 0 ? `+1-555-${String(3000 + i).padStart(4, '0')}` : undefined,
      createdAt: `${enrollYear}-${String(enrollMonth).padStart(2, '0')}-01T08:00:00Z`,
      updatedAt: now,
    });
  }

  // Generate User accounts for all students and teachers with default passwords
  students.forEach((s, idx) => {
    if (idx > 0) { // first student is already demo user-student
      users.push({
        id: `user-${s.id}`,
        email: s.email,
        name: `${s.firstName} ${s.lastName}`,
        role: 'student',
        password: 'student123',
        linkedEntityId: s.id,
      });
    }
  });

  teachers.forEach((t, idx) => {
    if (idx !== 0 && idx !== 7) { // teacher-1 and teacher-8 are already demo accounts
      users.push({
        id: `user-${t.id}`,
        email: t.email,
        name: `${t.firstName} ${t.lastName}`,
        role: 'teacher',
        password: 'teacher123',
        linkedEntityId: t.id,
      });
    }
  });

  // -- Enrollments --
  const enrollments: Enrollment[] = [];
  const coursesByDept: Record<string, string[]> = {};
  courses.forEach(c => {
    if (!coursesByDept[c.departmentId]) coursesByDept[c.departmentId] = [];
    coursesByDept[c.departmentId].push(c.id);
  });

  students.forEach((s, idx) => {
    // Enroll in own-department courses
    const deptCourses = coursesByDept[s.departmentId] || [];
    deptCourses.forEach(cid => {
      enrollments.push({
        id: generateId() + `-enr-${idx}-${cid}`,
        studentId: s.id,
        courseId: cid,
        enrollmentDate: s.enrollmentDate,
        status: s.status === 'graduated' ? 'completed' : 'enrolled',
        createdAt: s.enrollmentDate + 'T08:00:00Z',
      });
    });
    // Also enroll in 1-2 cross-department courses
    const otherCourses = courses.filter(c => c.departmentId !== s.departmentId);
    const crossCount = idx % 3 === 0 ? 2 : 1;
    for (let j = 0; j < crossCount && j < otherCourses.length; j++) {
      const cc = otherCourses[(idx + j) % otherCourses.length];
      enrollments.push({
        id: generateId() + `-enr-cross-${idx}-${j}`,
        studentId: s.id,
        courseId: cc.id,
        enrollmentDate: s.enrollmentDate,
        status: s.status === 'graduated' ? 'completed' : 'enrolled',
        createdAt: s.enrollmentDate + 'T08:00:00Z',
      });
    }
  });

  // -- Attendance Sessions & Records --
  const attendanceSessions: AttendanceSession[] = [];
  const attendanceRecords: AttendanceRecord[] = [];

  // Create sessions for the last 30 days for active courses
  const activeCourses = courses.filter(c => c.status === 'active' && c.teacherId);
  const today = new Date();
  activeCourses.forEach(course => {
    for (let dayOffset = 1; dayOffset <= 20; dayOffset += 2) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const dateStr = date.toISOString().split('T')[0];
      const sessionId = `session-${course.id}-${dateStr}`;
      attendanceSessions.push({
        id: sessionId,
        courseId: course.id,
        date: dateStr,
        teacherId: course.teacherId!,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });

      // Get enrolled students for this course
      const courseEnrollments = enrollments.filter(e => e.courseId === course.id && e.status === 'enrolled');
      courseEnrollments.forEach((enr, i) => {
        const rand = Math.random();
        let status: 'present' | 'absent' | 'late' | 'excused';
        if (rand < 0.75) status = 'present';
        else if (rand < 0.88) status = 'absent';
        else if (rand < 0.95) status = 'late';
        else status = 'excused';

        attendanceRecords.push({
          id: `atr-${sessionId}-${i}`,
          sessionId: sessionId,
          studentId: enr.studentId,
          status,
        });
      });
    }
  });

  // -- Grades --
  const grades: Grade[] = [];
  const assessmentTypes: ('quiz' | 'midterm' | 'assignment' | 'project')[] = ['quiz', 'midterm', 'assignment', 'project'];
  const assessmentNames = ['Quiz 1', 'Midterm Exam', 'Assignment 1', 'Project Phase 1', 'Quiz 2', 'Assignment 2'];

  activeCourses.forEach(course => {
    const courseEnrollments = enrollments.filter(e => e.courseId === course.id && e.status !== 'dropped');
    assessmentNames.forEach((aName, aIdx) => {
      courseEnrollments.slice(0, 15).forEach((enr, sIdx) => {
        const maxMarks = aIdx === 1 ? 100 : aIdx === 3 ? 50 : 25;
        const marksObtained = Math.max(0, Math.min(maxMarks, Math.round(maxMarks * (0.45 + Math.random() * 0.55))));
        const percentage = Math.round((marksObtained / maxMarks) * 100);
        const band = getGradeLetter(percentage);
        const assessDate = new Date(today);
        assessDate.setDate(assessDate.getDate() - (30 - aIdx * 5));

        grades.push({
          id: `grade-${course.id}-${aIdx}-${sIdx}`,
          studentId: enr.studentId,
          courseId: course.id,
          assessmentName: aName,
          assessmentType: assessmentTypes[aIdx % assessmentTypes.length],
          maxMarks,
          marksObtained,
          percentage,
          gradeLetter: band.letter,
          assessmentDate: assessDate.toISOString().split('T')[0],
          teacherId: course.teacherId!,
          feedback: percentage < 50 ? 'Needs improvement. Please attend office hours.' : percentage > 85 ? 'Excellent work!' : undefined,
          createdAt: assessDate.toISOString(),
          updatedAt: assessDate.toISOString(),
        });
      });
    });
  });

  // -- Announcements --
  const announcements: Announcement[] = [
    { id: 'ann-1', title: 'Welcome to Fall 2024 Semester', message: 'Welcome back to a new semester! Classes begin on August 26th. Please review your course schedules and reach out to your academic advisors if you have any questions.', authorId: 'user-admin', audience: 'all', createdAt: '2024-08-20T08:00:00Z' },
    { id: 'ann-2', title: 'Library Extended Hours', message: 'The university library will operate extended hours (7 AM - 11 PM) during midterm week. Study rooms can be reserved through the library portal.', authorId: 'user-admin', audience: 'all', createdAt: '2024-09-15T10:00:00Z' },
    { id: 'ann-3', title: 'Faculty Meeting - November', message: 'All faculty members are required to attend the monthly meeting on November 5th at 3 PM in the conference hall. Agenda includes curriculum review and assessment policies.', authorId: 'user-admin', audience: 'teachers', createdAt: '2024-10-25T08:00:00Z' },
    { id: 'ann-4', title: 'Midterm Exam Schedule Published', message: 'The midterm examination schedule has been published. Please check the academic calendar on the student portal for your exam dates and venues.', authorId: 'user-admin', audience: 'students', createdAt: '2024-09-28T09:00:00Z' },
    { id: 'ann-5', title: 'Hackathon 2024 Registration Open', message: 'Annual college hackathon registration is now open! Teams of 2-4 can register through the CS department portal. Prizes worth $5,000. Deadline: October 15th.', authorId: 'user-admin', audience: 'students', createdAt: '2024-10-01T14:00:00Z' },
    { id: 'ann-6', title: 'Grade Submission Deadline', message: 'Faculty are reminded that final grades for the Fall 2024 semester must be submitted by December 20th through the grading portal.', authorId: 'user-admin', audience: 'teachers', createdAt: '2024-11-01T08:00:00Z' },
    { id: 'ann-7', title: 'Campus Maintenance Notice', message: 'Building C will be undergoing maintenance from November 10-15. Classes normally held in Building C will be relocated. Check your updated schedules.', authorId: 'user-admin', audience: 'all', createdAt: '2024-11-05T07:00:00Z' },
    { id: 'ann-8', title: 'Scholarship Applications Open', message: 'Applications for Spring 2025 merit-based scholarships are now open. Eligible students with GPA above 3.5 can apply through the financial aid office by November 30th.', authorId: 'user-admin', audience: 'students', createdAt: '2024-10-15T10:00:00Z' },
  ];

  // -- Activities --
  const activities: Activity[] = [
    { id: 'act-1', type: 'student_added', entityId: 'student-1', entityName: 'Alex Johnson', userId: 'user-admin', description: 'New student Alex Johnson enrolled in B.Sc. Computer Science', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'act-2', type: 'course_added', entityId: 'course-10', entityName: 'Machine Learning Fundamentals', userId: 'user-admin', description: 'New course Machine Learning Fundamentals added to CS department', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'act-3', type: 'attendance_marked', entityId: 'course-1', entityName: 'Introduction to Computer Science', userId: 'user-teacher', description: 'Attendance marked for Introduction to Computer Science', timestamp: new Date(Date.now() - 10800000).toISOString() },
    { id: 'act-4', type: 'grade_added', entityId: 'course-2', entityName: 'Data Structures and Algorithms', userId: 'user-teacher', description: 'Quiz 1 grades entered for Data Structures and Algorithms', timestamp: new Date(Date.now() - 14400000).toISOString() },
    { id: 'act-5', type: 'teacher_added', entityId: 'teacher-6', entityName: 'Maria Garcia', userId: 'user-admin', description: 'New faculty member Maria Garcia joined CS department', timestamp: new Date(Date.now() - 18000000).toISOString() },
    { id: 'act-6', type: 'announcement_created', entityId: 'ann-8', entityName: 'Scholarship Applications Open', userId: 'user-admin', description: 'New announcement: Scholarship Applications Open', timestamp: new Date(Date.now() - 21600000).toISOString() },
    { id: 'act-7', type: 'enrollment_added', entityId: 'course-10', entityName: 'Machine Learning Fundamentals', userId: 'user-admin', description: '5 students enrolled in Machine Learning Fundamentals', timestamp: new Date(Date.now() - 25200000).toISOString() },
    { id: 'act-8', type: 'student_updated', entityId: 'student-5', entityName: 'Casey Garcia', userId: 'user-admin', description: 'Student Casey Garcia status updated to active', timestamp: new Date(Date.now() - 28800000).toISOString() },
  ];

  // -- Notifications --
  const notifications: Notification[] = [
    { id: 'notif-1', title: 'New Announcement', message: 'Scholarship Applications Open', type: 'info', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'notif-2', title: 'Attendance Alert', message: '3 students below 75% attendance threshold', type: 'warning', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'notif-3', title: 'Grades Published', message: 'Quiz 1 grades for CS201 published', type: 'success', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'notif-4', title: 'System Update', message: 'System maintenance scheduled for this weekend', type: 'info', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  ];

  // -- Settings --
  const settings: AppSettings = {
    version: '1.0.0',
    theme: 'light',
    attendanceThreshold: 75,
    academicYear: 2024,
    collegeName: 'Pinnacle University',
    sidebarCollapsed: false,
  };

  return {
    users,
    students,
    teachers,
    departments,
    courses,
    enrollments,
    attendanceSessions,
    attendanceRecords,
    grades,
    announcements,
    activities,
    notifications,
    settings,
  };
}

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSeedData } from '../src/lib/seedData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Pinnacle University database seeding into Supabase PostgreSQL (Batch Optimized)...');

  const {
    departments,
    teachers,
    courses,
    students,
    enrollments,
    attendanceSessions,
    attendanceRecords,
    grades,
    announcements,
  } = generateSeedData();

  // 1. Clean existing records in reverse dependency order
  console.log('🧹 Cleaning existing tables...');
  try {
    await prisma.activityLog.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.grade.deleteMany({});
    await prisma.attendanceRecord.deleteMany({});
    await prisma.attendanceSession.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (err: any) {
    console.warn('Note during clean up:', err.message);
  }

  // 2. Batch Seed Departments
  console.log(`🏢 Seeding ${departments.length} departments...`);
  await prisma.department.createMany({
    data: departments.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      headId: d.headId || null,
    })),
    skipDuplicates: true,
  });

  // 3. Batch Seed Teachers
  console.log(`👨‍🏫 Seeding ${teachers.length} teachers...`);
  await prisma.teacher.createMany({
    data: teachers.map(t => ({
      id: t.id,
      teacherId: t.teacherId,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone,
      departmentId: t.departmentId,
      designation: t.designation,
      specialization: t.specialization,
      joiningDate: t.joiningDate,
      status: t.status,
    })),
    skipDuplicates: true,
  });

  // 4. Batch Seed Courses
  console.log(`📚 Seeding ${courses.length} courses...`);
  await prisma.course.createMany({
    data: courses.map(c => ({
      id: c.id,
      courseId: c.courseId,
      code: c.code,
      name: c.name,
      description: c.description,
      departmentId: c.departmentId,
      credits: c.credits,
      semester: c.semester,
      academicYear: c.academicYear,
      teacherId: c.teacherId || null,
      maxEnrollment: c.maxEnrollment,
      status: c.status,
    })),
    skipDuplicates: true,
  });

  // 5. Batch Seed Students
  console.log(`🎓 Seeding ${students.length} students...`);
  await prisma.student.createMany({
    data: students.map(s => ({
      id: s.id,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      departmentId: s.departmentId,
      program: s.program,
      academicYear: s.academicYear,
      semester: s.semester,
      enrollmentDate: s.enrollmentDate,
      status: s.status,
      address: s.address,
      guardianName: s.guardianName,
      guardianContact: s.guardianContact,
      emergencyContact: s.emergencyContact || null,
    })),
    skipDuplicates: true,
  });

  // 6. Batch Seed Enrollments
  console.log(`📝 Seeding ${enrollments.length} enrollments...`);
  await prisma.enrollment.createMany({
    data: enrollments.map(e => ({
      id: e.id,
      studentId: e.studentId,
      courseId: e.courseId,
      enrollmentDate: e.enrollmentDate,
      status: e.status,
    })),
    skipDuplicates: true,
  });

  // 7. Batch Seed Attendance Sessions & Records
  console.log(`🗓️ Seeding ${attendanceSessions.length} attendance sessions...`);
  await prisma.attendanceSession.createMany({
    data: attendanceSessions.map(s => ({
      id: s.id,
      courseId: s.courseId,
      date: s.date,
      teacherId: s.teacherId,
    })),
    skipDuplicates: true,
  });

  console.log(`📋 Seeding ${attendanceRecords.length} attendance records...`);
  await prisma.attendanceRecord.createMany({
    data: attendanceRecords.map(r => ({
      id: r.id,
      sessionId: r.sessionId,
      studentId: r.studentId,
      status: r.status,
      remarks: r.remarks || null,
    })),
    skipDuplicates: true,
  });

  // 8. Batch Seed Grades
  console.log(`📊 Seeding ${grades.length} grades...`);
  await prisma.grade.createMany({
    data: grades.map(g => ({
      id: g.id,
      studentId: g.studentId,
      courseId: g.courseId,
      assessmentName: g.assessmentName,
      assessmentType: g.assessmentType,
      maxMarks: g.maxMarks,
      marksObtained: g.marksObtained,
      percentage: g.percentage,
      gradeLetter: g.gradeLetter || null,
      assessmentDate: g.assessmentDate,
      teacherId: g.teacherId,
      feedback: g.feedback || null,
    })),
    skipDuplicates: true,
  });

  // 9. Batch Seed Announcements
  console.log(`📢 Seeding ${announcements.length} announcements...`);
  await prisma.announcement.createMany({
    data: announcements.map(a => ({
      id: a.id,
      title: a.title,
      message: a.message,
      authorId: a.authorId,
      audience: a.audience,
      expiryDate: a.expiryDate || null,
    })),
    skipDuplicates: true,
  });

  // 10. Provision Users (Demo Users + Students + Teachers)
  console.log('🔑 Provisioning user accounts with encrypted passwords in batch...');
  const studentHashedPass = await bcrypt.hash('student123', 10);
  const teacherHashedPass = await bcrypt.hash('teacher123', 10);
  const adminHashedPass = await bcrypt.hash('admin123', 10);

  const usersToCreate = [
    {
      email: 'admin@college.edu',
      name: 'Dr. Sarah Mitchell',
      password: adminHashedPass,
      role: 'admin',
      isVerified: true,
    },
    {
      email: 'teacher@college.edu',
      name: 'Prof. James Wilson',
      password: teacherHashedPass,
      role: 'teacher',
      linkedEntityId: 'teacher-1',
      isVerified: true,
    },
    {
      email: 'student@college.edu',
      name: 'Alex Johnson',
      password: studentHashedPass,
      role: 'student',
      linkedEntityId: 'stu-1',
      isVerified: true,
    },
    ...students.map(s => ({
      email: s.email,
      name: `${s.firstName} ${s.lastName}`,
      password: studentHashedPass,
      role: 'student',
      linkedEntityId: s.id,
      isVerified: true,
    })),
  ];

  await prisma.user.createMany({
    data: usersToCreate,
    skipDuplicates: true,
  });

  console.log('🎉 Seeding successfully completed! All tables are populated in Supabase PostgreSQL.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

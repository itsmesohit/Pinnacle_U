import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSeedData, DEMO_CREDENTIALS } from '../src/lib/seedData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Pinnacle University database seeding into Supabase PostgreSQL...');

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

  // 2. Seed Departments
  console.log(`🏢 Seeding ${departments.length} departments...`);
  for (const dept of departments) {
    await prisma.department.create({
      data: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        headId: dept.headId || null,
      },
    });
  }

  // 3. Seed Teachers
  console.log(`👨‍🏫 Seeding ${teachers.length} teachers...`);
  for (const tch of teachers) {
    await prisma.teacher.create({
      data: {
        id: tch.id,
        teacherId: tch.teacherId,
        firstName: tch.firstName,
        lastName: tch.lastName,
        email: tch.email,
        phone: tch.phone,
        departmentId: tch.departmentId,
        designation: tch.designation,
        specialization: tch.specialization,
        joiningDate: tch.joiningDate,
        status: tch.status,
      },
    });
  }

  // 4. Seed Courses
  console.log(`📚 Seeding ${courses.length} courses...`);
  for (const crs of courses) {
    await prisma.course.create({
      data: {
        id: crs.id,
        courseId: crs.courseId,
        code: crs.code,
        name: crs.name,
        description: crs.description,
        departmentId: crs.departmentId,
        credits: crs.credits,
        semester: crs.semester,
        academicYear: crs.academicYear,
        teacherId: crs.teacherId || null,
        maxEnrollment: crs.maxEnrollment,
        status: crs.status,
      },
    });
  }

  // 5. Seed Students
  console.log(`🎓 Seeding ${students.length} students...`);
  for (const stu of students) {
    await prisma.student.create({
      data: {
        id: stu.id,
        studentId: stu.studentId,
        firstName: stu.firstName,
        lastName: stu.lastName,
        email: stu.email,
        phone: stu.phone,
        dateOfBirth: stu.dateOfBirth,
        gender: stu.gender,
        departmentId: stu.departmentId,
        program: stu.program,
        academicYear: stu.academicYear,
        semester: stu.semester,
        enrollmentDate: stu.enrollmentDate,
        status: stu.status,
        address: stu.address,
        guardianName: stu.guardianName,
        guardianContact: stu.guardianContact,
        emergencyContact: stu.emergencyContact || null,
      },
    });
  }

  // 6. Seed Enrollments
  console.log(`📝 Seeding ${enrollments.length} enrollments...`);
  for (const enr of enrollments) {
    try {
      await prisma.enrollment.create({
        data: {
          id: enr.id,
          studentId: enr.studentId,
          courseId: enr.courseId,
          enrollmentDate: enr.enrollmentDate,
          status: enr.status,
        },
      });
    } catch {}
  }

  // 7. Seed Attendance Sessions & Records
  console.log(`🗓️ Seeding ${attendanceSessions.length} attendance sessions...`);
  for (const session of attendanceSessions) {
    try {
      await prisma.attendanceSession.create({
        data: {
          id: session.id,
          courseId: session.courseId,
          date: session.date,
          teacherId: session.teacherId,
        },
      });
    } catch {}
  }

  console.log(`📋 Seeding ${attendanceRecords.length} attendance records...`);
  for (const rec of attendanceRecords) {
    try {
      await prisma.attendanceRecord.create({
        data: {
          id: rec.id,
          sessionId: rec.sessionId,
          studentId: rec.studentId,
          status: rec.status,
          remarks: rec.remarks || null,
        },
      });
    } catch {}
  }

  // 8. Seed Grades
  console.log(`📊 Seeding ${grades.length} grades...`);
  for (const grd of grades) {
    try {
      await prisma.grade.create({
        data: {
          id: grd.id,
          studentId: grd.studentId,
          courseId: grd.courseId,
          assessmentName: grd.assessmentName,
          assessmentType: grd.assessmentType,
          maxMarks: grd.maxMarks,
          marksObtained: grd.marksObtained,
          percentage: grd.percentage,
          gradeLetter: grd.gradeLetter || null,
          assessmentDate: grd.assessmentDate,
          teacherId: grd.teacherId,
          feedback: grd.feedback || null,
        },
      });
    } catch {}
  }

  // 9. Seed Announcements
  console.log(`📢 Seeding ${announcements.length} announcements...`);
  for (const ann of announcements) {
    await prisma.announcement.create({
      data: {
        id: ann.id,
        title: ann.title,
        message: ann.message,
        authorId: ann.authorId,
        audience: ann.audience,
        expiryDate: ann.expiryDate || null,
      },
    });
  }

  // 10. Seed Users (Demo users + students + teachers with bcrypt hashed passwords)
  console.log('🔑 Provisioning user accounts with encrypted passwords...');
  const studentHashedPass = await bcrypt.hash('student123', 10);
  const teacherHashedPass = await bcrypt.hash('teacher123', 10);
  const adminHashedPass = await bcrypt.hash('admin123', 10);

  // Demo Admin
  await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      name: 'Dr. Sarah Mitchell',
      password: adminHashedPass,
      role: 'admin',
      isVerified: true,
    },
  });

  // Demo Teacher
  await prisma.user.create({
    data: {
      email: 'teacher@college.edu',
      name: 'Prof. James Wilson',
      password: teacherHashedPass,
      role: 'teacher',
      linkedEntityId: 'teacher-1',
      isVerified: true,
    },
  });

  // Demo Student
  await prisma.user.create({
    data: {
      email: 'student@college.edu',
      name: 'Alex Johnson',
      password: studentHashedPass,
      role: 'student',
      linkedEntityId: 'stu-1',
      isVerified: true,
    },
  });

  // Also create accounts for all students with default password "student123"
  for (const stu of students) {
    try {
      await prisma.user.upsert({
        where: { email: stu.email },
        update: {
          name: `${stu.firstName} ${stu.lastName}`,
          linkedEntityId: stu.id,
          role: 'student',
        },
        create: {
          email: stu.email,
          name: `${stu.firstName} ${stu.lastName}`,
          password: studentHashedPass,
          role: 'student',
          linkedEntityId: stu.id,
          isVerified: true,
        },
      });
    } catch {}
  }

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

import { Router } from 'express';
import { prisma } from '../db';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalCourses,
      totalDepartments,
      recentStudents,
      recentAnnouncements,
      records,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'active' } }),
      prisma.teacher.count({ where: { status: 'active' } }),
      prisma.course.count({ where: { status: 'active' } }),
      prisma.department.count(),
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { department: true },
      }),
      prisma.announcement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attendanceRecord.findMany({
        select: { status: true },
      }),
    ]);

    // Compute attendance percentage
    const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
    const avgAttendance = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 89;

    return res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        totalTeachers,
        totalCourses,
        totalDepartments,
        avgAttendance,
        recentStudents,
        recentAnnouncements,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

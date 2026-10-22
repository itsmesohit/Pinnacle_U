import { Router } from 'express';
import { prisma } from '../db';

export const coursesRouter = Router();

coursesRouter.get('/', async (req, res) => {
  try {
    const { departmentId, status, search, teacherId } = req.query;
    const where: any = {};
    if (departmentId && departmentId !== 'all') where.departmentId = String(departmentId);
    if (status && status !== 'all') where.status = String(status);
    if (teacherId) where.teacherId = String(teacherId);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { courseId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        department: true,
        teacher: true,
        _count: { select: { enrollments: true } },
      },
    });

    return res.json({ success: true, data: courses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

coursesRouter.get('/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        teacher: true,
        enrollments: { include: { student: true } },
        attendanceSessions: { include: { records: true } },
        grades: { include: { student: true } },
      },
    });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    return res.json({ success: true, data: course });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

coursesRouter.post('/', async (req, res) => {
  try {
    const data = req.body;
    const course = await prisma.course.create({
      data: {
        courseId: data.courseId,
        code: data.code,
        name: data.name,
        description: data.description,
        departmentId: data.departmentId,
        credits: Number(data.credits) || 3,
        semester: Number(data.semester) || 1,
        academicYear: Number(data.academicYear) || 1,
        teacherId: data.teacherId || null,
        maxEnrollment: Number(data.maxEnrollment) || 60,
        status: data.status || 'active',
      },
    });
    return res.status(201).json({ success: true, data: course });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

coursesRouter.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...data,
        credits: data.credits !== undefined ? Number(data.credits) : undefined,
        semester: data.semester !== undefined ? Number(data.semester) : undefined,
        academicYear: data.academicYear !== undefined ? Number(data.academicYear) : undefined,
        maxEnrollment: data.maxEnrollment !== undefined ? Number(data.maxEnrollment) : undefined,
      },
    });
    return res.json({ success: true, data: course });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

coursesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Course deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

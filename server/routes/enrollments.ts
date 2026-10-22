import { Router } from 'express';
import { prisma } from '../db';

export const enrollmentsRouter = Router();

enrollmentsRouter.get('/', async (req, res) => {
  try {
    const { studentId, courseId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    if (courseId) where.courseId = String(courseId);

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: true,
        course: { include: { department: true } },
      },
      orderBy: { enrollmentDate: 'desc' },
    });
    return res.json({ success: true, data: enrollments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

enrollmentsRouter.post('/', async (req, res) => {
  try {
    const { studentId, courseId, enrollmentDate, status = 'enrolled' } = req.body;

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Student is already enrolled in this course' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        enrollmentDate: enrollmentDate || new Date().toISOString().split('T')[0],
        status,
      },
      include: { student: true, course: true },
    });

    return res.status(201).json({ success: true, data: enrollment });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

enrollmentsRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.enrollment.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Enrollment removed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

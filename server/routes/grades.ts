import { Router } from 'express';
import { prisma } from '../db';

export const gradesRouter = Router();

function calculateGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 40) return 'D';
  return 'F';
}

gradesRouter.get('/', async (req, res) => {
  try {
    const { studentId, courseId, teacherId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    if (courseId) where.courseId = String(courseId);
    if (teacherId) where.teacherId = String(teacherId);

    const grades = await prisma.grade.findMany({
      where,
      orderBy: { assessmentDate: 'desc' },
      include: {
        student: true,
        course: true,
        teacher: true,
      },
    });

    return res.json({ success: true, data: grades });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

gradesRouter.post('/', async (req, res) => {
  try {
    const data = req.body;
    const maxMarks = Number(data.maxMarks) || 100;
    const marksObtained = Number(data.marksObtained) || 0;
    const percentage = Math.round((marksObtained / maxMarks) * 1000) / 10;
    const gradeLetter = data.gradeLetter || calculateGradeLetter(percentage);

    const grade = await prisma.grade.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        assessmentName: data.assessmentName,
        assessmentType: data.assessmentType,
        maxMarks,
        marksObtained,
        percentage,
        gradeLetter,
        assessmentDate: data.assessmentDate || new Date().toISOString().split('T')[0],
        teacherId: data.teacherId,
        feedback: data.feedback || null,
      },
      include: { student: true, course: true },
    });

    return res.status(201).json({ success: true, data: grade });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

gradesRouter.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const updateData: any = { ...data };

    if (data.maxMarks !== undefined || data.marksObtained !== undefined) {
      const existing = await prisma.grade.findUnique({ where: { id: req.params.id } });
      const maxMarks = data.maxMarks !== undefined ? Number(data.maxMarks) : (existing?.maxMarks || 100);
      const marksObtained = data.marksObtained !== undefined ? Number(data.marksObtained) : (existing?.marksObtained || 0);
      const percentage = Math.round((marksObtained / maxMarks) * 1000) / 10;
      updateData.maxMarks = maxMarks;
      updateData.marksObtained = marksObtained;
      updateData.percentage = percentage;
      updateData.gradeLetter = data.gradeLetter || calculateGradeLetter(percentage);
    }

    const grade = await prisma.grade.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return res.json({ success: true, data: grade });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

gradesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.grade.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Grade deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

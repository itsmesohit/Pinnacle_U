import { Router } from 'express';
import { prisma } from '../db';

export const attendanceRouter = Router();

// GET sessions (optionally by courseId or teacherId)
attendanceRouter.get('/sessions', async (req, res) => {
  try {
    const { courseId, teacherId } = req.query;
    const where: any = {};
    if (courseId) where.courseId = String(courseId);
    if (teacherId) where.teacherId = String(teacherId);

    const sessions = await prisma.attendanceSession.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        course: true,
        teacher: true,
        records: { include: { student: true } },
      },
    });

    return res.json({ success: true, data: sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET attendance records (optionally by studentId or sessionId)
attendanceRouter.get('/records', async (req, res) => {
  try {
    const { studentId, sessionId, courseId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    if (sessionId) where.sessionId = String(sessionId);
    if (courseId) where.session = { courseId: String(courseId) };

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        student: true,
        session: { include: { course: true } },
      },
    });

    return res.json({ success: true, data: records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST save / update full attendance session with student records
attendanceRouter.post('/sessions', async (req, res) => {
  try {
    const { courseId, date, teacherId, records } = req.body;

    // Check if session for course & date exists
    let session = await prisma.attendanceSession.findFirst({
      where: { courseId, date },
    });

    if (session) {
      session = await prisma.attendanceSession.update({
        where: { id: session.id },
        data: { teacherId },
      });
    } else {
      session = await prisma.attendanceSession.create({
        data: {
          courseId,
          date,
          teacherId,
        },
      });
    }

    // Upsert records
    if (Array.isArray(records)) {
      for (const rec of records) {
        await prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: rec.studentId,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks || null,
          },
          create: {
            sessionId: session.id,
            studentId: rec.studentId,
            status: rec.status,
            remarks: rec.remarks || null,
          },
        });
      }
    }

    const updatedSession = await prisma.attendanceSession.findUnique({
      where: { id: session.id },
      include: { records: { include: { student: true } } },
    });

    return res.json({ success: true, data: updatedSession });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

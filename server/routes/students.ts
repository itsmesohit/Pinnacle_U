import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

export const studentsRouter = Router();

// GET all students
studentsRouter.get('/', async (req, res) => {
  try {
    const { departmentId, status, search, year } = req.query;

    const where: any = {};
    if (departmentId && departmentId !== 'all') where.departmentId = String(departmentId);
    if (status && status !== 'all') where.status = String(status);
    if (year && year !== 'all') where.academicYear = Number(year);

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { studentId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { studentId: 'asc' },
      include: { department: true },
    });

    return res.json({ success: true, data: students });
  } catch (err: any) {
    console.error('Error fetching students:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET student by ID
studentsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: true,
        enrollments: { include: { course: true } },
        grades: { include: { course: true } },
        attendanceRecords: { include: { session: { include: { course: true } } } },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    return res.json({ success: true, data: student });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE student
studentsRouter.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Check duplicate studentId or email
    const existing = await prisma.student.findFirst({
      where: { OR: [{ email: data.email }, { studentId: data.studentId }] },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: existing.email === data.email ? 'A student with this email already exists' : 'Student ID already in use',
      });
    }

    const student = await prisma.student.create({
      data: {
        studentId: data.studentId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        departmentId: data.departmentId,
        program: data.program,
        academicYear: Number(data.academicYear) || 1,
        semester: Number(data.semester) || 1,
        enrollmentDate: data.enrollmentDate || new Date().toISOString().split('T')[0],
        status: data.status || 'active',
        address: data.address,
        guardianName: data.guardianName,
        guardianContact: data.guardianContact,
        emergencyContact: data.emergencyContact,
        avatar: data.avatar,
      },
    });

    // Auto-create User account with default password student123
    try {
      const defaultPassword = 'student123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await prisma.user.upsert({
        where: { email: student.email },
        update: {
          name: `${student.firstName} ${student.lastName}`,
          linkedEntityId: student.id,
          role: 'student',
        },
        create: {
          email: student.email,
          name: `${student.firstName} ${student.lastName}`,
          password: hashedPassword,
          role: 'student',
          linkedEntityId: student.id,
          isVerified: true,
        },
      });
    } catch (userErr) {
      console.warn('⚠️ Could not provision user login account:', userErr);
    }

    return res.status(201).json({
      success: true,
      data: student,
      defaultPassword: 'student123',
    });
  } catch (err: any) {
    console.error('Error creating student:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE student
studentsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...data,
        academicYear: data.academicYear !== undefined ? Number(data.academicYear) : undefined,
        semester: data.semester !== undefined ? Number(data.semester) : undefined,
      },
    });

    // Sync name & email in user table
    try {
      if (data.email || data.firstName || data.lastName) {
        await prisma.user.updateMany({
          where: { linkedEntityId: student.id },
          data: {
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
          },
        });
      }
    } catch {}

    return res.json({ success: true, data: student });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE student
studentsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.delete({ where: { id } });

    // Clean up user
    try {
      await prisma.user.deleteMany({
        where: { OR: [{ email: student.email }, { linkedEntityId: student.id }] },
      });
    } catch {}

    return res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// RESET student password to default "student123"
studentsRouter.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const hashedPassword = await bcrypt.hash('student123', 10);
    await prisma.user.upsert({
      where: { email: student.email },
      update: { password: hashedPassword },
      create: {
        email: student.email,
        name: `${student.firstName} ${student.lastName}`,
        password: hashedPassword,
        role: 'student',
        linkedEntityId: student.id,
        isVerified: true,
      },
    });

    return res.json({
      success: true,
      message: `Password for ${student.firstName} ${student.lastName} reset to "student123"`,
      defaultPassword: 'student123',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

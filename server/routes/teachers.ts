import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';

export const teachersRouter = Router();

// GET all teachers
teachersRouter.get('/', async (req, res) => {
  try {
    const { departmentId, status, search } = req.query;
    const where: any = {};
    if (departmentId && departmentId !== 'all') where.departmentId = String(departmentId);
    if (status && status !== 'all') where.status = String(status);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { teacherId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { teacherId: 'asc' },
      include: { department: true },
    });

    return res.json({ success: true, data: teachers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET teacher by ID
teachersRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        department: true,
        courses: true,
      },
    });

    if (!teacher) return res.status(404).json({ success: false, error: 'Teacher not found' });
    return res.json({ success: true, data: teacher });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE teacher
teachersRouter.post('/', async (req, res) => {
  try {
    const data = req.body;
    const teacher = await prisma.teacher.create({
      data: {
        teacherId: data.teacherId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        departmentId: data.departmentId,
        designation: data.designation,
        specialization: data.specialization,
        joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
        status: data.status || 'active',
        avatar: data.avatar,
      },
    });

    // Auto-create user account with default password teacher123
    try {
      const defaultPassword = 'teacher123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await prisma.user.upsert({
        where: { email: teacher.email },
        update: {
          name: `${teacher.firstName} ${teacher.lastName}`,
          linkedEntityId: teacher.id,
          role: 'teacher',
        },
        create: {
          email: teacher.email,
          name: `${teacher.firstName} ${teacher.lastName}`,
          password: hashedPassword,
          role: 'teacher',
          linkedEntityId: teacher.id,
          isVerified: true,
        },
      });
    } catch (e) {}

    return res.status(201).json({ success: true, data: teacher, defaultPassword: 'teacher123' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE teacher
teachersRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.update({
      where: { id },
      data: req.body,
    });
    return res.json({ success: true, data: teacher });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE teacher
teachersRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.teacher.delete({ where: { id } });
    return res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

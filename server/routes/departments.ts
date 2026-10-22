import { Router } from 'express';
import { prisma } from '../db';

export const departmentsRouter = Router();

departmentsRouter.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { students: true, teachers: true, courses: true },
        },
      },
    });
    return res.json({ success: true, data: departments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

departmentsRouter.get('/:id', async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        students: true,
        teachers: true,
        courses: true,
      },
    });
    if (!department) return res.status(404).json({ success: false, error: 'Department not found' });
    return res.json({ success: true, data: department });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

departmentsRouter.post('/', async (req, res) => {
  try {
    const data = req.body;
    const department = await prisma.department.create({ data });
    return res.status(201).json({ success: true, data: department });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

departmentsRouter.put('/:id', async (req, res) => {
  try {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json({ success: true, data: department });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

departmentsRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Department deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

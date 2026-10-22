import { Router } from 'express';
import { prisma } from '../db';

export const announcementsRouter = Router();

announcementsRouter.get('/', async (req, res) => {
  try {
    const { audience } = req.query;
    const where: any = {};
    if (audience && audience !== 'all') {
      where.OR = [{ audience: 'all' }, { audience: String(audience) }];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: announcements });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

announcementsRouter.post('/', async (req, res) => {
  try {
    const { title, message, authorId, audience = 'all', expiryDate } = req.body;
    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        authorId: authorId || 'admin',
        audience,
        expiryDate: expiryDate || null,
      },
    });
    return res.status(201).json({ success: true, data: announcement });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

announcementsRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

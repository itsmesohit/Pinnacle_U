import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { checkDatabaseConnection } from './db';
import { authRouter } from './routes/auth';
import { studentsRouter } from './routes/students';
import { teachersRouter } from './routes/teachers';
import { departmentsRouter } from './routes/departments';
import { coursesRouter } from './routes/courses';
import { enrollmentsRouter } from './routes/enrollments';
import { attendanceRouter } from './routes/attendance';
import { gradesRouter } from './routes/grades';
import { announcementsRouter } from './routes/announcements';
import { analyticsRouter } from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - handles local dev, Vercel frontends, and custom domains
const allowedOrigins = process.env.CORS_ORIGIN === '*'
  ? true
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for development
if (process.env.NODE_ENV !== 'test') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health Check for Render zero-downtime deployment
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Pinnacle University Backend API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Pinnacle University Backend API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/analytics', analyticsRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Pinnacle University API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Base API: http://localhost:${PORT}/api`);
  console.log(`======================================================\n`);

  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    console.log('✅ Connected to Supabase PostgreSQL database via Prisma');
  } else {
    console.log('💡 Note: Local API server & Resend email service are active! (PostgreSQL connects directly on Render).');
  }
});

export default app;

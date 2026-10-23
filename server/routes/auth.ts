import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { createAndSendOtp, verifyOtp } from '../services/otpService';
import { signJwtToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

// ==========================================
// 1. Send OTP for Registration
// ==========================================
authRouter.post('/register-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    try {
      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists. Please log in.' });
      }
    } catch {
      // Continue if DB check fails
    }

    const result = await createAndSendOtp(cleanEmail, 'REGISTER', name);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to send verification email. Please verify the email address.',
      });
    }

    return res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err: any) {
    console.error('Error in register-otp:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to send OTP' });
  }
});

// ==========================================
// 2. Complete Registration with OTP
// ==========================================
authRouter.post('/register', async (req, res) => {
  try {
    const { email, name, password, role = 'student', otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({ success: false, error: 'Email, password, and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const otpVerification = await verifyOtp(cleanEmail, otp, 'REGISTER');
    if (!otpVerification.valid) {
      return res.status(400).json({ success: false, error: otpVerification.error });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Prisma
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: name || cleanEmail.split('@')[0],
        password: hashedPassword,
        role,
        isVerified: true,
      },
      create: {
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        password: hashedPassword,
        role,
        isVerified: true,
      },
    });

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      linkedEntityId: user.linkedEntityId || undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered and verified!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Error in register:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to register account' });
  }
});

// ==========================================
// 3. Send OTP for Forgot Password
// ==========================================
authRouter.post('/forgot-password-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    let userName = 'Student';
    try {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        // Also check student/teacher tables
        const student = await prisma.student.findUnique({ where: { email: cleanEmail } });
        if (student) {
          userName = `${student.firstName} ${student.lastName}`;
        } else {
          const teacher = await prisma.teacher.findUnique({ where: { email: cleanEmail } });
          if (teacher) userName = `${teacher.firstName} ${teacher.lastName}`;
        }
      } else {
        userName = user.name;
      }
    } catch {
      // Continue
    }

    const result = await createAndSendOtp(cleanEmail, 'FORGOT_PASSWORD', userName);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to send password reset code.',
      });
    }

    return res.json({
      success: true,
      message: `Password reset OTP has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err: any) {
    console.error('Error in forgot-password-otp:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to send reset code' });
  }
});

// ==========================================
// 4. Verify OTP and Set New Password
// ==========================================
authRouter.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const otpVerification = await verifyOtp(cleanEmail, otp, 'FORGOT_PASSWORD');
    if (!otpVerification.valid) {
      return res.status(400).json({ success: false, error: otpVerification.error });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update or create user record
    await prisma.user.upsert({
      where: { email: cleanEmail },
      update: { password: hashedPassword },
      create: {
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        password: hashedPassword,
        role: 'student',
        isVerified: true,
      },
    });

    return res.json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('Error in verify-reset-otp:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to reset password' });
  }
});

// ==========================================
// 5. Send OTP for Login
// ==========================================
authRouter.post('/login-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user in Supabase PostgreSQL
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      // Check if student exists with this email, auto-create user account if so
      const student = await prisma.student.findUnique({ where: { email: cleanEmail } });
      if (student) {
        const hashedPassword = await bcrypt.hash('student123', 10);
        user = await prisma.user.create({
          data: {
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
            password: hashedPassword,
            role: 'student',
            linkedEntityId: student.id,
            isVerified: true,
          },
        });
      } else {
        const teacher = await prisma.teacher.findUnique({ where: { email: cleanEmail } });
        if (teacher) {
          const hashedPassword = await bcrypt.hash('teacher123', 10);
          user = await prisma.user.create({
            data: {
              email: teacher.email,
              name: `${teacher.firstName} ${teacher.lastName}`,
              password: hashedPassword,
              role: 'teacher',
              linkedEntityId: teacher.id,
              isVerified: true,
            },
          });
        } else {
          // Seamless passwordless signup: auto-provision new student account
          const rawName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
          const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          const defaultPassword = await bcrypt.hash('student123', 10);
          user = await prisma.user.create({
            data: {
              email: cleanEmail,
              name: formattedName || 'Student User',
              password: defaultPassword,
              role: 'student',
              isVerified: true,
            },
          });
        }
      }
    }

    const result = await createAndSendOtp(cleanEmail, 'LOGIN', user.name);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Failed to send OTP email via Resend' });
    }

    return res.json({
      success: true,
      message: `A 6-digit login verification code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err: any) {
    console.error('Error in login-otp:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to send login OTP' });
  }
});

// ==========================================
// 6. Verify Login OTP & Issue JWT
// ==========================================
authRouter.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Verify OTP
    const verification = await verifyOtp(cleanEmail, cleanOtp, 'LOGIN');
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error || 'Invalid or expired OTP code' });
    }

    // Fetch user from Supabase PostgreSQL
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User record not found' });
    }

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      linkedEntityId: user.linkedEntityId || undefined,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        linkedEntityId: user.linkedEntityId,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    console.error('Error in verify-login-otp:', err);
    return res.status(500).json({ success: false, error: err.message || 'OTP Login failed' });
  }
});

// ==========================================
// 7. Standard Password Login (Production)
// ==========================================
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check user in Supabase PostgreSQL
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (user) {
      let isMatch = false;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(cleanPassword, user.password);
      } else {
        isMatch = user.password === cleanPassword;
      }

      if (isMatch) {
        const token = signJwtToken({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as any,
          linkedEntityId: user.linkedEntityId || undefined,
        });

        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            linkedEntityId: user.linkedEntityId,
            avatar: user.avatar,
          },
        });
      }

      return res.status(401).json({ success: false, error: 'Invalid password. If you forgot your password, please use the OTP reset link.' });
    }

    return res.status(404).json({
      success: false,
      error: 'Account not found. Please register a new student account or verify your email.',
    });
  } catch (err: any) {
    console.error('Error in login:', err);
    return res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

// ==========================================
// 6. Get Current User (/me)
// ==========================================
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    } catch {
      // Return token user
    }

    return res.json({
      success: true,
      user: dbUser || req.user,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

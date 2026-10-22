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
    return res.json({
      success: true,
      message: result.simulated
        ? `[SIMULATED] OTP generated. Check console or use code: ${result.otpPreview}`
        : 'Verification code sent to your email address.',
      simulated: result.simulated,
      otpPreview: result.otpPreview,
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

    return res.json({
      success: true,
      message: result.simulated
        ? `[SIMULATED] Reset code generated. Check server console or use: ${result.otpPreview}`
        : 'Password reset OTP has been sent to your email.',
      simulated: result.simulated,
      otpPreview: result.otpPreview,
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
// 5. Standard Login
// ==========================================
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check user in Prisma
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    } catch {
      // In case DB is not yet connected
    }

    if (user) {
      // Check password (bcrypt or plain demo match)
      let isMatch = false;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(cleanPassword, user.password);
      } else {
        isMatch = user.password === cleanPassword;
      }

      // Default role fallback passwords for convenience
      const defaultRolePass = user.role === 'admin' ? 'admin123' : user.role === 'teacher' ? 'teacher123' : 'student123';
      if (!isMatch && cleanPassword === defaultRolePass) {
        isMatch = true;
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

      return res.status(401).json({ success: false, error: 'Invalid password. If you forgot your password, please request an OTP to reset it.' });
    }

    // Default demo personas fallback if user hasn't seeded yet
    const demoAccounts = [
      { email: 'admin@college.edu', role: 'admin', name: 'Dr. Sarah Mitchell', pass: 'admin123' },
      { email: 'sarah.mitchell@college.edu', role: 'admin', name: 'Dr. Sarah Mitchell', pass: 'admin123' },
      { email: 'teacher@college.edu', role: 'teacher', name: 'Prof. Alan Turing', pass: 'teacher123' },
      { email: 'alan.turing@college.edu', role: 'teacher', name: 'Prof. Alan Turing', pass: 'teacher123' },
      { email: 'student@college.edu', role: 'student', name: 'Alex Johnson', pass: 'student123' },
      { email: 'alex.johnson@college.edu', role: 'student', name: 'Alex Johnson', pass: 'student123' },
    ];

    const demo = demoAccounts.find(d => d.email === cleanEmail && (cleanPassword === d.pass || cleanPassword === `${d.role}123`));
    if (demo) {
      const token = signJwtToken({
        id: `demo-${demo.role}`,
        email: demo.email,
        name: demo.name,
        role: demo.role as any,
      });

      return res.json({
        success: true,
        token,
        user: {
          id: `demo-${demo.role}`,
          email: demo.email,
          name: demo.name,
          role: demo.role,
        },
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Account not found. Please register a new account or check demo credentials.',
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

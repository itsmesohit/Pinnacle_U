import { prisma } from '../db';
import { sendOtpEmail } from './emailService';

// In-memory fallback cache for OTPs in case DB is being provisioned
interface CachedOtp {
  email: string;
  otp: string;
  type: 'REGISTER' | 'FORGOT_PASSWORD' | 'LOGIN';
  expiresAt: Date;
}

const inMemoryOtpStore = new Map<string, CachedOtp>();

export function generateNumericOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(
  email: string,
  purpose: 'REGISTER' | 'FORGOT_PASSWORD' | 'LOGIN',
  name?: string
): Promise<{ success: boolean; simulated?: boolean; error?: string; otpPreview?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const otp = generateNumericOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save to in-memory cache
  const cacheKey = `${cleanEmail}:${purpose}`;
  inMemoryOtpStore.set(cacheKey, {
    email: cleanEmail,
    otp,
    type: purpose,
    expiresAt,
  });

  // Also persist to PostgreSQL if DB is available
  try {
    // Invalidate previous OTPs for this email and type
    await prisma.otpToken.updateMany({
      where: { email: cleanEmail, type: purpose, used: false },
      data: { used: true },
    });

    await prisma.otpToken.create({
      data: {
        email: cleanEmail,
        otp,
        type: purpose,
        expiresAt,
        used: false,
      },
    });
  } catch (err) {
    // Non-fatal if DB not yet connected; memory cache will verify
    console.warn('⚠️ Could not write OTP to PostgreSQL, using memory store:', (err as any)?.message);
  }

  // Send email via Resend
  const emailResult = await sendOtpEmail({
    toEmail: cleanEmail,
    name,
    otp,
    purpose,
  });

  return {
    success: emailResult.success,
    simulated: emailResult.simulated,
    error: emailResult.error,
    // Provide OTP in dev response if simulated so user can test without terminal
    otpPreview: emailResult.simulated ? otp : undefined,
  };
}

export async function verifyOtp(
  email: string,
  otp: string,
  purpose: 'REGISTER' | 'FORGOT_PASSWORD' | 'LOGIN'
): Promise<{ valid: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();
  const cacheKey = `${cleanEmail}:${purpose}`;

  // 1. Check in-memory store first
  const memoryRecord = inMemoryOtpStore.get(cacheKey);
  if (memoryRecord) {
    if (new Date() > memoryRecord.expiresAt) {
      inMemoryOtpStore.delete(cacheKey);
      return { valid: false, error: 'OTP has expired. Please request a new code.' };
    }
    if (memoryRecord.otp === cleanOtp) {
      inMemoryOtpStore.delete(cacheKey);
      return { valid: true };
    }
  }

  // 2. Check Database record
  try {
    const dbRecord = await prisma.otpToken.findFirst({
      where: {
        email: cleanEmail,
        type: purpose,
        otp: cleanOtp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbRecord) {
      // Mark as used
      await prisma.otpToken.update({
        where: { id: dbRecord.id },
        data: { used: true },
      });
      return { valid: true };
    }
  } catch (err) {
    console.warn('⚠️ Error checking OTP in PostgreSQL:', (err as any)?.message);
  }

  return { valid: false, error: 'Invalid or expired OTP code. Please double-check and try again.' };
}

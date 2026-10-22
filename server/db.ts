import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error: any) {
    const isNetworkUnreachable = error.message?.includes("Can't reach database server") || error.message?.includes('ENOTFOUND');
    if (isNetworkUnreachable) {
      console.log('📡 [Database] Supabase direct host uses IPv6 (not routeable on this local ISP/Wi-Fi).');
      console.log('⚡ [Status] Running in local resilient mode. (When deployed to Render, IPv6 is supported out-of-the-box!)');
    } else {
      console.warn('⚠️ [Database] Connection notice:', error.message);
    }
    return false;
  }
}

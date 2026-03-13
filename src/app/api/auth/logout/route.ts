import { NextResponse } from 'next/server';
import { clearCookieHeader, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const user = getCurrentUser();
  if (user) {
    await prisma.user.update({
      where: { id: user.userId },
      data: { isOnline: false, lastSeen: new Date() },
    }).catch(() => {});
  }

  return NextResponse.json(
    { message: '로그아웃 되었습니다.' },
    { headers: { 'Set-Cookie': clearCookieHeader() } }
  );
}

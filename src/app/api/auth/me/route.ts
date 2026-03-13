import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true, email: true, nickname: true, gender: true,
      birthYear: true, region: true, bio: true, avatar: true,
      interests: true, coins: true, isPremium: true,
      isOnline: true, lastSeen: true, createdAt: true,
      _count: { select: { likesReceived: true, sentMessages: true } },
    },
  });

  if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

  return NextResponse.json({
    ...user,
    interests: JSON.parse(user.interests || '[]'),
  });
}

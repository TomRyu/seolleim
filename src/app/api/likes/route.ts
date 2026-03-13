import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { toUserId } = await req.json();
  if (!toUserId) return NextResponse.json({ error: '대상이 필요합니다.' }, { status: 400 });

  const existing = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: auth.userId, toUserId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.like.create({ data: { fromUserId: auth.userId, toUserId } });
  return NextResponse.json({ liked: true });
}

export async function GET(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'received'; // received | given

  const likes = await prisma.like.findMany({
    where: type === 'received' ? { toUserId: auth.userId } : { fromUserId: auth.userId },
    include: {
      fromUser: {
        select: { id: true, nickname: true, avatar: true, gender: true, birthYear: true, region: true, isOnline: true },
      },
      toUser: {
        select: { id: true, nickname: true, avatar: true, gender: true, birthYear: true, region: true, isOnline: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(likes);
}

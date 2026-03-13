import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, nickname: true, gender: true, birthYear: true,
      region: true, bio: true, avatar: true, interests: true,
      isPremium: true, isOnline: true, lastSeen: true, createdAt: true,
      _count: { select: { likesReceived: true } },
    },
  });

  if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

  // 내가 좋아요 했는지 확인
  const liked = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: auth.userId, toUserId: params.id } },
  });

  return NextResponse.json({
    ...user,
    interests: JSON.parse(user.interests || '[]'),
    isLiked: !!liked,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getCurrentUser();
  if (!auth || auth.userId !== params.id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const body = await req.json();
  const { nickname, region, bio, interests } = body;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(nickname && { nickname }),
      ...(region && { region }),
      ...(bio !== undefined && { bio }),
      ...(interests && { interests: JSON.stringify(interests) }),
    },
    select: {
      id: true, nickname: true, gender: true, birthYear: true,
      region: true, bio: true, avatar: true, interests: true,
      coins: true, isPremium: true,
    },
  });

  return NextResponse.json({ ...updated, interests: JSON.parse(updated.interests || '[]') });
}

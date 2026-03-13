import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const gender = searchParams.get('gender') || 'all';
  const region = searchParams.get('region') || '전체';
  const ageMin = Number(searchParams.get('ageMin') || 40);
  const ageMax = Number(searchParams.get('ageMax') || 70);
  const page = Number(searchParams.get('page') || 1);
  const limit = 20;

  const currentYear = new Date().getFullYear();
  const birthYearMin = currentYear - ageMax;
  const birthYearMax = currentYear - ageMin + 1;

  // 차단한/차단당한 회원 ID 수집
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: auth.userId }, { blockedId: auth.userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const blockedIds = blocks.map((b) => b.blockerId === auth.userId ? b.blockedId : b.blockerId);

  const where: any = {
    id: { not: auth.userId, notIn: blockedIds },
    isBanned: false,
    birthYear: { gte: birthYearMin, lte: birthYearMax },
  };

  if (gender !== 'all') where.gender = gender;
  if (region !== '전체') where.region = region;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, nickname: true, gender: true, birthYear: true,
        region: true, bio: true, avatar: true, interests: true,
        isPremium: true, isOnline: true, lastSeen: true,
        _count: { select: { likesReceived: true } },
      },
      orderBy: [{ isOnline: 'desc' }, { lastSeen: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const formatted = users.map((u) => ({
    ...u,
    interests: JSON.parse(u.interests || '[]'),
  }));

  return NextResponse.json({
    users: formatted,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  });
}

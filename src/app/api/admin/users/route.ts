import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

async function checkAdmin() {
  const auth = getCurrentUser();
  if (!auth) return null;
  const me = await prisma.user.findUnique({ where: { id: auth.userId }, select: { isAdmin: true } });
  return me?.isAdmin ? auth : null;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const limit = 20;

  const where: any = {};
  if (search) where.OR = [
    { nickname: { contains: search } },
    { email: { contains: search } },
  ];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, nickname: true, gender: true, birthYear: true,
        region: true, isPremium: true, isBanned: true, isAdmin: true,
        isOnline: true, coins: true, createdAt: true,
        _count: { select: { sentMessages: true, likesReceived: true, reportsReceived: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  const { userId, action } = await req.json();

  switch (action) {
    case 'ban':
      await prisma.user.update({ where: { id: userId }, data: { isBanned: true, isOnline: false } });
      break;
    case 'unban':
      await prisma.user.update({ where: { id: userId }, data: { isBanned: false } });
      break;
    case 'grant-premium':
      await prisma.user.update({ where: { id: userId }, data: { isPremium: true } });
      break;
    case 'revoke-premium':
      await prisma.user.update({ where: { id: userId }, data: { isPremium: false } });
      break;
    default:
      return NextResponse.json({ error: '알 수 없는 액션' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

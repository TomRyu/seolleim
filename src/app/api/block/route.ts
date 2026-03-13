import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 차단 토글
export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { blockedId } = await req.json();
  if (!blockedId || blockedId === auth.userId) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: auth.userId, blockedId } },
  });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return NextResponse.json({ blocked: false });
  }

  await prisma.block.create({ data: { blockerId: auth.userId, blockedId } });
  return NextResponse.json({ blocked: true });
}

// 차단 목록 조회
export async function GET() {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const blocks = await prisma.block.findMany({
    where: { blockerId: auth.userId },
    include: {
      blocked: {
        select: { id: true, nickname: true, avatar: true, region: true, birthYear: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(blocks);
}

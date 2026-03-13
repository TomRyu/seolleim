import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

async function checkAdmin() {
  const auth = getCurrentUser();
  if (!auth) return null;
  const me = await prisma.user.findUnique({ where: { id: auth.userId }, select: { isAdmin: true } });
  return me?.isAdmin ? auth : null;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  const reports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    include: {
      fromUser: { select: { id: true, nickname: true, avatar: true } },
      toUser: { select: { id: true, nickname: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(reports);
}

export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  const { reportId, action } = await req.json();

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return NextResponse.json({ error: '신고를 찾을 수 없습니다.' }, { status: 404 });

  if (action === 'ban') {
    await prisma.$transaction([
      prisma.report.update({ where: { id: reportId }, data: { status: 'REVIEWED' } }),
      prisma.user.update({ where: { id: report.toUserId }, data: { isBanned: true } }),
    ]);
  } else {
    await prisma.report.update({ where: { id: reportId }, data: { status: action === 'dismiss' ? 'DISMISSED' : 'REVIEWED' } });
  }

  return NextResponse.json({ success: true });
}

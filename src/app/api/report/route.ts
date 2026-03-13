import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { toUserId, reason, detail } = await req.json();
  if (!toUserId || !reason) return NextResponse.json({ error: '신고 사유가 필요합니다.' }, { status: 400 });
  if (toUserId === auth.userId) return NextResponse.json({ error: '자신을 신고할 수 없습니다.' }, { status: 400 });

  await prisma.report.create({
    data: { fromUserId: auth.userId, toUserId, reason, detail: detail || '' },
  });

  return NextResponse.json({ success: true });
}

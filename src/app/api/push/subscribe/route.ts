import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: '잘못된 구독 정보입니다.' }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: auth.userId },
    create: { userId: auth.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { endpoint } = await req.json();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: auth.userId } });
  return NextResponse.json({ success: true });
}

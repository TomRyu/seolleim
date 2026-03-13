import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { userId: auth.userId, status: 'DONE' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json(payments);
}

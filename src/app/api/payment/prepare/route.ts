import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { COIN_PACKAGES, PREMIUM_PLANS } from '@/lib/coins';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { packageId, type } = await req.json(); // type: 'coin' | 'premium'

  let amount = 0;
  let orderName = '';
  let coins = 0;

  if (type === 'coin') {
    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: '잘못된 패키지입니다.' }, { status: 400 });
    amount = pkg.price;
    orderName = `${pkg.coins + pkg.bonus} 코인`;
    coins = pkg.coins + pkg.bonus;
  } else if (type === 'premium') {
    const plan = PREMIUM_PLANS.find((p) => p.id === packageId);
    if (!plan) return NextResponse.json({ error: '잘못된 플랜입니다.' }, { status: 400 });
    amount = plan.price;
    orderName = plan.id;
    coins = 0;
  }

  const orderId = `mal_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  await prisma.payment.create({
    data: { userId: auth.userId, orderId, orderName, amount, coins, status: 'PENDING' },
  });

  return NextResponse.json({ orderId, amount, orderName });
}

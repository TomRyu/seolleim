import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { COIN_PACKAGES, PREMIUM_PLANS } from '@/lib/coins';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R'; // 테스트 키

export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { paymentKey, orderId, amount, type } = await req.json();

  // 1. DB에서 주문 검증
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  if (payment.userId !== auth.userId) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  if (payment.amount !== amount) return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });

  // 2. 토스페이먼츠 결제 승인 API 호출
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const tossData = await tossRes.json();

  if (!tossRes.ok) {
    await prisma.payment.update({ where: { orderId }, data: { status: 'FAILED' } });
    return NextResponse.json({ error: tossData.message || '결제 승인 실패' }, { status: 400 });
  }

  // 3. 결제 성공 처리
  if (type === 'coin') {
    // 코인 지급
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId },
        data: { status: 'DONE', paymentKey, method: tossData.method, approvedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: auth.userId },
        data: { coins: { increment: payment.coins } },
      }),
    ]);
    return NextResponse.json({ success: true, coins: payment.coins });

  } else if (type === 'premium') {
    const plan = PREMIUM_PLANS.find((p) => p.id === payment.orderName);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (plan?.period || 30));

    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId },
        data: { status: 'DONE', paymentKey, method: tossData.method, approvedAt: new Date() },
      }),
      prisma.user.update({ where: { id: auth.userId }, data: { isPremium: true } }),
      prisma.subscription.upsert({
        where: { userId: auth.userId },
        update: { plan: payment.orderName, orderId, paymentKey, amount, status: 'ACTIVE', startedAt: new Date(), expiresAt },
        create: { userId: auth.userId, plan: payment.orderName, orderId, paymentKey, amount, expiresAt },
      }),
    ]);
    return NextResponse.json({ success: true, plan: payment.orderName });
  }

  return NextResponse.json({ error: '알 수 없는 결제 유형' }, { status: 400 });
}

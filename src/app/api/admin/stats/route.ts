import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: auth.userId }, select: { isAdmin: true } });
  if (!me?.isAdmin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers, newUsersToday, onlineUsers,
    totalMessages, messagesToday,
    totalPayments, revenueTotal,
    pendingReports, premiumUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { isBanned: false } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: today } } }),
    prisma.payment.count({ where: { status: 'DONE' } }),
    prisma.payment.aggregate({ where: { status: 'DONE' }, _sum: { amount: true } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { isPremium: true } }),
  ]);

  return NextResponse.json({
    totalUsers, newUsersToday, onlineUsers,
    totalMessages, messagesToday,
    totalPayments, revenueTotal: revenueTotal._sum.amount || 0,
    pendingReports, premiumUsers,
  });
}

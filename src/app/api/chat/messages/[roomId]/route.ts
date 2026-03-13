import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  // 접근 권한 확인
  const member = await prisma.chatRoomMember.findUnique({
    where: { userId_chatRoomId: { userId: auth.userId, chatRoomId: params.roomId } },
  });
  if (!member) return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = 30;

  const messages = await prisma.message.findMany({
    where: { chatRoomId: params.roomId },
    include: { sender: { select: { id: true, nickname: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });

  // 읽음 처리
  await prisma.message.updateMany({
    where: { chatRoomId: params.roomId, senderId: { not: auth.userId }, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({
    messages: messages.reverse(),
    hasMore: messages.length === limit,
    nextCursor: messages.length === limit ? messages[0]?.id : null,
  });
}

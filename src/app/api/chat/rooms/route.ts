import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 채팅방 목록 조회
export async function GET() {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const rooms = await prisma.chatRoom.findMany({
    where: { members: { some: { userId: auth.userId } } },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, nickname: true, avatar: true, isOnline: true, lastSeen: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { id: true, nickname: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // 읽지 않은 메시지 수 계산
  const roomsWithUnread = await Promise.all(
    rooms.map(async (room) => {
      const member = room.members.find((m) => m.userId === auth.userId);
      const unreadCount = await prisma.message.count({
        where: {
          chatRoomId: room.id,
          senderId: { not: auth.userId },
          isRead: false,
        },
      });
      const otherMember = room.members.find((m) => m.userId !== auth.userId);
      return { ...room, unreadCount, otherUser: otherMember?.user, lastMessage: room.messages[0] };
    })
  );

  return NextResponse.json(roomsWithUnread);
}

// 채팅방 생성 또는 기존 채팅방 반환
export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: '대상이 필요합니다.' }, { status: 400 });

  // 기존 1:1 채팅방 찾기
  const existing = await prisma.chatRoom.findFirst({
    where: {
      AND: [
        { members: { some: { userId: auth.userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, nickname: true, avatar: true, isOnline: true } } } },
    },
  });

  if (existing) return NextResponse.json(existing);

  // 새 채팅방 생성
  const room = await prisma.chatRoom.create({
    data: {
      members: {
        create: [{ userId: auth.userId }, { userId: targetUserId }],
      },
    },
    include: {
      members: { include: { user: { select: { id: true, nickname: true, avatar: true, isOnline: true } } } },
    },
  });

  return NextResponse.json(room, { status: 201 });
}

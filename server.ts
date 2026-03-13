const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketServer } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');

// VAPID 설정 (환경변수 로드 후)
require('dotenv').config();
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@middle-age-land.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Track online users: userId -> socketId
  const onlineUsers = new Map<string, string>();

  io.on('connection', (socket: any) => {
    console.log('Client connected:', socket.id);

    // User comes online
    socket.on('user-online', async (userId: string) => {
      onlineUsers.set(userId, socket.id);
      (socket as any).userId = userId;
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      }).catch(() => {});
      io.emit('user-status', { userId, isOnline: true });
    });

    // Join chat room
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
    });

    // Leave chat room
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
    });

    // Send message
    socket.on('send-message', async (data: { roomId: string; content: string; senderId: string }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            senderId: data.senderId,
            chatRoomId: data.roomId,
          },
          include: {
            sender: {
              select: { id: true, nickname: true, avatar: true },
            },
          },
        });

        // Update chat room updatedAt
        await prisma.chatRoom.update({
          where: { id: data.roomId },
          data: { updatedAt: new Date() },
        });

        io.to(data.roomId).emit('new-message', message);

        // 오프라인 수신자에게 푸시 알림
        const members = await prisma.chatRoomMember.findMany({
          where: { chatRoomId: data.roomId, userId: { not: data.senderId } },
          select: { userId: true },
        });
        for (const m of members) {
          const isOnline = onlineUsers.has(m.userId);
          if (!isOnline) {
            const subs = await prisma.pushSubscription.findMany({ where: { userId: m.userId } });
            const sender = await prisma.user.findUnique({ where: { id: data.senderId }, select: { nickname: true } });
            for (const sub of subs) {
              webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify({ title: `💬 ${sender?.nickname}`, body: data.content.slice(0, 80), url: `/chat?roomId=${data.roomId}` })
              ).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error('Message save error:', err);
      }
    });

    // Typing indicator
    socket.on('typing', (data: { roomId: string; userId: string; nickname: string }) => {
      socket.to(data.roomId).emit('user-typing', data);
    });

    socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('user-stop-typing', data);
    });

    // Mark messages as read
    socket.on('mark-read', async (data: { roomId: string; userId: string }) => {
      await prisma.message.updateMany({
        where: { chatRoomId: data.roomId, senderId: { not: data.userId }, isRead: false },
        data: { isRead: true },
      }).catch(() => {});
      socket.to(data.roomId).emit('messages-read', { roomId: data.roomId, userId: data.userId });
    });

    // ─── WebRTC 영상통화 시그널링 ───────────────────────────

    // 통화 요청
    socket.on('call-request', (data: { toUserId: string; fromUserId: string; fromNickname: string; roomId: string }) => {
      const toSocketId = onlineUsers.get(data.toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit('incoming-call', data);
      } else {
        socket.emit('call-unavailable', { reason: '상대방이 오프라인입니다.' });
      }
    });

    // 통화 수락
    socket.on('call-accept', (data: { toUserId: string; roomId: string }) => {
      const toSocketId = onlineUsers.get(data.toUserId);
      if (toSocketId) io.to(toSocketId).emit('call-accepted', { roomId: data.roomId });
    });

    // 통화 거절
    socket.on('call-reject', (data: { toUserId: string; reason?: string }) => {
      const toSocketId = onlineUsers.get(data.toUserId);
      if (toSocketId) io.to(toSocketId).emit('call-rejected', { reason: data.reason || '상대방이 거절했습니다.' });
    });

    // 통화 종료
    socket.on('call-end', (data: { toUserId: string }) => {
      const toSocketId = onlineUsers.get(data.toUserId);
      if (toSocketId) io.to(toSocketId).emit('call-ended');
    });

    // WebRTC Offer
    socket.on('webrtc-offer', (data: { toUserId: string; offer: any }) => {
      const toSocketId = onlineUsers.get(data.toUserId);
      if (toSocketId) io.to(toSocketId).emit('webrtc-offer', { offer: data.offer, fromSocketId: socket.id });
    });

    // WebRTC Answer
    socket.on('webrtc-answer', (data: { toUserId: string; answer: any }) => {
      const toSocketId = onlineUsers.get(data.toUserId);
      if (toSocketId) io.to(toSocketId).emit('webrtc-answer', { answer: data.answer });
    });

    // ICE Candidate
    socket.on('ice-candidate', (data: { toUserId: string; candidate: any }) => {
      const toSocketId = onlineUsers.get(data.toUserId);
      if (toSocketId) io.to(toSocketId).emit('ice-candidate', { candidate: data.candidate });
    });

    // ────────────────────────────────────────────────────────

    // Disconnect
    socket.on('disconnect', async () => {
      const userId = (socket as any).userId;
      if (userId) {
        onlineUsers.delete(userId);
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() },
        }).catch(() => {});
        io.emit('user-status', { userId, isOnline: false });
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`\n🌸 중년나라 서버 실행 중: http://localhost:${PORT}\n`);
  });
});

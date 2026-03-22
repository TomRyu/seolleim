'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getSocket, connectSocket } from '@/lib/socket-client';
import { Message, ChatRoom, User } from '@/types';
import { formatTime, formatChatTime, cn } from '@/lib/utils';
import { ArrowLeft, Send, Loader2, MessageCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import VideoCall from '@/components/VideoCall';
import IncomingCallModal from '@/components/IncomingCallModal';

function ChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRoomId = searchParams.get('roomId');

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ fromUserId: string; fromNickname: string; fromAvatar?: string; roomId: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout>();

  // 채팅방 목록 로드
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    const res = await fetch('/api/chat/rooms');
    const data = await res.json();
    setRooms(data);
    setLoadingRooms(false);
    return data;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchRooms().then((data) => {
      if (initialRoomId && data) {
        const room = data.find((r: ChatRoom) => r.id === initialRoomId);
        if (room) setActiveRoom(room);
      }
    });

    // 소켓 연결
    const socket = connectSocket(user.id);

    socket.on('new-message', (message: Message) => {
      if (message.chatRoomId === activeRoom?.id) {
        setMessages((prev) => [...prev, message]);
        socket.emit('mark-read', { roomId: message.chatRoomId, userId: user.id });
      }
      fetchRooms();
    });

    socket.on('user-typing', (data: { userId: string; nickname: string }) => {
      setTypingUsers((prev) => prev.includes(data.nickname) ? prev : [...prev, data.nickname]);
    });

    socket.on('user-stop-typing', () => setTypingUsers([]));

    // 영상통화 수신
    socket.on('incoming-call', (data: { fromUserId: string; fromNickname: string; fromAvatar?: string; roomId: string }) => {
      setIncomingCall(data);
    });
    socket.on('call-rejected', ({ reason }: { reason: string }) => {
      toast.error(reason);
      setInCall(false);
    });
    socket.on('call-unavailable', ({ reason }: { reason: string }) => {
      toast.error(reason);
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('incoming-call');
      socket.off('call-rejected');
      socket.off('call-unavailable');
    };
  }, [user, fetchRooms]);

  // 메시지 로드
  useEffect(() => {
    if (!activeRoom) return;
    setLoadingMessages(true);
    const socket = getSocket();
    socket.emit('join-room', activeRoom.id);

    fetch(`/api/chat/messages/${activeRoom.id}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages || []);
        socket.emit('mark-read', { roomId: activeRoom.id, userId: user?.id });
        fetchRooms();
      })
      .finally(() => setLoadingMessages(false));

    return () => { socket.emit('leave-room', activeRoom.id); };
  }, [activeRoom?.id]);

  // 스크롤 하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !activeRoom || !user) return;
    const socket = getSocket();
    socket.emit('send-message', { roomId: activeRoom.id, content: input.trim(), senderId: user.id });
    socket.emit('stop-typing', { roomId: activeRoom.id, userId: user.id });
    setInput('');
  };

  const handleTyping = (value: string) => {
    setInput(value);
    if (!activeRoom || !user) return;
    const socket = getSocket();
    socket.emit('typing', { roomId: activeRoom.id, userId: user.id, nickname: user.nickname });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stop-typing', { roomId: activeRoom.id, userId: user.id });
    }, 1500);
  };

  const handleVideoCall = () => {
    if (!user || !otherUser || !activeRoom) return;
    const socket = getSocket();
    socket.emit('call-request', {
      toUserId: otherUser.id,
      fromUserId: user.id,
      fromNickname: user.nickname,
      roomId: activeRoom.id,
    });
    setInCall(true);
  };

  if (!user) return null;

  const otherUser = activeRoom?.members?.find((m) => m.user.id !== user.id)?.user;

  return (
    <div className="flex h-screen bg-bg-base">
      {/* 영상통화 화면 */}
      {inCall && activeRoom && otherUser && (
        <VideoCall
          roomId={activeRoom.id}
          targetUserId={otherUser.id}
          targetNickname={otherUser.nickname}
          myUserId={user.id}
          isInitiator={true}
          onEnd={() => setInCall(false)}
        />
      )}

      {/* 수신 중인 통화 모달 */}
      {incomingCall && (
        <IncomingCallModal
          fromNickname={incomingCall.fromNickname}
          fromAvatar={incomingCall.fromAvatar}
          onAccept={() => {
            const socket = getSocket();
            socket.emit('call-accept', { toUserId: incomingCall.fromUserId, roomId: incomingCall.roomId });
            setIncomingCall(null);
            setInCall(true);
          }}
          onReject={() => {
            const socket = getSocket();
            socket.emit('call-reject', { toUserId: incomingCall.fromUserId });
            setIncomingCall(null);
          }}
        />
      )}
      {/* 채팅방 목록 */}
      <div className={cn(
        'flex flex-col border-r border-border bg-bg-surface',
        activeRoom ? 'hidden md:flex w-80 shrink-0' : 'flex flex-1 md:w-80 md:flex-none'
      )}>
        <div className="px-4 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">채팅</h2>
          <p className="text-text-muted text-xs mt-0.5">{rooms.length}개의 대화</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <MessageCircle size={40} className="text-text-muted mb-3" />
              <p className="text-text-secondary font-medium">아직 대화가 없습니다</p>
              <p className="text-text-muted text-sm mt-1">회원을 찾아 채팅을 시작해보세요</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-all"
              >
                회원 찾기
              </button>
            </div>
          ) : (
            rooms.map((room) => {
              const other = room.members?.find((m) => m.user.id !== user.id)?.user;
              const lastMsg = room.lastMessage;
              const isActive = activeRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-4 hover:bg-bg-hover transition-colors text-left',
                    isActive && 'bg-primary/5 border-l-2 border-primary'
                  )}
                >
                  <div className="relative shrink-0">
                    <img
                      src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.nickname}`}
                      alt={other?.nickname}
                      className="w-12 h-12 rounded-full bg-bg-card"
                    />
                    {other?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-bg-surface" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary text-sm">{other?.nickname}</span>
                      <span className="text-text-muted text-xs">{lastMsg ? formatTime(lastMsg.createdAt) : ''}</span>
                    </div>
                    <p className="text-text-muted text-xs truncate mt-0.5">
                      {lastMsg ? lastMsg.content : '대화를 시작해보세요'}
                    </p>
                  </div>
                  {room.unreadCount && room.unreadCount > 0 ? (
                    <span className="shrink-0 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {room.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 채팅 창 */}
      {activeRoom ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* 채팅 헤더 */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-bg-surface/80 backdrop-blur-xl">
            <button
              onClick={() => setActiveRoom(null)}
              className="md:hidden p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="relative">
              <img
                src={otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.nickname}`}
                alt={otherUser?.nickname}
                className="w-10 h-10 rounded-full bg-bg-card"
              />
              {otherUser?.isOnline && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-bg-surface" />
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">{otherUser?.nickname}</p>
              <p className="text-xs text-text-muted">{otherUser?.isOnline ? '온라인' : '오프라인'}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={handleVideoCall}
                disabled={!otherUser?.isOnline}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Video size={16} />
                영상통화
              </button>
            </div>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loadingMessages ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={cn('flex gap-2 message-bubble', isMine && 'flex-row-reverse')}>
                      {!isMine && (
                        <img
                          src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.nickname}`}
                          alt={msg.sender?.nickname}
                          className="w-8 h-8 rounded-full bg-bg-card shrink-0 self-end"
                        />
                      )}
                      <div className={cn('max-w-[70%] flex flex-col gap-1', isMine && 'items-end')}>
                        <div className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isMine
                            ? 'bg-gradient-primary text-white rounded-br-sm'
                            : 'bg-bg-card text-text-primary border border-border rounded-bl-sm'
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-text-muted px-1">
                          {formatChatTime(msg.createdAt)}
                          {isMine && msg.isRead && <span className="ml-1 text-primary">✓</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 타이핑 인디케이터 */}
                {typingUsers.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1 bg-bg-card border border-border rounded-2xl px-4 py-3">
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-text-muted">입력 중...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 입력창 */}
          <div className="px-4 py-3 border-t border-border bg-bg-surface/80 backdrop-blur-xl">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-bg-card border border-border rounded-2xl px-4 py-3 text-text-primary placeholder-text-muted outline-none focus:border-primary/50 text-sm transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-11 h-11 rounded-2xl bg-gradient-primary text-white flex items-center justify-center shadow-primary hover:opacity-90 transition-all disabled:opacity-40 shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-text-secondary font-medium">대화를 선택하세요</p>
            <p className="text-text-muted text-sm mt-1">왼쪽에서 채팅방을 선택해주세요</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
      <ChatContent />
    </Suspense>
  );
}

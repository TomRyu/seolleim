'use client';

import Link from 'next/link';
import { useAuth } from './providers/AuthProvider';
import { MessageCircle, LogOut, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket-client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    // 읽지 않은 메시지 수 가져오기
    fetch('/api/chat/rooms')
      .then((r) => r.json())
      .then((rooms) => {
        const total = rooms.reduce((acc: number, r: any) => acc + (r.unreadCount || 0), 0);
        setUnreadCount(total);
      })
      .catch(() => {});

    const socket = getSocket();
    socket.on('new-message', () => setUnreadCount((n) => n + 1));
    socket.on('messages-read', () => {
      fetch('/api/chat/rooms')
        .then((r) => r.json())
        .then((rooms) => {
          const total = rooms.reduce((acc: number, r: any) => acc + (r.unreadCount || 0), 0);
          setUnreadCount(total);
        })
        .catch(() => {});
    });

    return () => {
      socket.off('new-message');
      socket.off('messages-read');
    };
  }, [user]);

  if (!user) return null;

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 bg-bg-surface/80 backdrop-blur-xl border-b border-border items-center px-6">
      <Link href="/" className="flex items-center gap-2 mr-8">
        <span className="text-2xl">🌸</span>
        <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
          설레임
        </span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* 코인 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-muted border border-gold/20">
          <span className="text-gold text-sm">🪙</span>
          <span className="text-gold text-sm font-semibold">{user.coins}</span>
        </div>

        {/* AI 매칭 */}
        <Link href="/matching" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all">
          <Sparkles size={15} />
          AI 매칭
        </Link>

        {/* 코인 상점 */}
        <Link href="/shop" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-bg-hover border border-border text-text-secondary text-sm hover:border-gold/30 hover:text-gold transition-all">
          🪙 충전
        </Link>

        {/* 채팅 */}
        <Link href="/chat" className="relative p-2.5 rounded-full hover:bg-bg-hover transition-colors">
          <MessageCircle size={20} className="text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* 마이페이지 */}
        <Link href="/mypage" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-bg-hover transition-colors">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`}
            alt={user.nickname}
            className="w-7 h-7 rounded-full object-cover bg-bg-card"
          />
          <span className="text-sm text-text-primary font-medium">{user.nickname}</span>
        </Link>

        {/* 로그아웃 */}
        <button
          onClick={logout}
          className="p-2.5 rounded-full hover:bg-bg-hover transition-colors text-text-muted hover:text-text-secondary"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

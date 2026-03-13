'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Heart, User, Sparkles } from 'lucide-react';
import { useAuth } from './providers/AuthProvider';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket-client';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/chat/rooms')
      .then((r) => r.json())
      .then((rooms) => {
        const total = rooms.reduce((acc: number, r: any) => acc + (r.unreadCount || 0), 0);
        setUnreadCount(total);
      })
      .catch(() => {});

    const socket = getSocket();
    socket.on('new-message', () => setUnreadCount((n) => n + 1));
    return () => { socket.off('new-message'); };
  }, [user]);

  if (!user) return null;

  const tabs = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/matching', icon: Sparkles, label: 'AI매칭' },
    { href: '/chat', icon: MessageCircle, label: '채팅', badge: unreadCount },
    { href: '/likes', icon: Heart, label: '좋아요' },
    { href: '/mypage', icon: User, label: '내정보' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-bg-surface/95 backdrop-blur-xl border-t border-border flex">
      {tabs.map(({ href, icon: Icon, label, badge }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              active ? 'text-primary' : 'text-text-muted'
            )}
          >
            <div className="relative">
              <Icon size={22} />
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

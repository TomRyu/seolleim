'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, MessageCircle } from 'lucide-react';
import { User } from '@/types';
import { getAge, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Props {
  user: User;
  currentUserId: string;
  initialLiked?: boolean;
}

export default function MemberCard({ user, currentUserId, initialLiked = false }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState((user as any)._count?.likesReceived || 0);
  const [liking, setLiking] = useState(false);
  const router = useRouter();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: user.id }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount((n: number) => data.liked ? n + 1 : n - 1);
      toast(data.liked ? `💕 ${user.nickname}님에게 좋아요!` : '좋아요를 취소했습니다.', {
        style: { background: '#1C1C3A', color: '#F0F0FF', border: '1px solid rgba(255,255,255,0.08)' },
      });
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setLiking(false);
    }
  };

  const handleChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      const room = await res.json();
      router.push(`/chat?roomId=${room.id}`);
    } catch {
      toast.error('채팅방을 열 수 없습니다.');
    }
  };

  const age = getAge(user.birthYear);
  const avatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.nickname)}`;

  return (
    <Link href={`/profile/${user.id}`}>
      <div className="group relative bg-bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card hover:-translate-y-1 cursor-pointer">
        {/* 프로필 이미지 영역 */}
        <div className="relative h-48 bg-gradient-to-br from-bg-hover to-bg-surface flex items-center justify-center overflow-hidden">
          <img
            src={avatar}
            alt={user.nickname}
            className="w-32 h-32 rounded-full object-cover border-2 border-border group-hover:scale-105 transition-transform duration-300"
          />

          {/* 온라인 상태 */}
          <div className={cn(
            'absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            user.isOnline
              ? 'bg-online/20 text-online border border-online/30'
              : 'bg-bg-hover text-text-muted border border-border'
          )}>
            <div className={cn('w-1.5 h-1.5 rounded-full', user.isOnline ? 'bg-online animate-pulse' : 'bg-text-muted')} />
            {user.isOnline ? '온라인' : '오프라인'}
          </div>

          {/* 프리미엄 뱃지 */}
          {user.isPremium && (
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-gold/20 border border-gold/30 text-gold text-xs font-semibold">
              ✨ 프리미엄
            </div>
          )}

          {/* 그라디언트 오버레이 */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-card" />
        </div>

        {/* 정보 영역 */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-text-primary text-base">{user.nickname}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-text-secondary text-sm">
                <span>{age}세</span>
                <span className="text-border">·</span>
                <span>{user.gender === 'female' ? '여성' : '남성'}</span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin size={12} />
                  {user.region}
                </span>
              </div>
            </div>
          </div>

          {/* 한줄소개 */}
          {user.bio && (
            <p className="text-text-muted text-sm line-clamp-2 mb-3 leading-relaxed">{user.bio}</p>
          )}

          {/* 관심사 태그 */}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {user.interests.slice(0, 3).map((interest) => (
                <span key={interest} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={handleLike}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all',
                liked
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-bg-hover text-text-secondary border border-border hover:border-primary/30 hover:text-primary'
              )}
            >
              <Heart size={15} className={liked ? 'fill-current' : ''} />
              <span>{likeCount > 0 ? likeCount : ''} 좋아요</span>
            </button>
            <button
              onClick={handleChat}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 text-sm font-medium transition-all"
            >
              <MessageCircle size={15} />
              채팅
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

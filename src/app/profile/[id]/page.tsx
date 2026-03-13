'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ArrowLeft, Heart, MessageCircle, MapPin, Calendar, MoreVertical, Flag, Ban } from 'lucide-react';
import { getAge, formatTime, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ReportModal from '@/components/ReportModal';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLiked(data.isLiked);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: id }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setProfile((p: any) => ({
        ...p,
        _count: { ...p._count, likesReceived: p._count.likesReceived + (data.liked ? 1 : -1) },
      }));
      toast(data.liked ? `💕 ${profile.nickname}님에게 좋아요를 보냈습니다!` : '좋아요를 취소했습니다.');
    } finally {
      setLiking(false);
    }
  };

  const handleBlock = async () => {
    const res = await fetch('/api/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedId: id }),
    });
    const data = await res.json();
    setBlocked(data.blocked);
    setShowMenu(false);
    toast(data.blocked ? '차단되었습니다.' : '차단이 해제되었습니다.');
    if (data.blocked) router.back();
  };

  const handleChat = async () => {
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: id }),
      });
      const room = await res.json();
      router.push(`/chat?roomId=${room.id}`);
    } catch {
      toast.error('채팅방을 열 수 없습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse-slow">🌸</div>
      </div>
    );
  }

  if (!profile || profile.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-text-secondary">사용자를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-primary">돌아가기</button>
      </div>
    );
  }

  const age = getAge(profile.birthYear);
  const avatar = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.nickname)}`;
  const isMe = me?.id === id;

  return (
    <div className="min-h-screen bg-bg-base">
      {/* 상단 배경 */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 via-bg-surface to-secondary/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        {!isMe && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                <button onClick={() => { setShowReport(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-bg-hover transition-colors">
                  <Flag size={15} /> 신고하기
                </button>
                <button onClick={handleBlock}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:bg-bg-hover transition-colors border-t border-border">
                  <Ban size={15} /> {blocked ? '차단 해제' : '차단하기'}
                </button>
              </div>
            )}
          </div>
        )}
        {showReport && profile && (
          <ReportModal targetUserId={id} targetNickname={profile.nickname} onClose={() => setShowReport(false)} />
        )}
        {/* 배경 원형 장식 */}
        <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* 프로필 카드 */}
        <div className="relative -mt-20 mb-6">
          <div className="bg-bg-card rounded-3xl p-6 border border-border shadow-card">
            {/* 아바타 + 기본 정보 */}
            <div className="flex items-end gap-4 mb-4">
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt={profile.nickname}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-border bg-bg-hover"
                />
                {profile.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-online rounded-full border-2 border-bg-card" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-text-primary">{profile.nickname}</h1>
                  {profile.isPremium && (
                    <span className="px-2 py-0.5 rounded-full bg-gold/20 border border-gold/30 text-gold text-xs font-semibold">✨ 프리미엄</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-text-secondary text-sm flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {age}세 ({profile.gender === 'female' ? '여성' : '남성'})
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    {profile.region}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className={cn('w-2 h-2 rounded-full', profile.isOnline ? 'bg-online' : 'bg-text-muted')} />
                  <span className="text-xs text-text-muted">
                    {profile.isOnline ? '지금 온라인' : `${formatTime(profile.lastSeen)} 접속`}
                  </span>
                </div>
              </div>
            </div>

            {/* 좋아요 수 */}
            <div className="flex items-center gap-1 text-primary text-sm mb-4">
              <Heart size={14} className="fill-current" />
              <span className="font-medium">{profile._count?.likesReceived || 0}명</span>
              <span className="text-text-muted">이 좋아해요</span>
            </div>

            {/* 자기소개 */}
            {profile.bio && (
              <div className="bg-bg-surface rounded-xl p-4 mb-4">
                <p className="text-text-secondary text-sm leading-relaxed">"{profile.bio}"</p>
              </div>
            )}

            {/* 관심사 */}
            {profile.interests?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">관심사</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string) => (
                    <span key={interest} className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            {!isMe && (
              <div className="flex gap-3">
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all',
                    liked
                      ? 'bg-primary text-white shadow-primary'
                      : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                  )}
                >
                  <Heart size={18} className={liked ? 'fill-current' : ''} />
                  {liked ? '좋아요 취소' : '좋아요 💕'}
                </button>
                <button
                  onClick={handleChat}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-primary text-white font-semibold text-sm shadow-primary hover:opacity-90 transition-all"
                >
                  <MessageCircle size={18} />
                  채팅 시작
                </button>
              </div>
            )}

            {isMe && (
              <button
                onClick={() => router.push('/mypage')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-bg-surface border border-border text-text-secondary hover:border-primary/30 hover:text-primary transition-all font-medium"
              >
                프로필 편집
              </button>
            )}
          </div>
        </div>

        {/* 가입일 */}
        <p className="text-center text-text-muted text-xs pb-8">
          {new Date(profile.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 가입
        </p>
      </div>
    </div>
  );
}

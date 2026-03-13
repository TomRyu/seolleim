'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Sparkles, Heart, MessageCircle, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { getAge, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MatchResult {
  userId: string;
  score: number;
  reason: string;
  user: any;
}

export default function MatchingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleMatch = async () => {
    if (!user) return;
    if (user.coins < 20 && !user.isPremium) {
      toast.error('코인이 부족합니다. 20코인이 필요합니다.');
      router.push('/shop');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/matching', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setMatches(data.matches);
      setSummary(data.summary);
      setDone(true);
      await refreshUser();
    } catch {
      toast.error('매칭 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (targetUserId: string) => {
    const res = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    const room = await res.json();
    router.push(`/chat?roomId=${room.id}`);
  };

  return (
    <div className="min-h-screen bg-bg-base max-w-2xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="text-primary" size={24} />
          AI 매칭
        </h1>
        <p className="text-text-muted text-sm mt-1">Claude AI가 나와 가장 잘 맞는 분을 찾아드립니다</p>
      </div>

      {!done ? (
        /* 매칭 시작 화면 */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-primary">
              <Sparkles size={52} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gold flex items-center justify-center text-xl animate-bounce">
              💫
            </div>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-2">나에게 딱 맞는 인연 찾기</h2>
          <p className="text-text-secondary text-sm max-w-xs mb-2">
            내 관심사, 지역, 나이를 분석해서<br />최적의 5명을 추천해드립니다
          </p>

          <div className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
            <span className="text-gold text-sm">🪙</span>
            <span className="text-gold text-sm font-medium">
              {user?.isPremium ? '프리미엄 무제한 무료' : '1회 20코인 (현재: ' + (user?.coins || 0) + '코인)'}
            </span>
          </div>

          <button
            onClick={handleMatch}
            disabled={loading}
            className="px-10 py-4 rounded-2xl bg-gradient-primary text-white font-bold text-lg shadow-primary hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                매칭 시작하기
              </>
            )}
          </button>
        </div>
      ) : (
        /* 매칭 결과 */
        <div className="space-y-6">
          {/* AI 요약 */}
          {summary && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">🤖</span>
                <div>
                  <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">AI 분석 결과</p>
                  <p className="text-text-primary text-sm leading-relaxed">{summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* 매칭 목록 */}
          <div className="space-y-4">
            {matches.map((match, index) => {
              const age = getAge(match.user.birthYear);
              const avatar = match.user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(match.user.nickname)}`;
              return (
                <div
                  key={match.userId}
                  className="bg-bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* 순위 배지 */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                      index === 0 ? 'bg-gold text-bg-base' :
                      index === 1 ? 'bg-text-secondary text-bg-base' :
                      index === 2 ? 'bg-secondary/60 text-bg-base' :
                      'bg-bg-hover text-text-muted'
                    )}>
                      {index + 1}
                    </div>

                    {/* 아바타 */}
                    <div className="relative shrink-0">
                      <img src={avatar} alt={match.user.nickname}
                        className="w-14 h-14 rounded-xl object-cover bg-bg-hover" />
                      {match.user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-online rounded-full border-2 border-bg-card" />
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary">{match.user.nickname}</h3>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                          <Sparkles size={12} className="text-primary" />
                          <span className="text-primary text-xs font-bold">{match.score}점</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-text-muted text-xs mt-0.5">
                        <span>{age}세</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin size={10} />{match.user.region}
                        </span>
                      </div>

                      {/* AI 매칭 이유 */}
                      <div className="mt-2 p-3 bg-bg-surface rounded-xl">
                        <p className="text-text-secondary text-xs leading-relaxed">
                          💡 {match.reason}
                        </p>
                      </div>

                      {/* 관심사 */}
                      {match.user.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.user.interests.slice(0, 3).map((i: string) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                              {i}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => router.push(`/profile/${match.userId}`)}
                      className="flex-1 py-2.5 rounded-xl bg-bg-hover border border-border text-text-secondary text-sm hover:border-primary/30 hover:text-primary transition-all font-medium"
                    >
                      프로필 보기
                    </button>
                    <button
                      onClick={() => handleChat(match.userId)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all"
                    >
                      <MessageCircle size={15} />
                      채팅하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 다시 매칭 */}
          <button
            onClick={() => { setDone(false); setMatches([]); setSummary(''); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-bg-card border border-border text-text-secondary hover:border-primary/30 hover:text-primary transition-all font-medium"
          >
            <RefreshCw size={16} />
            다시 매칭하기 (20코인)
          </button>
        </div>
      )}
    </div>
  );
}

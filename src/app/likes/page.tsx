'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { getAge, cn } from '@/lib/utils';

export default function LikesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'received' | 'given'>('received');
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/likes?type=${tab}`)
      .then((r) => r.json())
      .then(setLikes)
      .finally(() => setLoading(false));
  }, [user, tab]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-base max-w-2xl mx-auto">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold text-text-primary">좋아요</h1>
      </div>

      <div className="flex border-b border-border px-6">
        {(['received', 'given'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-3.5 text-sm font-medium border-b-2 transition-all',
              tab === t ? 'text-primary border-primary' : 'text-text-muted border-transparent')}>
            {t === 'received' ? '받은 좋아요' : '보낸 좋아요'}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-bg-card rounded-2xl border border-border animate-pulse shimmer" />
          ))
        ) : likes.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">{tab === 'received' ? '아직 받은 좋아요가 없어요' : '아직 보낸 좋아요가 없어요'}</p>
          </div>
        ) : (
          likes.map((like: any) => {
            const person = tab === 'received' ? like.fromUser : like.toUser;
            return (
              <button key={like.id} onClick={() => router.push(`/profile/${person.id}`)}
                className="w-full flex items-center gap-3 p-4 bg-bg-card rounded-2xl border border-border hover:border-primary/30 transition-all text-left">
                <div className="relative">
                  <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.nickname}`}
                    alt={person.nickname} className="w-12 h-12 rounded-full bg-bg-hover" />
                  {person.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-bg-card" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary text-sm">{person.nickname}</p>
                  <p className="text-text-muted text-xs">{getAge(person.birthYear)}세 · {person.region}</p>
                </div>
                <Heart size={18} className="text-primary fill-current shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

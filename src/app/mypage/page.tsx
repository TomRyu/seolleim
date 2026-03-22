'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { ChevronRight, Edit3, LogOut, Camera, Bell, Heart } from 'lucide-react';
import { usePushNotification } from '@/lib/use-push';
import { getAge, formatTime, REGIONS, INTERESTS, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'likes' | 'settings';

export default function MyPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const [likes, setLikes] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: '', region: '', bio: '', interests: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { permission, subscribed, subscribe } = usePushNotification(user?.id);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    setForm({ nickname: user.nickname, region: user.region, bio: user.bio, interests: user.interests || [] });
  }, [user]);

  useEffect(() => {
    if (tab === 'likes') {
      fetch('/api/likes?type=received')
        .then((r) => r.json())
        .then(setLikes)
        .catch(() => {});
    }
  }, [tab]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      await refreshUser();
      toast.success('프로필 사진이 변경되었습니다.');
    } catch {
      toast.error('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await refreshUser();
        setEditing(false);
        toast.success('프로필이 저장되었습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : f.interests.length < 5 ? [...f.interests, interest] : f.interests,
    }));
  };

  if (!user) return null;

  const age = getAge(user.birthYear);
  const avatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.nickname)}`;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto">
        {/* 프로필 헤더 */}
        <div className="relative bg-gradient-to-b from-bg-surface to-bg-base px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img src={avatar} alt={user.nickname} className="w-20 h-20 rounded-2xl object-cover border-2 border-border bg-bg-card" />
              <label className={cn(
                'absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer transition-all',
                'bg-black/0 group-hover:bg-black/40',
                uploadingPhoto && 'bg-black/40'
              )}>
                <Camera size={20} className={cn('text-white opacity-0 group-hover:opacity-100 transition-all', uploadingPhoto && 'opacity-100 animate-pulse')} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploadingPhoto} />
              </label>
              {user.isPremium && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center text-xs">✨</div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">{user.nickname}</h1>
              <p className="text-text-secondary text-sm mt-0.5">{age}세 · {user.gender === 'female' ? '여성' : '남성'} · {user.region}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-gold text-sm">🪙</span>
                <span className="text-gold text-sm font-semibold">{user.coins} 코인</span>
              </div>
            </div>
          </div>

          {/* 코인 충전 배너 */}
          <div className="mt-4 bg-gradient-to-r from-gold/10 to-secondary/10 border border-gold/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-text-primary font-semibold text-sm">코인 충전하기</p>
              <p className="text-text-muted text-xs mt-0.5">더 많은 채팅을 즐기세요</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-gold text-bg-base text-sm font-bold hover:opacity-90 transition-all">
              충전 🪙
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-border px-6">
          {([
            { key: 'profile', label: '프로필' },
            { key: 'likes', label: `받은 좋아요 ${likes.length > 0 ? `(${likes.length})` : ''}` },
            { key: 'settings', label: '설정' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 py-3.5 text-sm font-medium border-b-2 transition-all',
                tab === key ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          {/* 프로필 탭 */}
          {tab === 'profile' && (
            <div className="space-y-5">
              {!editing ? (
                <>
                  <div className="bg-bg-card rounded-2xl p-5 border border-border space-y-4">
                    <InfoRow label="닉네임" value={user.nickname} />
                    <InfoRow label="지역" value={user.region} />
                    <InfoRow label="자기소개" value={user.bio || '아직 자기소개가 없습니다.'} />
                    <div>
                      <p className="text-text-muted text-xs mb-2">관심사</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(user.interests || []).map((i: string) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">{i}</span>
                        ))}
                        {(!user.interests || user.interests.length === 0) && (
                          <span className="text-text-muted text-sm">관심사를 추가해보세요</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-card border border-border text-text-secondary hover:border-primary/30 hover:text-primary transition-all font-medium"
                  >
                    <Edit3 size={16} />
                    프로필 편집
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <EditInput label="닉네임" value={form.nickname} onChange={(v) => setForm((f) => ({ ...f, nickname: v }))} />
                  <div className="space-y-1.5">
                    <label className="text-sm text-text-secondary font-medium">지역</label>
                    <select
                      value={form.region}
                      onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                      className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-primary/50 transition-all"
                    >
                      {REGIONS.slice(1).map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-text-secondary font-medium">자기소개</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted outline-none focus:border-primary/50 transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-text-secondary font-medium">관심사 <span className="text-text-muted">(최대 5개)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((i) => (
                        <button key={i} type="button" onClick={() => toggleInterest(i)}
                          className={cn('px-3 py-1.5 rounded-full text-sm border transition-all',
                            form.interests.includes(i) ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-bg-card border-border text-text-secondary hover:border-primary/30'
                          )}>
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl bg-bg-card border border-border text-text-secondary font-medium">취소</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold disabled:opacity-60">
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 좋아요 탭 */}
          {tab === 'likes' && (
            <div className="space-y-3">
              {likes.length === 0 ? (
                <div className="text-center py-16">
                  <Heart size={40} className="text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">아직 받은 좋아요가 없습니다.</p>
                  <p className="text-text-muted text-sm mt-1">프로필을 완성하면 더 많은 관심을 받을 수 있어요!</p>
                </div>
              ) : (
                likes.map((like: any) => {
                  const fromUser = like.fromUser;
                  return (
                    <button
                      key={like.id}
                      onClick={() => router.push(`/profile/${fromUser.id}`)}
                      className="w-full flex items-center gap-3 p-4 bg-bg-card rounded-2xl border border-border hover:border-primary/30 transition-all text-left"
                    >
                      <div className="relative">
                        <img src={fromUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUser.nickname}`}
                          alt={fromUser.nickname} className="w-12 h-12 rounded-full bg-bg-hover" />
                        {fromUser.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-bg-card" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary text-sm">{fromUser.nickname}</p>
                        <p className="text-text-muted text-xs">{getAge(fromUser.birthYear)}세 · {fromUser.region}</p>
                      </div>
                      <div className="text-primary">
                        <Heart size={18} className="fill-current" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* 설정 탭 */}
          {tab === 'settings' && (
            <div className="space-y-3">
              <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={subscribe}
                  disabled={permission === 'denied' || subscribed}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bg-hover transition-colors border-b border-border"
                >
                  <Bell size={18} className="text-primary" />
                  <span className="flex-1 text-sm text-text-primary text-left">
                    {permission === 'denied' ? '알림이 차단됨 (브라우저 설정에서 허용)' :
                     subscribed ? '알림 켜짐 ✓' : '새 메시지 알림 받기'}
                  </span>
                  {!subscribed && permission !== 'denied' && (
                    <span className="text-xs text-primary font-medium">설정</span>
                  )}
                </button>
                <SettingRow icon="🔒" label="개인정보 보호" />
                <SettingRow icon="📋" label="이용약관" />
                <SettingRow icon="🛡️" label="개인정보처리방침" />
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-bg-card border border-border text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-medium"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-muted text-xs mb-0.5">{label}</p>
      <p className="text-text-primary text-sm">{value}</p>
    </div>
  );
}

function EditInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-text-secondary font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-primary/50 transition-all" />
    </div>
  );
}

function SettingRow({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bg-hover transition-colors border-b border-border last:border-0">
      <span className="text-lg">{icon}</span>
      <span className="flex-1 text-sm text-text-primary text-left">{label}</span>
      <ChevronRight size={16} className="text-text-muted" />
    </button>
  );
}

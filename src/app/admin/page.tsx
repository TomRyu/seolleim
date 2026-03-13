'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Users, MessageCircle, CreditCard, Flag, TrendingUp, Shield, Ban, Crown, RefreshCw } from 'lucide-react';
import { getAge, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type AdminTab = 'dashboard' | 'users' | 'reports';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (!(user as any).isAdmin) { router.push('/'); return; }
    fetchData();
  }, [user, tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const res = await fetch('/api/admin/stats');
        setStats(await res.json());
      } else if (tab === 'users') {
        const res = await fetch(`/api/admin/users?search=${search}`);
        const data = await res.json();
        setUsers(data.users || []);
      } else if (tab === 'reports') {
        const res = await fetch('/api/admin/reports');
        setReports(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) { toast.success('처리되었습니다.'); fetchData(); }
  };

  const handleReportAction = async (reportId: string, action: string) => {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action }),
    });
    if (res.ok) { toast.success('처리되었습니다.'); fetchData(); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-base">
      {/* 헤더 */}
      <div className="bg-bg-surface border-b border-border px-6 py-4 flex items-center gap-3">
        <Shield size={20} className="text-primary" />
        <h1 className="text-lg font-bold text-text-primary">관리자 페이지</h1>
        <button onClick={fetchData} className="ml-auto p-2 rounded-lg hover:bg-bg-hover text-text-muted">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-border bg-bg-surface px-6">
        {([
          { key: 'dashboard', label: '대시보드', icon: TrendingUp },
          { key: 'users', label: '회원 관리', icon: Users },
          { key: 'reports', label: `신고 처리 ${reports.length > 0 ? `(${reports.length})` : ''}`, icon: Flag },
        ] as { key: AdminTab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all',
              tab === key ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-secondary')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 대시보드 */}
        {tab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="👥" label="전체 회원" value={stats.totalUsers.toLocaleString()} sub={`오늘 +${stats.newUsersToday}`} color="primary" />
              <StatCard icon="🟢" label="현재 접속" value={stats.onlineUsers.toLocaleString()} color="online" />
              <StatCard icon="💬" label="총 메시지" value={stats.totalMessages.toLocaleString()} sub={`오늘 +${stats.messagesToday}`} color="secondary" />
              <StatCard icon="✨" label="프리미엄" value={stats.premiumUsers.toLocaleString()} color="gold" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard icon="💰" label="총 매출" value={`${(stats.revenueTotal || 0).toLocaleString()}원`} sub={`${stats.totalPayments}건`} color="gold" />
              <StatCard icon="🚨" label="미처리 신고" value={stats.pendingReports} color="red" />
            </div>
          </div>
        )}

        {/* 회원 관리 */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                placeholder="닉네임 또는 이메일 검색"
                className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm outline-none focus:border-primary/50"
              />
              <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-all">
                검색
              </button>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-text-primary text-sm">{u.nickname}</span>
                      {u.isPremium && <span className="px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-xs border border-gold/20">프리미엄</span>}
                      {u.isBanned && <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs border border-red-500/20">정지</span>}
                      {u.isAdmin && <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs border border-primary/20">관리자</span>}
                    </div>
                    <p className="text-text-muted text-xs mt-0.5">{u.email} · {getAge(u.birthYear)}세 · {u.region} · 코인 {u.coins}</p>
                    <p className="text-text-muted text-xs">메시지 {u._count.sentMessages} · 받은좋아요 {u._count.likesReceived} · 신고받음 {u._count.reportsReceived}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleUserAction(u.id, u.isPremium ? 'revoke-premium' : 'grant-premium')}
                      className="p-2 rounded-lg hover:bg-bg-hover text-gold transition-colors" title={u.isPremium ? '프리미엄 해제' : '프리미엄 부여'}>
                      <Crown size={15} />
                    </button>
                    <button onClick={() => handleUserAction(u.id, u.isBanned ? 'unban' : 'ban')}
                      className={cn('p-2 rounded-lg transition-colors', u.isBanned ? 'hover:bg-bg-hover text-online' : 'hover:bg-bg-hover text-red-400')}
                      title={u.isBanned ? '정지 해제' : '회원 정지'}>
                      <Ban size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 신고 처리 */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-16">
                <Flag size={40} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">처리할 신고가 없습니다.</p>
              </div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="bg-bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-xs text-text-muted bg-bg-hover px-2 py-1 rounded-lg">{r.reason}</div>
                    <span className="text-text-muted text-xs">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-text-muted text-xs mb-1">신고자</p>
                      <p className="text-text-primary text-sm font-medium">{r.fromUser.nickname}</p>
                    </div>
                    <div className="text-text-muted">→</div>
                    <div className="text-center">
                      <p className="text-text-muted text-xs mb-1">피신고자</p>
                      <p className="text-text-primary text-sm font-medium">{r.toUser.nickname}</p>
                    </div>
                  </div>
                  {r.detail && <p className="text-text-secondary text-sm bg-bg-hover rounded-xl px-4 py-2 mb-3">"{r.detail}"</p>}
                  <div className="flex gap-2">
                    <button onClick={() => handleReportAction(r.id, 'dismiss')}
                      className="flex-1 py-2 rounded-xl bg-bg-hover border border-border text-text-secondary text-sm hover:border-text-muted transition-all">
                      무시
                    </button>
                    <button onClick={() => handleReportAction(r.id, 'reviewed')}
                      className="flex-1 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm hover:bg-secondary/20 transition-all">
                      확인 처리
                    </button>
                    <button onClick={() => handleReportAction(r.id, 'ban')}
                      className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-all">
                      회원 정지
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: any; sub?: string; color: string }) {
  const colors: any = {
    primary: 'bg-primary/10 border-primary/20',
    secondary: 'bg-secondary/10 border-secondary/20',
    gold: 'bg-gold/10 border-gold/20',
    online: 'bg-online/10 border-online/20',
    red: 'bg-red-500/10 border-red-500/20',
  };
  return (
    <div className={cn('rounded-2xl border p-5', colors[color] || colors.primary)}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-text-muted text-xs mb-0.5">{label}</p>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import MemberCard from '@/components/MemberCard';
import FilterBar from '@/components/FilterBar';
import { FilterState } from '@/lib/utils';
import { User } from '@/types';
import { Loader2, Users, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    gender: 'all',
    region: '전체',
    ageMin: 40,
    ageMax: 70,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchMembers = useCallback(async (reset = false) => {
    if (!user) return;
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const params = new URLSearchParams({
      gender: filters.gender,
      region: filters.region,
      ageMin: String(filters.ageMin),
      ageMax: String(filters.ageMax),
      page: String(currentPage),
    });
    try {
      const res = await fetch(`/api/members?${params}`);
      const data = await res.json();
      if (reset) {
        setMembers(data.users);
        setPage(2);
      } else {
        setMembers((prev) => [...prev, ...data.users]);
        setPage((p) => p + 1);
      }
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user, filters, page]);

  useEffect(() => {
    if (user) fetchMembers(true);
  }, [user, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse-slow">🌸</div>
          <p className="text-text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-base">
      {/* 필터바 */}
      <FilterBar filters={filters} onChange={handleFilterChange} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {filters.gender === 'female' ? '여성' : filters.gender === 'male' ? '남성' : '전체'} 회원
              {filters.region !== '전체' && ` · ${filters.region}`}
            </h2>
            <p className="text-text-muted text-sm">총 {total.toLocaleString()}명</p>
          </div>
          <button
            onClick={() => fetchMembers(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-card border border-border text-text-secondary text-sm hover:border-primary/30 transition-all"
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>

        {/* 회원 카드 그리드 */}
        {members.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users size={48} className="text-text-muted mb-4" />
            <p className="text-text-secondary font-medium">조건에 맞는 회원이 없습니다.</p>
            <p className="text-text-muted text-sm mt-1">필터를 조정해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                user={member}
                currentUserId={user.id}
              />
            ))}

            {/* 스켈레톤 로딩 */}
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="h-48 bg-bg-hover shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-bg-hover rounded-lg shimmer" />
                  <div className="h-3 bg-bg-hover rounded-lg w-2/3 shimmer" />
                  <div className="h-8 bg-bg-hover rounded-xl mt-3 shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 더 보기 버튼 */}
        {hasMore && !loading && members.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchMembers(false)}
              className="px-8 py-3 rounded-2xl bg-bg-card border border-border text-text-secondary hover:border-primary/30 hover:text-primary transition-all font-medium"
            >
              더 보기
            </button>
          </div>
        )}

        {!hasMore && members.length > 0 && (
          <p className="text-center text-text-muted text-sm mt-8">모든 회원을 불러왔습니다.</p>
        )}
      </div>
    </div>
  );
}

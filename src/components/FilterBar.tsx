'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { FilterState, REGIONS, cn } from '@/lib/utils';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function FilterBar({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const genderOptions = [
    { value: 'all', label: '전체' },
    { value: 'female', label: '여성' },
    { value: 'male', label: '남성' },
  ];

  return (
    <div className="sticky top-16 md:top-16 z-40 bg-bg-base/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {/* 성별 필터 */}
        <div className="flex gap-1.5 shrink-0">
          {genderOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, gender: opt.value as FilterState['gender'] })}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                filters.gender === opt.value
                  ? 'bg-primary text-white shadow-primary/30 shadow-md'
                  : 'bg-bg-card text-text-secondary border border-border hover:border-primary/30'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* 지역 필터 */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, region: r })}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                filters.region === r
                  ? 'bg-secondary text-white shadow-secondary/30 shadow-md'
                  : 'bg-bg-card text-text-secondary border border-border hover:border-secondary/30'
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* 상세 필터 버튼 */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
            open ? 'bg-bg-card border-primary/30 text-primary' : 'bg-bg-card border-border text-text-secondary hover:border-primary/30'
          )}
        >
          <SlidersHorizontal size={14} />
          나이 필터
        </button>
      </div>

      {/* 나이 필터 드롭다운 */}
      {open && (
        <div className="bg-bg-surface border-b border-border px-4 py-4">
          <div className="max-w-sm flex items-center gap-4">
            <span className="text-text-secondary text-sm whitespace-nowrap">나이</span>
            <div className="flex items-center gap-2 flex-1">
              <select
                value={filters.ageMin}
                onChange={(e) => onChange({ ...filters, ageMin: Number(e.target.value) })}
                className="flex-1 bg-bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                {Array.from({ length: 31 }, (_, i) => 40 + i).map((age) => (
                  <option key={age} value={age}>{age}세</option>
                ))}
              </select>
              <span className="text-text-muted text-sm">~</span>
              <select
                value={filters.ageMax}
                onChange={(e) => onChange({ ...filters, ageMax: Number(e.target.value) })}
                className="flex-1 bg-bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                {Array.from({ length: 31 }, (_, i) => 40 + i).map((age) => (
                  <option key={age} value={age}>{age}세</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

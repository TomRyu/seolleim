'use client';

import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const REASONS = [
  '욕설/비방',
  '음란물/성적 메시지',
  '사기/허위 정보',
  '스팸/도배',
  '개인정보 요구',
  '기타',
];

interface Props {
  targetUserId: string;
  targetNickname: string;
  onClose: () => void;
}

export default function ReportModal({ targetUserId, targetNickname, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error('신고 사유를 선택해주세요.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId, reason, detail }),
      });
      if (res.ok) {
        toast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-card border border-border rounded-3xl p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-red-400" />
            <h3 className="font-bold text-text-primary">{targetNickname} 신고</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm text-left border transition-all',
                reason === r
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 font-medium'
                  : 'bg-bg-hover border-border text-text-secondary hover:border-red-500/30'
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="추가 설명 (선택사항)"
          rows={3}
          className="w-full bg-bg-hover border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-red-500/40 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-bg-hover border border-border text-text-secondary text-sm font-medium">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason}
            className="flex-1 py-3 rounded-xl bg-red-500/80 text-white text-sm font-semibold hover:bg-red-500 transition-all disabled:opacity-50"
          >
            {loading ? '신고 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { CheckCircle, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));
    const type = searchParams.get('type') || 'coin';

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      setMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount, type }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.success) {
          await refreshUser();
          setStatus('success');
          setMessage(
            type === 'coin'
              ? `${data.coins}코인이 충전되었습니다! 🎉`
              : `프리미엄 구독이 시작되었습니다! ✨`
          );
        } else {
          setStatus('error');
          setMessage(data.error || '결제 처리에 실패했습니다.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('서버 오류가 발생했습니다.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="bg-bg-card border border-border rounded-3xl p-10 text-center max-w-sm w-full">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
            <p className="text-text-secondary font-medium">결제를 처리하는 중...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <CheckCircle size={48} className="text-online mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text-primary mb-2">결제 완료!</h2>
            <p className="text-text-secondary mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/shop')}
                className="flex-1 py-3 rounded-xl bg-bg-hover border border-border text-text-secondary font-medium hover:border-primary/30 transition-all"
              >
                더 충전하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-all"
              >
                홈으로
              </button>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">😢</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">결제 실패</h2>
            <p className="text-text-secondary mb-6">{message}</p>
            <button
              onClick={() => router.push('/shop')}
              className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold"
            >
              다시 시도
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

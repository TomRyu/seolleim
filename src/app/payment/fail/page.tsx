'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message') || '결제가 취소되었습니다.';

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="bg-bg-card border border-border rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">😢</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">결제 실패</h2>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 rounded-xl bg-bg-hover border border-border text-text-secondary font-medium"
          >
            홈으로
          </button>
          <button
            onClick={() => router.push('/shop')}
            className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
      <PaymentFailContent />
    </Suspense>
  );
}

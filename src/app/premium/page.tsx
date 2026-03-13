'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

declare global {
  interface Window { TossPayments: any; }
}
import { PREMIUM_PLANS } from '@/lib/coins';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, Crown, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

export default function PremiumPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('quarterly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const prepareRes = await fetch('/api/payment/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selected, type: 'premium' }),
      });
      const { orderId, amount, orderName } = await prepareRes.json();

      const toss = window.TossPayments(TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey: user.id });
      await payment.requestPayment({
        method: 'CARD',
        orderId,
        orderName: `프리미엄 ${PREMIUM_PLANS.find((p) => p.id === selected)?.name}`,
        customerName: user.nickname,
        successUrl: `${window.location.origin}/payment/success?type=premium`,
        failUrl: `${window.location.origin}/payment/fail`,
        amount: { currency: 'KRW', value: amount },
      });
    } catch (err: any) {
      if (err?.code !== 'PAY_PROCESS_CANCELED') toast.error('결제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = PREMIUM_PLANS.find((p) => p.id === selected);

  return (
    <div className="min-h-screen bg-bg-base max-w-2xl mx-auto px-4 py-6">
      <Script src="https://js.tosspayments.com/v2/standard" strategy="beforeInteractive" />
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-bg-card text-text-secondary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">프리미엄 구독</h1>
      </div>

      {/* 히어로 */}
      <div className="bg-gradient-to-br from-primary/20 via-bg-surface to-secondary/20 border border-primary/20 rounded-3xl p-6 mb-8 text-center">
        <div className="text-5xl mb-3">✨</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">프리미엄이 되세요</h2>
        <p className="text-text-secondary text-sm">무제한 채팅, AI 매칭, 영상통화까지</p>
        {user?.isPremium && (
          <div className="mt-3 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 inline-flex items-center gap-2">
            <Crown size={14} className="text-gold" />
            <span className="text-gold text-sm font-semibold">현재 프리미엄 회원입니다</span>
          </div>
        )}
      </div>

      {/* 플랜 선택 */}
      <div className="space-y-3 mb-8">
        {PREMIUM_PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={cn(
              'w-full p-5 rounded-2xl border transition-all text-left relative overflow-hidden',
              selected === plan.id
                ? 'bg-primary/10 border-primary/50'
                : 'bg-bg-card border-border hover:border-primary/30'
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-primary text-white text-xs font-bold rounded-bl-xl">
                인기
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-text-primary text-lg">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text-primary">{plan.price.toLocaleString()}</span>
                  <span className="text-text-muted text-sm">원</span>
                  <span className="text-text-muted text-xs ml-1">(월 {plan.perMonth.toLocaleString()}원)</span>
                </div>
              </div>
              <div className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1',
                selected === plan.id ? 'bg-primary border-primary' : 'border-border'
              )}>
                {selected === plan.id && <Check size={14} className="text-white" />}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.features.map((f) => (
                <span key={f} className="flex items-center gap-1 text-xs text-text-secondary">
                  <Check size={11} className="text-online shrink-0" /> {f}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* 결제 버튼 */}
      <div className="sticky bottom-20 md:bottom-4">
        <button
          onClick={handleSubscribe}
          disabled={loading || user?.isPremium}
          className="w-full py-4 rounded-2xl bg-gradient-primary text-white font-bold text-lg shadow-primary hover:opacity-90 transition-all disabled:opacity-50"
        >
          {user?.isPremium
            ? '이미 프리미엄 회원입니다'
            : loading
            ? '결제창 열는 중...'
            : `${selectedPlan?.name} 구독 — ${selectedPlan?.price.toLocaleString()}원`}
        </button>
        <p className="text-center text-text-muted text-xs mt-2">
          구독 후 마이페이지에서 언제든 해지 가능
        </p>
      </div>
    </div>
  );
}

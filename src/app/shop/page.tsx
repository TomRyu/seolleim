'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { COIN_PACKAGES } from '@/lib/coins';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

declare global {
  interface Window { TossPayments: any; }
}

// 토스페이먼츠 클라이언트 키 (테스트)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

export default function ShopPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('coin_100');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!selected || !user) return;
    setLoading(true);

    try {
      // 1. 주문 생성
      const prepareRes = await fetch('/api/payment/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selected, type: 'coin' }),
      });
      const { orderId, amount, orderName } = await prepareRes.json();

      // 2. 토스페이먼츠 SDK 동적 로드
      // 3. 토스페이먼츠 결제창 호출 (CDN)
      const toss = window.TossPayments(TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey: user.id });
      await payment.requestPayment({
        method: 'CARD',
        orderId,
        orderName,
        customerName: user.nickname,
        successUrl: `${window.location.origin}/payment/success?type=coin`,
        failUrl: `${window.location.origin}/payment/fail`,
        amount: { currency: 'KRW', value: amount },
      });
        amount,
        orderId,
        orderName,
        customerName: user.nickname,
        successUrl: `${window.location.origin}/payment/success?type=coin`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: any) {
      if (err?.code !== 'PAY_PROCESS_CANCELED') {
        toast.error('결제 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = COIN_PACKAGES.find((p) => p.id === selected);

  return (
    <div className="min-h-screen bg-bg-base max-w-2xl mx-auto px-4 py-6">
      <Script src="https://js.tosspayments.com/v2/standard" strategy="beforeInteractive" />
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-bg-card text-text-secondary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">코인 충전</h1>
      </div>

      {/* 현재 잔액 */}
      <div className="bg-gradient-to-r from-gold/10 to-secondary/10 border border-gold/20 rounded-2xl p-5 mb-8 flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">현재 코인 잔액</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">🪙</span>
            <span className="text-2xl font-bold text-gold">{user?.coins || 0}</span>
            <span className="text-text-secondary text-sm">코인</span>
          </div>
        </div>
        <div className="text-right text-text-muted text-xs">
          <p>채팅 시작: 5코인</p>
          <p>메시지: 1코인</p>
          <p>영상통화: 10코인/분</p>
        </div>
      </div>

      {/* 패키지 선택 */}
      <div className="space-y-3 mb-8">
        <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wider">패키지 선택</h2>
        {COIN_PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelected(pkg.id)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left',
              selected === pkg.id
                ? 'bg-gold/10 border-gold/50 shadow-gold'
                : 'bg-bg-card border-border hover:border-gold/30'
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0',
              selected === pkg.id ? 'bg-gold/20' : 'bg-bg-hover'
            )}>
              🪙
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">
                  {pkg.coins + pkg.bonus}코인
                </span>
                {pkg.bonus > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20">
                    +{pkg.bonus} 보너스
                  </span>
                )}
                {pkg.popular && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-xs font-medium border border-secondary/20">
                    인기
                  </span>
                )}
                {pkg.best && (
                  <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-xs font-medium border border-gold/20">
                    최고가치
                  </span>
                )}
              </div>
              <p className="text-text-muted text-xs mt-0.5">
                개당 {Math.round(pkg.price / (pkg.coins + pkg.bonus))}원
              </p>
            </div>
            <span className="text-lg font-bold text-text-primary shrink-0">
              {pkg.price.toLocaleString()}원
            </span>
          </button>
        ))}
      </div>

      {/* 결제 버튼 */}
      <div className="sticky bottom-20 md:bottom-4">
        <button
          onClick={handlePay}
          disabled={!selected || loading}
          className="w-full py-4 rounded-2xl bg-gradient-primary text-white font-bold text-lg shadow-primary hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading
            ? '결제창 열는 중...'
            : selectedPkg
            ? `${(selectedPkg.coins + selectedPkg.bonus)}코인 충전 — ${selectedPkg.price.toLocaleString()}원`
            : '패키지를 선택해주세요'}
        </button>
        <p className="text-center text-text-muted text-xs mt-2">
          토스페이먼츠로 안전하게 결제됩니다
        </p>
      </div>
    </div>
  );
}

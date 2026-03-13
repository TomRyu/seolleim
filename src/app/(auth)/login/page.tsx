'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      await refreshUser();
      toast.success(`환영합니다, ${data.user.nickname}님! 🌸`);
      router.push('/');
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 animate-slide-up">
      {/* 로고 */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🌸</div>
        <h1 className="text-2xl font-bold gradient-text">중년나라</h1>
        <p className="text-text-muted text-sm mt-1">다시 설레는 그 시절처럼</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이메일 */}
        <div className="space-y-1.5">
          <label className="text-sm text-text-secondary font-medium">이메일</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              required
              className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 pl-10 text-text-primary placeholder-text-muted outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* 비밀번호 */}
        <div className="space-y-1.5">
          <label className="text-sm text-text-secondary font-medium">비밀번호</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
              className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 pl-10 pr-10 text-text-primary placeholder-text-muted outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* 테스트 계정 안내 */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 text-sm text-text-secondary">
          <p className="font-medium text-secondary mb-0.5">테스트 계정</p>
          <p>이메일: test@test.com</p>
          <p>비밀번호: test1234</p>
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-base shadow-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-text-muted text-sm">
          아직 회원이 아니신가요?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            무료 가입하기
          </Link>
        </p>
      </div>
    </div>
  );
}

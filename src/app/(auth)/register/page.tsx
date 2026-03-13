'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { REGIONS, INTERESTS } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STEPS = ['기본 정보', '프로필 설정', '관심사'];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    email: '', password: '', passwordConfirm: '',
    nickname: '', gender: '', birthYear: '',
    region: '', bio: '', interests: [] as string[],
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleInterest = (interest: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : f.interests.length < 5 ? [...f.interests, interest] : f.interests,
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.email || !form.password || !form.passwordConfirm) return '모든 항목을 입력해주세요.';
      if (form.password.length < 6) return '비밀번호는 6자 이상이어야 합니다.';
      if (form.password !== form.passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    }
    if (step === 1) {
      if (!form.nickname || !form.gender || !form.birthYear || !form.region) return '모든 항목을 입력해주세요.';
      const year = Number(form.birthYear);
      if (year < 1950 || year > 1990) return '출생연도를 확인해주세요. (1950~1990)';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, birthYear: Number(form.birthYear) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      await refreshUser();
      toast.success(`가입을 환영합니다! 🌸 코인 30개가 지급되었습니다.`);
      router.push('/');
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 animate-slide-up">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🌸</div>
        <h1 className="text-xl font-bold gradient-text">회원가입</h1>
        <p className="text-text-muted text-xs mt-1">가입 즉시 코인 30개 지급!</p>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-bg-card border border-border text-text-muted'
            )}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={cn('text-[10px] font-medium', i === step ? 'text-primary' : 'text-text-muted')}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 0: 기본 정보 */}
      {step === 0 && (
        <div className="space-y-4">
          <Input label="이메일" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="example@email.com" />
          <Input label="비밀번호" type="password" value={form.password} onChange={(v) => update('password', v)} placeholder="6자 이상" />
          <Input label="비밀번호 확인" type="password" value={form.passwordConfirm} onChange={(v) => update('passwordConfirm', v)} placeholder="비밀번호 재입력" />
        </div>
      )}

      {/* Step 1: 프로필 */}
      {step === 1 && (
        <div className="space-y-4">
          <Input label="닉네임" value={form.nickname} onChange={(v) => update('nickname', v)} placeholder="사용할 닉네임 (2~10자)" />

          {/* 성별 */}
          <div className="space-y-1.5">
            <label className="text-sm text-text-secondary font-medium">성별</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: 'female', label: '👩 여성', color: 'primary' }, { value: 'male', label: '👨 남성', color: 'secondary' }].map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('gender', value)}
                  className={cn(
                    'py-3 rounded-xl border text-sm font-medium transition-all',
                    form.gender === value
                      ? color === 'primary' ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-secondary/15 border-secondary/50 text-secondary'
                      : 'bg-bg-card border-border text-text-secondary hover:border-primary/30'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Input label="출생연도" type="number" value={form.birthYear} onChange={(v) => update('birthYear', v)} placeholder="예: 1970" />

          {/* 지역 */}
          <div className="space-y-1.5">
            <label className="text-sm text-text-secondary font-medium">거주 지역</label>
            <select
              value={form.region}
              onChange={(e) => update('region', e.target.value)}
              className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-primary/50 transition-all"
            >
              <option value="">지역 선택</option>
              {REGIONS.slice(1).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* 자기소개 */}
          <div className="space-y-1.5">
            <label className="text-sm text-text-secondary font-medium">한줄 자기소개 <span className="text-text-muted">(선택)</span></label>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="간단한 자기소개를 작성해주세요."
              rows={3}
              className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 2: 관심사 */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">관심사를 선택해주세요 <span className="text-text-muted">(최대 5개)</span></p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  form.interests.includes(interest)
                    ? 'bg-primary/15 border-primary/50 text-primary font-medium'
                    : 'bg-bg-card border-border text-text-secondary hover:border-primary/30'
                )}
              >
                {interest}
              </button>
            ))}
          </div>
          <p className="text-text-muted text-xs">{form.interests.length}/5개 선택됨</p>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 py-3 rounded-xl bg-bg-card border border-border text-text-secondary font-medium hover:border-primary/30 transition-all"
          >
            이전
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-primary transition-all hover:opacity-90"
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-primary transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading ? '가입 중...' : '가입 완료 🌸'}
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          이미 계정이 있으신가요? <span className="text-primary font-medium">로그인</span>
        </Link>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-text-secondary font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, gender: true, birthYear: true, region: true, interests: true, bio: true, coins: true },
  });
  if (!me) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

  // 코인 확인 (20코인 필요)
  if (me.coins < 20) {
    return NextResponse.json({ error: '코인이 부족합니다. 20코인이 필요합니다.' }, { status: 402 });
  }

  // 이성 회원 목록 가져오기 (최대 50명)
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      gender: me.gender === 'male' ? 'female' : 'male',
    },
    select: {
      id: true, nickname: true, birthYear: true, region: true,
      interests: true, bio: true, isOnline: true, avatar: true,
      _count: { select: { likesReceived: true } },
    },
    orderBy: [{ isOnline: 'desc' }, { lastSeen: 'desc' }],
    take: 50,
  });

  if (candidates.length === 0) {
    return NextResponse.json({ error: '매칭 가능한 회원이 없습니다.' }, { status: 404 });
  }

  const myInterests = JSON.parse(me.interests || '[]');
  const currentYear = new Date().getFullYear();
  const myAge = currentYear - me.birthYear + 1;

  // Claude API로 매칭 분석
  const prompt = `당신은 중년 소개팅 매칭 전문가입니다. 다음 사용자의 프로필을 분석하고 최적의 매칭을 추천해주세요.

**내 프로필:**
- 나이: ${myAge}세
- 지역: ${me.region}
- 관심사: ${myInterests.join(', ')}
- 자기소개: ${me.bio || '없음'}

**후보 회원 목록 (최대 50명):**
${candidates.map((c, i) => {
  const age = currentYear - c.birthYear + 1;
  const interests = JSON.parse(c.interests || '[]');
  return `${i + 1}. ID:${c.id} | ${age}세 | ${c.region} | 관심사: ${interests.join(',')} | 소개: ${c.bio || '없음'} | 좋아요수: ${c._count.likesReceived}`;
}).join('\n')}

위 후보 중 나와 가장 잘 맞을 것 같은 상위 5명을 선택하고, 각각 왜 잘 맞는지 한국어로 설명해주세요.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "matches": [
    {
      "userId": "사용자ID",
      "score": 85,
      "reason": "매칭 이유 (1~2문장, 자연스러운 한국어)"
    }
  ],
  "summary": "전반적인 매칭 분석 한 줄 (격려하는 톤)"
}`;

  const aiResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  let aiResult: any;
  try {
    const text = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    aiResult = JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }

  // 코인 차감
  await prisma.user.update({
    where: { id: auth.userId },
    data: { coins: { decrement: 20 } },
  });

  // 매칭 결과에 프로필 정보 합치기
  const matches = (aiResult.matches || []).map((m: any) => {
    const candidate = candidates.find((c) => c.id === m.userId);
    if (!candidate) return null;
    return {
      ...m,
      user: {
        ...candidate,
        interests: JSON.parse(candidate.interests || '[]'),
      },
    };
  }).filter(Boolean);

  return NextResponse.json({ matches, summary: aiResult.summary });
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setCookieHeader } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, nickname, gender, birthYear, region, bio, interests } = await req.json();

    if (!email || !password || !nickname || !gender || !birthYear || !region) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        nickname,
        gender,
        birthYear: Number(birthYear),
        region,
        bio: bio || '',
        interests: JSON.stringify(interests || []),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`,
        coins: 30, // 가입 보너스
      },
    });

    const token = signToken({ userId: user.id, email: user.email, nickname: user.nickname });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, nickname: user.nickname } },
      {
        status: 201,
        headers: { 'Set-Cookie': setCookieHeader(token) },
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const auth = getCurrentUser();
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, WEBP 파일만 업로드 가능합니다.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // sharp로 리사이징 (설치된 경우)
  let finalBuffer = buffer;
  try {
    const sharp = (await import('sharp')).default;
    finalBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    // sharp 없으면 원본 사용
  }

  // 저장 경로: public/uploads/avatars/
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(uploadDir, { recursive: true });

  const ext = 'jpg';
  const filename = `${auth.userId}_${Date.now()}.${ext}`;
  await writeFile(join(uploadDir, filename), finalBuffer);

  const avatarUrl = `/uploads/avatars/${filename}`;

  await prisma.user.update({
    where: { id: auth.userId },
    data: { avatar: avatarUrl },
  });

  return NextResponse.json({ url: avatarUrl });
}

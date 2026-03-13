const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const regions = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const interests = ['영화감상', '등산', '여행', '요리', '독서', '음악감상', '낚시', '골프', '사진', '춤', '카페탐방', '드라이브', '미술', '운동', '반려동물'];

const femaleNicknames = ['봄바람', '하늘빛', '꽃향기', '수줍은미소', '따뜻한봄', '은은한향기', '새벽별', '달빛아래', '꽃잎처럼', '햇살가득', '소곤소곤', '사랑스럽게', '살랑살랑', '나비처럼', '장미한송이'];
const maleNicknames = ['산너머', '늘푸른', '든든한', '나무같은', '강처럼', '바람처럼', '고요한밤', '별빛청년', '넓은가슴', '진심으로', '부드러운', '믿음직한', '함께걸어요', '달빛남자', '가을남자'];

const bios = [
  '조용히 차 한잔 하면서 이야기 나눌 수 있는 분을 찾고 있어요.',
  '여행과 맛집 탐방을 즐깁니다. 함께 즐거운 시간 보내요.',
  '음악 들으며 드라이브 좋아해요. 소소한 일상 공유해요.',
  '등산과 운동 좋아하는 건강한 사람입니다.',
  '책 읽고 영화 보는 걸 좋아해요. 취향 맞는 분 있으면 좋겠네요.',
  '자연 속에서 힐링하는 걸 좋아합니다. 산책 같이 하실 분~',
  '요리 취미로 하고 있어요. 같이 맛있는 거 먹어요.',
  '사진 찍는 걸 좋아해서 여기저기 돌아다닙니다.',
];

async function main() {
  console.log('🌱 Seeding database...');

  const password = await bcrypt.hash('test1234', 10);

  // Create test accounts
  await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      password,
      nickname: '테스트남자',
      gender: 'male',
      birthYear: 1975,
      region: '서울',
      bio: '테스트 계정입니다.',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=test`,
      interests: JSON.stringify(['여행', '영화감상', '음악감상']),
      coins: 100,
    },
  });

  // Create 30 random members
  for (let i = 0; i < 30; i++) {
    const gender = i % 2 === 0 ? 'female' : 'male';
    const nicknames = gender === 'female' ? femaleNicknames : maleNicknames;
    const nickname = nicknames[i % nicknames.length] + (i > nicknames.length ? i : '');
    const birthYear = 1960 + Math.floor(Math.random() * 20);
    const region = regions[Math.floor(Math.random() * regions.length)];
    const userInterests = interests.sort(() => 0.5 - Math.random()).slice(0, 3);
    const bio = bios[Math.floor(Math.random() * bios.length)];
    const seed = nickname + i;

    await prisma.user.upsert({
      where: { email: `user${i}@test.com` },
      update: {},
      create: {
        email: `user${i}@test.com`,
        password,
        nickname,
        gender,
        birthYear,
        region,
        bio,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`,
        interests: JSON.stringify(userInterests),
        isOnline: Math.random() > 0.6,
        coins: Math.floor(Math.random() * 200),
      },
    });
  }

  console.log('✅ Seeding complete!');
  console.log('📧 Test account: test@test.com / test1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

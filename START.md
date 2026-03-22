# 🌸 설레임 - 설치 및 실행 가이드

## 1단계: 패키지 설치

```bash
npm install
```

## 2단계: DB 초기화 + 샘플 데이터

```bash
npx prisma db push
npm run db:seed
```

## 3단계: 개발 서버 실행

```bash
npm run dev
```

→ http://localhost:3000 접속

---

## 테스트 계정
- **이메일**: test@test.com
- **비밀번호**: test1234

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 홈 (회원 목록)
│   ├── (auth)/
│   │   ├── login/            # 로그인
│   │   └── register/         # 회원가입 (3단계)
│   ├── profile/[id]/         # 프로필 상세
│   ├── chat/                 # 실시간 채팅
│   ├── likes/                # 좋아요 목록
│   ├── mypage/               # 마이페이지
│   └── api/                  # REST API
├── components/
│   ├── MemberCard.tsx        # 회원 카드
│   ├── FilterBar.tsx         # 필터 (성별/지역/나이)
│   ├── Navbar.tsx            # PC 상단 네비
│   ├── BottomNav.tsx         # 모바일 하단 탭
│   └── providers/AuthProvider.tsx
├── lib/
│   ├── auth.ts               # JWT 인증
│   ├── prisma.ts             # DB 클라이언트
│   └── socket-client.ts      # Socket.io 클라이언트
└── types/index.ts

prisma/
├── schema.prisma             # DB 스키마
└── seed.ts                   # 샘플 데이터 (30명)

server.ts                     # Socket.io + Next.js 커스텀 서버
```

---

## 주요 기능 (Phase 1)

- ✅ 회원가입 (3단계: 계정 → 프로필 → 관심사)
- ✅ 로그인 / 로그아웃 (JWT 쿠키)
- ✅ 회원 목록 (성별/지역/나이 필터)
- ✅ 프로필 상세 페이지
- ✅ 좋아요 기능
- ✅ 실시간 1:1 채팅 (Socket.io WebSocket)
- ✅ 타이핑 인디케이터
- ✅ 읽음 확인
- ✅ 온라인 상태 표시
- ✅ 마이페이지 (프로필 편집, 받은 좋아요)
- ✅ 코인 시스템 (UI)
- ✅ 반응형 (모바일 하단 탭 / PC 상단 네비)

---

## 수익 모델 (Phase 2에서 구현 예정)

- 코인 충전 (토스페이먼츠 연동)
- 프리미엄 구독
- 채팅 코인 차감
- 프로필 부스트

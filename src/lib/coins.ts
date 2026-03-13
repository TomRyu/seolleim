export interface CoinPackage {
  id: string;
  coins: number;
  price: number;       // 원
  bonus: number;       // 보너스 코인
  label: string;
  popular?: boolean;
  best?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'coin_50',  coins: 50,   bonus: 0,   price: 1000,  label: '50 코인' },
  { id: 'coin_100', coins: 100,  bonus: 10,  price: 2000,  label: '100 코인', popular: true },
  { id: 'coin_300', coins: 300,  bonus: 50,  price: 5000,  label: '300 코인' },
  { id: 'coin_500', coins: 500,  bonus: 100, price: 8000,  label: '500 코인', best: true },
  { id: 'coin_1000',coins: 1000, bonus: 300, price: 15000, label: '1000 코인' },
];

export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  period: number;    // 일
  perMonth: number;  // 월 환산 가격
  features: string[];
  popular?: boolean;
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'monthly',
    name: '1개월',
    price: 9900,
    period: 30,
    perMonth: 9900,
    features: ['무제한 채팅', '프로필 상단 노출', '읽음 확인', '광고 제거'],
  },
  {
    id: 'quarterly',
    name: '3개월',
    price: 24900,
    period: 90,
    perMonth: 8300,
    features: ['무제한 채팅', '프로필 상단 노출', '읽음 확인', '광고 제거', '매칭 우선순위'],
    popular: true,
  },
  {
    id: 'yearly',
    name: '12개월',
    price: 79900,
    period: 365,
    perMonth: 6658,
    features: ['무제한 채팅', '프로필 상단 노출', '읽음 확인', '광고 제거', '매칭 우선순위', 'AI 매칭 무제한', '영상채팅 무제한'],
  },
];

export const COIN_COSTS = {
  SEND_MESSAGE: 1,     // 메시지 1건
  START_CHAT: 5,       // 채팅 시작
  VIEW_PROFILE: 0,     // 프로필 열람 (무료)
  BOOST_PROFILE: 50,   // 1시간 상단 노출
  VIDEO_CALL: 10,      // 영상통화 1분
  AI_MATCHING: 20,     // AI 매칭 1회
} as const;

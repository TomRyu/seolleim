import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear + 1; // 한국 나이
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function formatChatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function getAvatarUrl(avatar: string, seed: string): string {
  if (avatar && avatar.startsWith('http')) return avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export const REGIONS = [
  '전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주',
  '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export type { FilterState } from '@/types';

export const INTERESTS = [
  '영화감상', '등산', '여행', '요리', '독서', '음악감상', '낚시', '골프',
  '사진', '춤', '카페탐방', '드라이브', '미술', '운동', '반려동물', '원예',
];

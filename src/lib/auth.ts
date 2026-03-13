import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const COOKIE_NAME = 'mal_token'; // middle-age-land token

export interface JwtPayload {
  userId: string;
  email: string;
  nickname: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromCookies(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export function getCurrentUser(): JwtPayload | null {
  const token = getTokenFromCookies();
  if (!token) return null;
  return verifyToken(token);
}

export function setCookieHeader(token: string) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`;
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;

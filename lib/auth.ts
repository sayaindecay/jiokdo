import { cookies } from "next/headers";
import { findUserSession } from "./db";

const SESSION_COOKIE = "jiokdo_session";
const LEGACY_NICK_COOKIE = "jiokdo_nick"; // 기존 닉네임-only 쿠키 (점진 폐기)

export const SESSION_DURATION_MS = 30 * 24 * 3600 * 1000;

export async function getNickname(): Promise<string | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await findUserSession(token);
    if (session) return session.nickname;
  }
  // 기존 닉네임 cookie 가 남아 있을 때는 읽기 전용 fallback.
  // 새 가입을 유도해야 하므로 여기서 닉네임을 반환하되, 권한이 필요한
  // 액션 단계에서 isAuthenticated 검사를 통해 차단됩니다.
  const legacy = c.get(LEGACY_NICK_COOKIE)?.value?.trim();
  return legacy && legacy.length > 0 ? legacy : null;
}

export async function getAuthenticatedNickname(): Promise<string | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await findUserSession(token);
  return session?.nickname ?? null;
}

export async function isLegacyOnly(): Promise<boolean> {
  const c = await cookies();
  return !c.get(SESSION_COOKIE)?.value && !!c.get(LEGACY_NICK_COOKIE)?.value;
}

export async function setSessionCookie(token: string, expiresAt: number): Promise<void> {
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
    path: "/",
  });
  // 가입/로그인 시 legacy cookie 가 있으면 정리
  c.delete(LEGACY_NICK_COOKIE);
}

export async function clearAuthCookies(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  c.delete(LEGACY_NICK_COOKIE);
}

// 기존 호환 (캠페인 인라인 닉네임 폼 등)
export async function setNicknameCookie(nick: string): Promise<void> {
  const c = await cookies();
  const safe = nick.trim().slice(0, 24);
  if (!safe) return;
  c.set(LEGACY_NICK_COOKIE, safe, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

export async function clearNickname(): Promise<void> {
  await clearAuthCookies();
}

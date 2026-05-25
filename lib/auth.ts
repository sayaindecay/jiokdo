import { cookies } from "next/headers";

const NICK_COOKIE = "jiokdo_nick";

export async function getNickname(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(NICK_COOKIE)?.value;
  return v && v.trim() ? v.trim() : null;
}

export async function setNicknameCookie(nick: string): Promise<void> {
  const c = await cookies();
  const safe = nick.trim().slice(0, 24);
  if (!safe) return;
  c.set(NICK_COOKIE, safe, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

export async function clearNickname(): Promise<void> {
  const c = await cookies();
  c.delete(NICK_COOKIE);
}

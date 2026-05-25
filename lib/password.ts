import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;

export async function hashPassword(plain: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return { hash: buf.toString("hex"), salt };
}

export async function verifyPassword(
  plain: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const expected = Buffer.from(hash, "hex");
  const actual = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function validatePassword(plain: string): { ok: true } | { ok: false; reason: string } {
  if (plain.length < 6) return { ok: false, reason: "비밀번호는 최소 6자 이상이어야 합니다" };
  if (plain.length > 200) return { ok: false, reason: "비밀번호가 너무 깁니다" };
  return { ok: true };
}

export function validateNickname(nick: string): { ok: true } | { ok: false; reason: string } {
  const trimmed = nick.trim();
  if (trimmed.length < 2) return { ok: false, reason: "닉네임은 최소 2자 이상" };
  if (trimmed.length > 24) return { ok: false, reason: "닉네임은 24자 이하" };
  if (!/^[가-힣A-Za-z0-9_\- ]+$/.test(trimmed)) {
    return { ok: false, reason: "한글·영문·숫자·공백·_·- 만 사용할 수 있습니다" };
  }
  return { ok: true };
}

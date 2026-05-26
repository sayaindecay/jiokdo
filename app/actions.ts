"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { contentToSegments } from "@/lib/dice";
import { cookies } from "next/headers";
import {
  createBestiaryEntry, createCampaign, createCharacter, createPlayEntry,
  createUser, createUserSessionRecord, deleteBestiaryEntry, deleteCampaign, setCampaignStatus,
  deleteCharacter, deleteOtherUserSessions, deleteUser, deleteUserSession,
  findUser, getBestiaryEntry, getCampaign, getCampaignByCode, getCharacter,
  isBestiarySlugTaken, joinCampaign, listKeperCampaigns, touchUserLogin,
  createClue, deleteClue, setClueResolved,
  setCampaignIllustration, setCharacterPortrait,
  updateBestiaryEntry, updateCampaignProfile, updateCharacterProfile, updateCharacterVitals,
  updateUserPassword,
} from "@/lib/db";
import type { BestiaryEntry } from "@/lib/types";
import {
  clearAuthCookies, clearNickname, getAuthenticatedNickname, setNicknameCookie,
  setSessionCookie, SESSION_DURATION_MS,
} from "@/lib/auth";
import {
  generateSessionToken, hashPassword, validateNickname, validatePassword,
  verifyPassword,
} from "@/lib/password";
import { SAMPLE_CHARACTER_TEMPLATE } from "@/lib/seed-data";
import type { CocAttrs, CocSkill, CocSkillGroup, CocWeapon } from "@/lib/types";

async function requireAuthenticatedNickname(): Promise<string> {
  const nick = await getAuthenticatedNickname();
  if (!nick) throw new Error("먼저 로그인하세요");
  return nick;
}

function text(fd: FormData, key: string, max: number): string {
  const v = fd.get(key);
  return (typeof v === "string" ? v : "").trim().slice(0, max);
}
function num(fd: FormData, key: string): number {
  const v = fd.get(key);
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

// ───── 인증 (정식 가입 / 로그인) ─────

async function startSessionFor(nick: string): Promise<void> {
  const token = generateSessionToken();
  const expires = Date.now() + SESSION_DURATION_MS;
  await createUserSessionRecord({ token, nickname: nick, expires_at: expires });
  await setSessionCookie(token, expires);
  await touchUserLogin(nick);
}

export async function signupAction(fd: FormData): Promise<void> {
  const nickRaw = text(fd, "nickname", 32);
  const nickCheck = validateNickname(nickRaw);
  if (!nickCheck.ok) throw new Error(nickCheck.reason);
  const password = text(fd, "password", 200);
  const pwCheck = validatePassword(password);
  if (!pwCheck.ok) throw new Error(pwCheck.reason);

  const existing = await findUser(nickRaw);
  if (existing) {
    throw new Error("이미 사용 중인 닉네임입니다. 로그인하세요.");
  }

  const { hash, salt } = await hashPassword(password);
  await createUser({ nickname: nickRaw, password_hash: hash, password_salt: salt });
  await startSessionFor(nickRaw);

  const redirectTo = text(fd, "redirect", 200);
  redirect(redirectTo || "/campaigns");
}

export async function loginAction(fd: FormData): Promise<void> {
  const nickRaw = text(fd, "nickname", 32);
  const password = text(fd, "password", 200);
  if (!nickRaw || !password) throw new Error("닉네임과 비밀번호를 입력하세요");

  const user = await findUser(nickRaw);
  if (!user) throw new Error("닉네임 또는 비밀번호가 올바르지 않습니다");
  const ok = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) throw new Error("닉네임 또는 비밀번호가 올바르지 않습니다");

  await startSessionFor(user.nickname);
  const redirectTo = text(fd, "redirect", 200);
  redirect(redirectTo || "/campaigns");
}

export async function changePasswordAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const current = text(fd, "current_password", 200);
  const next = text(fd, "new_password", 200);
  if (!current || !next) throw new Error("현재/새 비밀번호를 모두 입력하세요");
  if (current === next) throw new Error("새 비밀번호가 현재와 같습니다");
  const pwCheck = validatePassword(next);
  if (!pwCheck.ok) throw new Error(pwCheck.reason);

  const user = await findUser(nick);
  if (!user) throw new Error("계정을 찾을 수 없습니다");
  const ok = await verifyPassword(current, user.password_hash, user.password_salt);
  if (!ok) throw new Error("현재 비밀번호가 올바르지 않습니다");

  const { hash, salt } = await hashPassword(next);
  await updateUserPassword(nick, hash, salt);

  // 다른 디바이스/세션 자동 로그아웃
  const c = await cookies();
  const currentToken = c.get("jiokdo_session")?.value;
  if (currentToken) await deleteOtherUserSessions(nick, currentToken);

  revalidatePath("/account");
  redirect("/account?changed=password");
}

export async function deleteAccountAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const password = text(fd, "password", 200);
  const confirmNick = text(fd, "confirm_nickname", 32);
  if (confirmNick !== nick) throw new Error("닉네임 확인이 일치하지 않습니다");

  const user = await findUser(nick);
  if (!user) throw new Error("계정을 찾을 수 없습니다");
  const ok = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) throw new Error("비밀번호가 올바르지 않습니다");

  // 키퍼 캠페인이 남아 있으면 차단 (협업자 데이터 보호)
  const owned = await listKeperCampaigns(nick);
  if (owned.length > 0) {
    throw new Error(
      `키퍼로 있는 캠페인 ${owned.length}개를 먼저 정리해야 합니다 (대시보드의 위험 영역에서 삭제).`
    );
  }

  const removed = await deleteUser(nick);
  if (!removed) throw new Error("계정 삭제에 실패했습니다");
  await clearAuthCookies();
  redirect("/?bye=1");
}

export async function logoutAction(): Promise<void> {
  const c = await cookies();
  const token = c.get("jiokdo_session")?.value;
  if (token) await deleteUserSession(token);
  await clearAuthCookies();
  redirect("/");
}

// 기존 호환 (legacy nickname-only cookie). 새 가입 권장이지만 인라인 폼은 유지.
export async function setNicknameAction(fd: FormData): Promise<void> {
  const nick = text(fd, "nickname", 24);
  if (!nick) return;
  await setNicknameCookie(nick);
  const redirectTo = text(fd, "redirect", 200);
  if (redirectTo) redirect(redirectTo);
}

export async function clearNicknameAction(): Promise<void> {
  await clearNickname();
  redirect("/");
}

export async function createCampaignAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const name = text(fd, "name", 80);
  const description = text(fd, "description", 600);
  if (!name) throw new Error("캠페인 이름을 입력하세요");
  const c = await createCampaign({ name, description, keeper_nick: nick });
  revalidatePath("/campaigns");
  redirect(`/campaigns/${c.id}`);
}

export async function joinCampaignAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const code = text(fd, "code", 16).toUpperCase();
  if (!code) throw new Error("초대 코드를 입력하세요");
  const c = await getCampaignByCode(code);
  if (!c) throw new Error("초대 코드를 찾을 수 없습니다");
  await joinCampaign(c.id, nick);
  revalidatePath("/campaigns");
  redirect(`/campaigns/${c.id}`);
}

export async function createCharacterAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const campaign_id = num(fd, "campaign_id");
  const camp = await getCampaign(campaign_id);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");

  const mode = text(fd, "use_template", 12); // "1" sample | "random" | "" empty

  // 능력치 굴림으로 생성 (CoC 7판: STR/CON/DEX/APP/POW = 3d6×5, SIZ/INT/EDU = (2d6+6)×5)
  if (mode === "random") {
    const d6 = () => Math.floor(Math.random() * 6) + 1;
    const r3d6x5 = () => (d6() + d6() + d6()) * 5;
    const r2d6p6x5 = () => (d6() + d6() + 6) * 5;
    const attrs: CocAttrs = {
      str: r3d6x5(), con: r3d6x5(), dex: r3d6x5(), app: r3d6x5(), pow: r3d6x5(),
      siz: r2d6p6x5(), int: r2d6p6x5(), edu: r2d6p6x5(),
      luck: r3d6x5(),
    };
    const hp = Math.floor((attrs.con + attrs.siz) / 10);
    const mp = Math.floor(attrs.pow / 5);
    const eduX2 = Math.floor(attrs.edu / 2);
    const intX2 = Math.floor(attrs.int / 2);
    const skills: CocSkill[] = [
      { name: "탐색", value: 25, group: "investigation" },
      { name: "회피", value: Math.floor(attrs.dex / 2), group: "combat" },
      { name: "도서관 이용", value: 20, group: "investigation" },
      { name: "심리학", value: 10, group: "social" },
      { name: "청각", value: 20, group: "investigation" },
      { name: "관찰력", value: 25, group: "investigation" },
      { name: "은밀행동", value: 20, group: "investigation" },
      { name: "응급처치", value: 30, group: "academic" },
      { name: "근접 (격투)", value: 25, group: "combat" },
      { name: "권총", value: 20, group: "combat" },
      { name: "설득", value: 10, group: "social" },
      { name: "매혹", value: 15, group: "social" },
      { name: "모국어", value: eduX2, group: "academic" },
      { name: "지식 (개인)", value: intX2, group: "academic" },
    ];
    const id = await createCharacter({
      campaign_id,
      owner_nick: nick,
      name: text(fd, "name", 40) || "이름 없는 탐사자",
      occupation: text(fd, "occupation", 40) || "탐사자",
      age: 25,
      attrs,
      hp, hp_max: hp,
      mp, mp_max: mp,
      san: attrs.pow, san_max: 99 - 0,
      skills,
      weapons: [{ name: "주먹", skill: 50, damage: "1d3 + DB" }],
      backstory: "",
    });
    revalidatePath(`/campaigns/${campaign_id}`);
    redirect(`/characters/${id}`);
  }

  const useTemplate = mode === "1";
  if (useTemplate) {
    const id = await createCharacter({
      campaign_id,
      owner_nick: nick,
      name: text(fd, "name", 40) || SAMPLE_CHARACTER_TEMPLATE.name,
      occupation: SAMPLE_CHARACTER_TEMPLATE.occupation,
      age: SAMPLE_CHARACTER_TEMPLATE.age,
      attrs: SAMPLE_CHARACTER_TEMPLATE.attrs as CocAttrs,
      hp: SAMPLE_CHARACTER_TEMPLATE.hp, hp_max: SAMPLE_CHARACTER_TEMPLATE.hp_max,
      mp: SAMPLE_CHARACTER_TEMPLATE.mp, mp_max: SAMPLE_CHARACTER_TEMPLATE.mp_max,
      san: SAMPLE_CHARACTER_TEMPLATE.san, san_max: SAMPLE_CHARACTER_TEMPLATE.san_max,
      skills: SAMPLE_CHARACTER_TEMPLATE.skills as CocSkill[],
      weapons: SAMPLE_CHARACTER_TEMPLATE.weapons as CocWeapon[],
      backstory: SAMPLE_CHARACTER_TEMPLATE.backstory,
    });
    revalidatePath(`/campaigns/${campaign_id}`);
    redirect(`/characters/${id}`);
  }

  // 빈 캐릭터 생성
  const attrs: CocAttrs = {
    str: 50, con: 50, siz: 50, dex: 50, app: 50,
    int: 50, pow: 50, edu: 50, luck: 50,
  };
  const id = await createCharacter({
    campaign_id,
    owner_nick: nick,
    name: text(fd, "name", 40) || "이름 없는 탐사자",
    occupation: text(fd, "occupation", 40),
    age: 25,
    attrs,
    hp: 10, hp_max: 10,
    mp: 10, mp_max: 10,
    san: 50, san_max: 99,
    skills: [
      { name: "탐색", value: 25 }, { name: "회피", value: 25 },
      { name: "도서관 이용", value: 20 }, { name: "심리학", value: 10 },
    ],
    weapons: [{ name: "주먹", skill: 50, damage: "1d3 + DB" }],
    backstory: "",
  });
  revalidatePath(`/campaigns/${campaign_id}`);
  redirect(`/characters/${id}`);
}

export async function rollGenericAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const characterId = num(fd, "character_id");
  const ch = await getCharacter(characterId);
  if (!ch) throw new Error("캐릭터를 찾을 수 없습니다");
  if (ch.owner_nick !== nick) throw new Error("자신의 캐릭터만 굴릴 수 있습니다");
  const expression = text(fd, "expression", 60);
  if (!expression) throw new Error("굴림 식을 입력하세요");

  // /roll 형태로 명령화 → contentToSegments 가 NdM[±K] 파싱
  const sanitized = expression.replace(/[^0-9dD+\-x* ]/g, "");
  const line = `/roll ${sanitized}`;
  const segments = contentToSegments(line);
  if (segments.length === 0 || !segments.some((s) => s.type === "dice")) {
    throw new Error(`굴림 식을 인식할 수 없습니다: ${expression}`);
  }
  await createPlayEntry({
    campaign_id: ch.campaign_id,
    nickname: nick,
    character_id: ch.id,
    kind: "dialogue",
    segments,
  });
  revalidatePath(`/characters/${ch.id}`);
}

export async function rollCharacterCheckAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const characterId = num(fd, "character_id");
  const ch = await getCharacter(characterId);
  if (!ch) throw new Error("캐릭터를 찾을 수 없습니다");

  const kind = text(fd, "roll_kind", 12); // "cc" | "roll"
  const skillName = text(fd, "skill_name", 40);
  const skillValue = num(fd, "skill_value");
  const expression = text(fd, "expression", 40);

  let line: string;
  if (kind === "cc" && skillName && skillValue) {
    line = `/cc ${skillName} ${skillValue}`;
  } else if (kind === "cc" && skillValue) {
    line = `/cc ${skillValue}`;
  } else if (expression) {
    line = `/${expression.startsWith("roll") ? expression : "roll " + expression}`;
  } else {
    throw new Error("굴림 정보가 없습니다");
  }

  const segments = contentToSegments(line);
  await createPlayEntry({
    campaign_id: ch.campaign_id,
    nickname: nick,
    character_id: ch.id,
    kind: "dialogue",
    segments,
  });
  revalidatePath(`/characters/${ch.id}`);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

const ATTR_KEYS: (keyof CocAttrs)[] = [
  "str", "con", "siz", "dex", "app", "int", "pow", "edu", "luck",
];

export async function updateCharacterProfileAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "character_id");
  const ch = await getCharacter(id);
  if (!ch) throw new Error("캐릭터를 찾을 수 없습니다");
  if (ch.owner_nick !== nick) throw new Error("자신의 캐릭터만 수정할 수 있습니다");

  const name = (text(fd, "name", 40) || ch.name).slice(0, 40);
  if (!name.trim()) throw new Error("이름을 입력하세요");
  const occupation = text(fd, "occupation", 40);
  const ageRaw = text(fd, "age", 4);
  const age = ageRaw ? clamp(Number(ageRaw), 1, 120) : ch.age;
  const backstory = text(fd, "backstory", 2000);

  // 능력치 — 폼에서 attr_<key> 로 받음. 누락 시 기존값 유지.
  const attrs = { ...ch.attrs };
  for (const k of ATTR_KEYS) {
    const raw = text(fd, `attr_${k}`, 4);
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n)) attrs[k] = clamp(n, 1, 100);
    }
  }

  // 최대치
  const hp_max = clamp(num(fd, "hp_max") || ch.hp_max, 1, 999);
  const mp_max = clamp(num(fd, "mp_max") || ch.mp_max, 1, 999);
  const san_max = clamp(num(fd, "san_max") || ch.san_max, 1, 99);

  // Skills JSON payload (동적 추가/삭제 포함)
  const skillsJsonRaw = text(fd, "skills_json", 12000);
  let skills: CocSkill[] = ch.skills;
  if (skillsJsonRaw) {
    try {
      const parsed = JSON.parse(skillsJsonRaw) as Array<{
        name?: string; value?: number; used?: boolean; group?: string;
      }>;
      if (!Array.isArray(parsed)) throw new Error("skills_json 형식 오류");
      skills = parsed
        .map((s) => ({
          name: String(s.name ?? "").trim().slice(0, 40),
          value: clamp(Number(s.value ?? 0), 0, 99),
          used: !!s.used,
          group: (s.group as CocSkillGroup | undefined) ?? "other",
        }))
        .filter((s) => s.name.length > 0);
    } catch {
      throw new Error("기능치 데이터를 처리할 수 없습니다");
    }
  }

  // Weapons JSON payload
  const weaponsJsonRaw = text(fd, "weapons_json", 12000);
  let weapons: CocWeapon[] | undefined;
  if (weaponsJsonRaw) {
    try {
      const parsed = JSON.parse(weaponsJsonRaw) as Array<{
        name?: string; skill?: number; damage?: string; range?: string; attacks?: string;
      }>;
      if (!Array.isArray(parsed)) throw new Error("weapons_json 형식 오류");
      weapons = parsed
        .map((w) => ({
          name: String(w.name ?? "").trim().slice(0, 60),
          skill: clamp(Number(w.skill ?? 0), 0, 99),
          damage: String(w.damage ?? "").trim().slice(0, 60),
          range: w.range ? String(w.range).trim().slice(0, 40) : undefined,
          attacks: w.attacks ? String(w.attacks).trim().slice(0, 20) : undefined,
        }))
        .filter((w) => w.name.length > 0);
    } catch {
      throw new Error("무기 데이터를 처리할 수 없습니다");
    }
  }

  await updateCharacterProfile(id, {
    name, occupation, age, backstory, skills, weapons,
    attrs, hp_max, mp_max, san_max,
  });
  revalidatePath(`/characters/${id}`);
  redirect(`/characters/${id}`);
}

export async function createClueAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "campaign_id");
  const camp = await getCampaign(id);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");
  if (camp.keeper_nick !== nick) throw new Error("키퍼만 단서를 추가할 수 있습니다");
  const title = text(fd, "title", 120);
  if (!title) throw new Error("제목을 입력하세요");
  const body = text(fd, "body", 1200);
  await createClue({ campaign_id: id, title, body });
  revalidatePath(`/campaigns/${id}/play`);
  revalidatePath(`/campaigns/${id}/scene`);
  revalidatePath(`/campaigns/${id}`);
}

export async function toggleClueAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const campaignId = num(fd, "campaign_id");
  const clueId = num(fd, "clue_id");
  const resolved = fd.get("resolved") === "1";
  const camp = await getCampaign(campaignId);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");
  if (camp.keeper_nick !== nick) throw new Error("키퍼만 단서를 수정할 수 있습니다");
  await setClueResolved(clueId, resolved);
  revalidatePath(`/campaigns/${campaignId}/play`);
  revalidatePath(`/campaigns/${campaignId}/scene`);
}

export async function deleteClueAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const campaignId = num(fd, "campaign_id");
  const clueId = num(fd, "clue_id");
  const camp = await getCampaign(campaignId);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");
  if (camp.keeper_nick !== nick) throw new Error("키퍼만 단서를 삭제할 수 있습니다");
  await deleteClue(clueId);
  revalidatePath(`/campaigns/${campaignId}/play`);
  revalidatePath(`/campaigns/${campaignId}/scene`);
}

export async function setCharacterPortraitAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "character_id");
  const ch = await getCharacter(id);
  if (!ch) throw new Error("캐릭터를 찾을 수 없습니다");
  if (ch.owner_nick !== nick) {
    throw new Error("본인 캐릭터만 프로필 사진을 변경할 수 있습니다");
  }
  const raw = (fd.get("portrait_url") as string | null) ?? "";
  const trimmed = raw.trim();

  if (!trimmed) {
    await setCharacterPortrait(id, nick, null);
    revalidatePath(`/characters/${id}`);
    return;
  }

  if (trimmed.length > 1_400_000) {
    throw new Error("이미지가 너무 큽니다. 1MB 이하로 줄여 주세요.");
  }

  const isHttps = /^https?:\/\//i.test(trimmed);
  const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed);
  if (!isHttps && !isDataImage) {
    throw new Error("이미지 URL 또는 업로드한 이미지만 허용됩니다.");
  }

  await setCharacterPortrait(id, nick, trimmed);
  revalidatePath(`/characters/${id}`);
}

export async function setCampaignIllustrationAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "campaign_id");
  const camp = await getCampaign(id);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");
  if (camp.keeper_nick !== nick) {
    throw new Error("키퍼만 장면 일러스트를 변경할 수 있습니다");
  }
  const raw = (fd.get("illustration_url") as string | null) ?? "";
  const trimmed = raw.trim();

  // 빈 값이면 해제
  if (!trimmed) {
    await setCampaignIllustration(id, nick, null);
    revalidatePath(`/campaigns/${id}/play`);
    revalidatePath(`/campaigns/${id}/scene`);
    return;
  }

  // 1MB(약 750KB 원본) 이상의 데이터 URL 거부 — DB 행 크기 보호
  if (trimmed.length > 1_400_000) {
    throw new Error("이미지가 너무 큽니다. 1MB 이하로 줄여 주세요.");
  }

  // 허용 형식: 외부 https URL 또는 data:image/* base64
  const isHttps = /^https?:\/\//i.test(trimmed);
  const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed);
  if (!isHttps && !isDataImage) {
    throw new Error("이미지 URL 또는 업로드한 이미지만 허용됩니다.");
  }

  await setCampaignIllustration(id, nick, trimmed);
  revalidatePath(`/campaigns/${id}/play`);
  revalidatePath(`/campaigns/${id}/scene`);
}

export async function updateCampaignProfileAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "campaign_id");
  const camp = await getCampaign(id);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");
  if (camp.keeper_nick !== nick) {
    throw new Error("키퍼만 캠페인 정보를 수정할 수 있습니다");
  }
  const name = text(fd, "name", 80);
  if (!name) throw new Error("캠페인 이름은 비울 수 없습니다");
  const description = text(fd, "description", 600);
  const ok = await updateCampaignProfile(id, nick, { name, description });
  if (!ok) throw new Error("수정에 실패했습니다");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
}

export async function setCampaignStatusAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "campaign_id");
  const camp = await getCampaign(id);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");
  if (camp.keeper_nick !== nick) {
    throw new Error("키퍼만 상태를 변경할 수 있습니다");
  }
  const statusRaw = text(fd, "status", 16);
  if (statusRaw !== "active" && statusRaw !== "dormant" && statusRaw !== "closed") {
    throw new Error("올바르지 않은 상태입니다");
  }
  const ok = await setCampaignStatus(id, nick, statusRaw);
  if (!ok) throw new Error("상태 변경에 실패했습니다");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
}

export async function deleteCampaignAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "campaign_id");
  const camp = await getCampaign(id);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");
  if (camp.keeper_nick !== nick) {
    throw new Error("키퍼만 캠페인을 삭제할 수 있습니다");
  }
  const confirmName = text(fd, "confirm_name", 80);
  if (confirmName !== camp.name) {
    throw new Error("확인을 위해 캠페인 이름을 정확히 입력하세요");
  }
  const ok = await deleteCampaign(id, nick);
  if (!ok) throw new Error("삭제에 실패했습니다");
  revalidatePath("/campaigns");
  redirect("/campaigns");
}

export async function deleteCharacterAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "character_id");
  const ch = await getCharacter(id);
  if (!ch) throw new Error("캐릭터를 찾을 수 없습니다");
  if (ch.owner_nick !== nick) throw new Error("자신의 캐릭터만 삭제할 수 있습니다");
  const confirmName = text(fd, "confirm_name", 40);
  if (confirmName !== ch.name) {
    throw new Error("확인을 위해 캐릭터 이름을 정확히 입력하세요");
  }
  const ok = await deleteCharacter(id, nick);
  if (!ok) throw new Error("삭제에 실패했습니다");
  revalidatePath(`/campaigns/${ch.campaign_id}`);
  redirect(`/campaigns/${ch.campaign_id}`);
}

export async function updateCharacterVitalsAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "character_id");
  const ch = await getCharacter(id);
  if (!ch) throw new Error("캐릭터를 찾을 수 없습니다");
  if (ch.owner_nick !== nick) throw new Error("자신의 캐릭터만 수정할 수 있습니다");
  await updateCharacterVitals(id, {
    hp: Math.max(0, Math.min(ch.hp_max, num(fd, "hp"))),
    mp: Math.max(0, Math.min(ch.mp_max, num(fd, "mp"))),
    san: Math.max(0, Math.min(ch.san_max, num(fd, "san"))),
  });
  revalidatePath(`/characters/${id}`);
}

// ───── 베스티어리 ─────

function slugify(name: string): string {
  // ASCII-only 슬러그 — 동적 라우트가 비-ASCII 문자에서 인코딩 라운드트립 실패하던
  // 문제 회피. 한글 등은 모두 제거하고, 남는 게 없으면 이름 해시로 폴백.
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  if (ascii) return ascii;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash * 31) + name.charCodeAt(i)) | 0;
  }
  return `m-${(Math.abs(hash) || 1).toString(36)}`;
}

function parseBestiaryFormData(fd: FormData): {
  name: string;
  category: string;
  description: string;
  attrs: BestiaryEntry["attrs"];
  attacks: BestiaryEntry["attacks"];
  sanity_loss: string;
  source: string;
  image_url: string | null;
} {
  const name = text(fd, "name", 80);
  if (!name) throw new Error("이름을 입력하세요");
  const category = text(fd, "category", 80);
  const description = text(fd, "description", 2000);
  const sanity_loss = text(fd, "sanity_loss", 24);
  const source = text(fd, "source", 80) || "사용자 등록";

  // 이미지: 빈값이면 null, https URL 또는 data:image base64 만 허용 (1.4MB 이하)
  const rawImg = ((fd.get("image_url") as string | null) ?? "").trim();
  let image_url: string | null = null;
  if (rawImg) {
    if (rawImg.length > 1_400_000) {
      throw new Error("이미지가 너무 큽니다. 1MB 이하로 줄여 주세요.");
    }
    const isHttps = /^https?:\/\//i.test(rawImg);
    const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(rawImg);
    if (!isHttps && !isDataImage) {
      throw new Error("이미지 URL 또는 업로드한 이미지만 허용됩니다.");
    }
    image_url = rawImg;
  }

  const attrs: BestiaryEntry["attrs"] = {};
  const intKeys = ["str", "con", "siz", "dex", "int", "pow", "app", "edu", "hp", "build"] as const;
  for (const k of intKeys) {
    const raw = text(fd, `attr_${k}`, 6);
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n)) (attrs as Record<string, number>)[k] = n;
    }
  }
  const move = text(fd, "attr_move", 16);
  if (move) attrs.move = move;
  const db_str = text(fd, "attr_damage_bonus", 24);
  if (db_str) attrs.damage_bonus = db_str;

  // attacks: 최대 5개
  const attacks: BestiaryEntry["attacks"] = [];
  for (let i = 0; i < 5; i++) {
    const an = text(fd, `attack_${i}_name`, 60);
    if (!an) continue;
    const skillRaw = text(fd, `attack_${i}_skill`, 4);
    const skill = Number(skillRaw);
    const damage = text(fd, `attack_${i}_damage`, 80);
    const note = text(fd, `attack_${i}_note`, 120);
    if (an && Number.isFinite(skill)) {
      attacks.push({ name: an, skill, damage, note: note || undefined });
    }
  }

  return { name, category, description, attrs, attacks, sanity_loss, source, image_url };
}

export async function createBestiaryAction(fd: FormData): Promise<{ slug: string }> {
  try {
    const nick = await requireAuthenticatedNickname();
    const parsed = parseBestiaryFormData(fd);
    if (!parsed.category) throw new Error("카테고리를 선택하거나 입력하세요");
    if (parsed.attacks.length === 0) {
      throw new Error("최소 1개 이상의 공격 정보를 입력하세요 (이름·명중%·피해)");
    }
    const base = slugify(parsed.name);
    let slug = base || `m-${Date.now()}`;
    for (let i = 2; i < 20; i++) {
      if (!(await isBestiarySlugTaken(slug))) break;
      slug = base ? `${base}-${i}` : `m-${Date.now()}-${i}`;
    }
    await createBestiaryEntry({ ...parsed, slug, created_by: nick });
    revalidatePath("/bestiary");
    revalidatePath(`/bestiary/${slug}`);
    return { slug };
  } catch (e) {
    console.error("[createBestiaryAction] failed", e);
    throw e;
  }
}

export async function updateBestiaryAction(fd: FormData): Promise<{ slug: string }> {
  const nick = await requireAuthenticatedNickname();
  const slug = text(fd, "slug", 80);
  const existing = await getBestiaryEntry(slug);
  if (!existing) throw new Error("항목을 찾을 수 없습니다");
  if (existing.created_by !== nick) {
    throw new Error("본인이 등록한 항목만 편집할 수 있습니다");
  }
  const parsed = parseBestiaryFormData(fd);
  await updateBestiaryEntry(slug, parsed);
  revalidatePath("/bestiary");
  revalidatePath(`/bestiary/${slug}`);
  return { slug };
}

export async function deleteBestiaryAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const slug = text(fd, "slug", 80);
  const existing = await getBestiaryEntry(slug);
  if (!existing) throw new Error("항목을 찾을 수 없습니다");
  if (existing.created_by !== nick) {
    throw new Error("본인이 등록한 항목만 삭제할 수 있습니다");
  }
  const confirmName = text(fd, "confirm_name", 80);
  if (confirmName !== existing.name) {
    throw new Error("확인을 위해 이름을 정확히 입력하세요");
  }
  await deleteBestiaryEntry(slug);
  revalidatePath("/bestiary");
  redirect("/bestiary");
}

export async function postPlayEntryAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const campaign_id = num(fd, "campaign_id");
  const character_id_raw = fd.get("character_id");
  const character_id = character_id_raw && character_id_raw !== "" ? Number(character_id_raw) : null;
  const content = text(fd, "content", 8000);
  if (!content) throw new Error("내용을 입력하세요");
  const kindRaw = text(fd, "kind", 12);
  const kind = kindRaw === "narration" ? "narration"
             : kindRaw === "system" ? "system"
             : "dialogue";
  const segments = contentToSegments(content);
  await createPlayEntry({ campaign_id, nickname: nick, character_id, kind, segments });
  revalidatePath(`/campaigns/${campaign_id}/play`);
}

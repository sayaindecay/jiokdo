"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { contentToSegments } from "@/lib/dice";
import { cookies } from "next/headers";
import {
  createCampaign, createCharacter, createPlayEntry, createUser, createUserSessionRecord,
  deleteCampaign, deleteCharacter, deleteOtherUserSessions, deleteUser, deleteUserSession,
  findUser, getCampaign, getCampaignByCode, getCharacter, joinCampaign,
  listKeperCampaigns, touchUserLogin, updateCharacterProfile, updateCharacterVitals,
  updateUserPassword,
} from "@/lib/db";
import {
  clearAuthCookies, clearNickname, getAuthenticatedNickname, setNicknameCookie,
  setSessionCookie, SESSION_DURATION_MS,
} from "@/lib/auth";
import {
  generateSessionToken, hashPassword, validateNickname, validatePassword,
  verifyPassword,
} from "@/lib/password";
import { SAMPLE_CHARACTER_TEMPLATE } from "@/lib/seed-data";
import type { CocAttrs, CocSkill, CocWeapon } from "@/lib/types";

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

export async function updateCharacterProfileAction(fd: FormData): Promise<void> {
  const nick = await requireAuthenticatedNickname();
  const id = num(fd, "character_id");
  const ch = await getCharacter(id);
  if (!ch) throw new Error("캐릭터를 찾을 수 없습니다");
  if (ch.owner_nick !== nick) throw new Error("자신의 캐릭터만 수정할 수 있습니다");

  const name = text(fd, "name", 40) || ch.name;
  const occupation = text(fd, "occupation", 40);
  const ageRaw = text(fd, "age", 4);
  const age = ageRaw ? Math.max(1, Math.min(120, Number(ageRaw))) : ch.age;
  const backstory = text(fd, "backstory", 2000);

  // 기존 skills 를 기준으로 폼의 값으로 덮어씀
  const skills: typeof ch.skills = ch.skills.map((s) => {
    const v = fd.get(`skill_${s.name}`);
    const parsed = typeof v === "string" ? Number(v) : Number.NaN;
    return {
      ...s,
      value: Number.isFinite(parsed) ? Math.max(0, Math.min(99, parsed)) : s.value,
    };
  });

  // 새 기능 추가 (이름 + 값)
  const newName = text(fd, "new_skill_name", 40);
  const newValueStr = text(fd, "new_skill_value", 4);
  if (newName && newValueStr) {
    const parsed = Number(newValueStr);
    if (Number.isFinite(parsed) && parsed > 0) {
      skills.push({
        name: newName,
        value: Math.max(0, Math.min(99, parsed)),
        group: "other",
      });
    }
  }

  await updateCharacterProfile(id, { name, occupation, age, backstory, skills });
  revalidatePath(`/characters/${id}`);
  redirect(`/characters/${id}`);
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

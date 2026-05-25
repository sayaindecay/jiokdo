"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { contentToSegments } from "@/lib/dice";
import {
  createCampaign, createCharacter, createPlayEntry, getCampaign,
  getCampaignByCode, getCharacter, joinCampaign, updateCharacterVitals,
} from "@/lib/db";
import { clearNickname, getNickname, setNicknameCookie } from "@/lib/auth";
import { SAMPLE_CHARACTER_TEMPLATE } from "@/lib/seed-data";
import type { CocAttrs, CocSkill, CocWeapon } from "@/lib/types";

function text(fd: FormData, key: string, max: number): string {
  const v = fd.get(key);
  return (typeof v === "string" ? v : "").trim().slice(0, max);
}
function num(fd: FormData, key: string): number {
  const v = fd.get(key);
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

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
  const nick = await getNickname();
  if (!nick) throw new Error("닉네임을 먼저 설정하세요");
  const name = text(fd, "name", 80);
  const description = text(fd, "description", 600);
  if (!name) throw new Error("캠페인 이름을 입력하세요");
  const c = await createCampaign({ name, description, keeper_nick: nick });
  revalidatePath("/campaigns");
  redirect(`/campaigns/${c.id}`);
}

export async function joinCampaignAction(fd: FormData): Promise<void> {
  const nick = await getNickname();
  if (!nick) throw new Error("닉네임을 먼저 설정하세요");
  const code = text(fd, "code", 16).toUpperCase();
  if (!code) throw new Error("초대 코드를 입력하세요");
  const c = await getCampaignByCode(code);
  if (!c) throw new Error("초대 코드를 찾을 수 없습니다");
  await joinCampaign(c.id, nick);
  revalidatePath("/campaigns");
  redirect(`/campaigns/${c.id}`);
}

export async function createCharacterAction(fd: FormData): Promise<void> {
  const nick = await getNickname();
  if (!nick) throw new Error("닉네임을 먼저 설정하세요");
  const campaign_id = num(fd, "campaign_id");
  const camp = await getCampaign(campaign_id);
  if (!camp) throw new Error("캠페인을 찾을 수 없습니다");

  const useTemplate = fd.get("use_template") === "1";
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
  const nick = await getNickname();
  if (!nick) throw new Error("닉네임을 먼저 설정하세요");
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

export async function updateCharacterVitalsAction(fd: FormData): Promise<void> {
  const nick = await getNickname();
  if (!nick) throw new Error("닉네임을 먼저 설정하세요");
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
  const nick = await getNickname();
  if (!nick) throw new Error("닉네임을 먼저 설정하세요");
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

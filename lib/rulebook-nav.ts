import type { RuleSection } from "./types";
import type { WikiNavItem } from "@/components/vtt/WikiLayout";

const GROUP_MAP: Record<string, string> = {
  intro: "기본",
  "character-creation": "기본",
  checks: "판정",
  combat: "판정",
  sanity: "판정",
};

const NUMBER_MAP: Record<string, string> = {
  intro: "1",
  "character-creation": "2",
  checks: "3",
  combat: "4",
  sanity: "5",
};

export function buildRulebookNav(sections: RuleSection[]): WikiNavItem[] {
  return sections.map((s) => ({
    slug: s.slug,
    title: `${NUMBER_MAP[s.slug] ?? "·"}. ${s.title}`,
    group: GROUP_MAP[s.slug] ?? "기타",
  }));
}

export function sectionMetaLine(slug: string, body: string): string[] {
  const minutes = Math.max(1, Math.round(body.length / 600));
  const num = NUMBER_MAP[slug] ?? "·";
  return [`§${num}`, `읽기 약 ${minutes}분`];
}

export function relatedCommandsFor(slug: string): string[] {
  if (slug === "checks") return ["/cc 기능명 60", "/cc 도서관 75", "/roll 1d100"];
  if (slug === "combat") return ["/cc 회피 50", "/cc 권총 55", "/roll 1d10+1"];
  if (slug === "sanity") return ["/cc 이성 70", "/roll 1d6", "/roll 1d20"];
  if (slug === "character-creation") return ["/roll 3d6", "/roll 2d6+6"];
  return ["/cc 기능명 60", "/roll 1d100"];
}

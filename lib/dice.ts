import type { CocResult, DiceLevel, DiceResult, RollResult, Segment } from "./types";

// 라인 전체를 다이스 명령으로 보는 패턴 (하위 호환용 — isDiceCommand)
const ROLL_FULL_RE = /^\/(?:roll|r)\s+(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\s*$/i;
const CC_FULL_RE = /^\/cc\s+(?:(.+?)\s+)?(\d+)\s*$/i;

// 라인의 끝부분에 다이스 명령이 붙은 경우 (앞에 텍스트가 있어도 OK)
// "도서관에서 책을 찾아본다 /cc 도서관 60" → text + dice
// "/roll 1d6+2"                              → dice only
const ROLL_TRAIL_RE = /^(.*?)\s*\/(?:roll|r)\s+(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\s*$/i;
const CC_TRAIL_RE = /^(.*?)\s*\/cc\s+(?:(.+?)\s+)?(\d+)\s*$/i;

function rollDie(sides: number): number {
  if (sides < 1) return 1;
  return Math.floor(Math.random() * sides) + 1;
}

export function judgeCoc(roll: number, skill: number): DiceLevel {
  if (roll === 1) return "critical";
  const fumbleFloor = skill < 50 ? 96 : 100;
  if (roll >= fumbleFloor) return "fumble";
  if (roll <= Math.floor(skill / 5)) return "extreme";
  if (roll <= Math.floor(skill / 2)) return "hard";
  if (roll <= skill) return "regular";
  return "fail";
}

function buildRollResult(
  count: number,
  sides: number,
  modSign: "+" | "-" | undefined,
  modNumStr: string | undefined,
): RollResult | null {
  const c = Math.min(count, 100);
  const s = Math.min(sides, 1000);
  if (c < 1 || s < 1) return null;
  const sign = modSign === "-" ? -1 : 1;
  const modifier = modNumStr ? sign * parseInt(modNumStr, 10) : 0;
  const dice: number[] = [];
  for (let i = 0; i < c; i++) dice.push(rollDie(s));
  const total = dice.reduce((a, b) => a + b, 0) + modifier;
  const notation =
    `${c}d${s}` +
    (modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`);
  return {
    kind: "roll",
    expression: `/roll ${notation}`,
    notation, dice, modifier, total,
  };
}

function buildCcResult(name: string | undefined, skill: number): CocResult | null {
  if (skill < 1 || skill > 100) return null;
  const roll = rollDie(100);
  return {
    kind: "cc",
    expression: name ? `/cc ${name} ${skill}` : `/cc ${skill}`,
    name: name?.trim() || undefined,
    skill,
    roll,
    level: judgeCoc(roll, skill),
  };
}

/**
 * 한 줄에서 다이스 명령을 찾아 추출. 결과:
 *  - { text: "..." } — 다이스 명령 없음
 *  - { dice: ... }   — 다이스 명령만
 *  - { text, dice }  — 텍스트 + 인라인 다이스 명령
 */
function parseLine(line: string): { text?: string; dice?: DiceResult } {
  // /roll | /r 인라인 매칭
  let m = line.match(ROLL_TRAIL_RE);
  if (m) {
    const leading = m[1].trim();
    const result = buildRollResult(
      parseInt(m[2], 10), parseInt(m[3], 10),
      m[4] as "+" | "-" | undefined, m[5],
    );
    if (result) return { text: leading || undefined, dice: result };
  }
  // /cc 인라인 매칭
  m = line.match(CC_TRAIL_RE);
  if (m) {
    const leading = m[1].trim();
    const result = buildCcResult(m[2], parseInt(m[3], 10));
    if (result) return { text: leading || undefined, dice: result };
  }
  return { text: line };
}

export function isDiceCommand(line: string): boolean {
  return ROLL_FULL_RE.test(line) || CC_FULL_RE.test(line);
}

export function contentToSegments(content: string): Segment[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const segments: Segment[] = [];
  let buffer: string[] = [];
  const flushText = () => {
    if (buffer.length === 0) return;
    const value = buffer.join("\n").replace(/^\n+|\n+$/g, "");
    if (value.length > 0) segments.push({ type: "text", value });
    buffer = [];
  };
  for (const raw of lines) {
    const { text, dice } = parseLine(raw);
    if (dice) {
      if (text) buffer.push(text);
      flushText();
      segments.push({ type: "dice", result: dice });
    } else if (text !== undefined) {
      buffer.push(text);
    }
  }
  flushText();
  return segments;
}

export const LEVEL_LABEL: Record<DiceLevel, string> = {
  critical: "결정적 성공",
  extreme: "극단적 성공",
  hard: "어려운 성공",
  regular: "일반 성공",
  fail: "실패",
  fumble: "펌블",
};

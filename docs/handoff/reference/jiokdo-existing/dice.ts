import type { CocResult, DiceLevel, DiceResult, RollResult, Segment } from "./types";

const ROLL_RE = /^\/(?:roll|r)\s+(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\s*$/i;
const CC_RE = /^\/cc\s+(?:(.+?)\s+)?(\d+)\s*$/i;

function rollDie(sides: number): number {
  if (sides < 1) return 1;
  return Math.floor(Math.random() * sides) + 1;
}

function parseRoll(line: string): RollResult | null {
  const m = line.match(ROLL_RE);
  if (!m) return null;
  const count = Math.min(parseInt(m[1], 10), 100);
  const sides = Math.min(parseInt(m[2], 10), 1000);
  if (count < 1 || sides < 1) return null;
  const sign = m[3] === "-" ? -1 : 1;
  const modifier = m[4] ? sign * parseInt(m[4], 10) : 0;
  const dice: number[] = [];
  for (let i = 0; i < count; i++) dice.push(rollDie(sides));
  const total = dice.reduce((a, b) => a + b, 0) + modifier;
  const notation =
    `${count}d${sides}` +
    (modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`);
  return {
    kind: "roll",
    expression: line.trim(),
    notation,
    dice,
    modifier,
    total,
  };
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

function parseCc(line: string): CocResult | null {
  const m = line.match(CC_RE);
  if (!m) return null;
  const name = m[1]?.trim() || undefined;
  const skill = parseInt(m[2], 10);
  if (skill < 1 || skill > 100) return null;
  const roll = rollDie(100);
  return {
    kind: "cc",
    expression: line.trim(),
    name,
    skill,
    roll,
    level: judgeCoc(roll, skill),
  };
}

function parseDice(line: string): DiceResult | null {
  return parseRoll(line) ?? parseCc(line);
}

export function isDiceCommand(line: string): boolean {
  return ROLL_RE.test(line) || CC_RE.test(line);
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
    const dice = parseDice(raw.trim());
    if (dice) {
      flushText();
      segments.push({ type: "dice", result: dice });
    } else {
      buffer.push(raw);
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

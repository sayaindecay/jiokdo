// 공통 CoC 파생 수식 — STR+CON 기반 체격/DB, 이동력, 체력.
// BestiaryForm / CharacterEditClient / CharacterSheet 등이 공유.

export function computeBuildDb(strCon: number): { db: string; build: number } {
  if (strCon < 2) return { db: "0", build: 0 };
  if (strCon <= 64) return { db: "-2", build: -2 };
  if (strCon <= 84) return { db: "-1", build: -1 };
  if (strCon <= 124) return { db: "0", build: 0 };
  if (strCon <= 164) return { db: "1d4", build: 1 };
  if (strCon <= 204) return { db: "1d6", build: 2 };
  if (strCon <= 284) return { db: "2d6", build: 3 };
  if (strCon <= 364) return { db: "3d6", build: 4 };
  if (strCon <= 444) return { db: "4d6", build: 5 };
  if (strCon <= 524) return { db: "5d6", build: 6 };
  const extra = Math.floor((strCon - 525) / 80) + 1;
  return { db: `${5 + extra}d6`, build: 6 + extra };
}

export function computeMove(str: number, dex: number, siz: number): number {
  if (dex < siz && str < siz) return 7;
  if (dex > siz && str > siz) return 9;
  return 8;
}

export function computeHpMax(con: number, siz: number): number {
  return Math.max(1, Math.floor((con + siz) / 10));
}

export function formatDbSuffix(db: string): string {
  if (!db || db === "0") return "";
  if (db.startsWith("-")) return ` - ${db.slice(1).trim()}`;
  return ` + ${db}`;
}

export function formatBuild(b: number): string {
  return b > 0 ? `+${b}` : String(b);
}

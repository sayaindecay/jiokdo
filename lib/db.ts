import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type {
  ActivityItem, BestiaryEntry, Campaign, CampaignMember, Character,
  Clue, CocAttrs, CocSkill, CocWeapon, PlayEntry, RuleSection, Segment, Session,
} from "./types";
import { BESTIARY, RULE_SECTIONS } from "./seed-data";

const url = process.env.TURSO_DATABASE_URL || "file:./data/jiokdo.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (process.env.VERCEL && url.startsWith("file:")) {
  throw new Error(
    "TURSO_DATABASE_URL이 설정되지 않았습니다. Vercel Environment Variables에 추가하세요."
  );
}
if (url.startsWith("file:")) {
  const abs = path.resolve(process.cwd(), url.slice(5));
  mkdirSync(path.dirname(abs), { recursive: true });
}

const client = createClient({ url, authToken });

let readyPromise: Promise<void> | null = null;
function ensureReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await client.batch([
      `CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        invite_code TEXT NOT NULL UNIQUE,
        keeper_nick TEXT NOT NULL,
        system TEXT NOT NULL DEFAULT 'coc',
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS campaign_members (
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        nickname TEXT NOT NULL,
        role TEXT NOT NULL,
        joined_at INTEGER NOT NULL,
        PRIMARY KEY (campaign_id, nickname)
      )`,
      `CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        owner_nick TEXT NOT NULL,
        name TEXT NOT NULL,
        occupation TEXT NOT NULL DEFAULT '',
        age INTEGER,
        attrs_json TEXT NOT NULL,
        hp INTEGER NOT NULL, hp_max INTEGER NOT NULL,
        mp INTEGER NOT NULL, mp_max INTEGER NOT NULL,
        san INTEGER NOT NULL, san_max INTEGER NOT NULL,
        skills_json TEXT NOT NULL,
        weapons_json TEXT NOT NULL,
        backstory TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_chars_campaign ON characters(campaign_id)`,
      `CREATE TABLE IF NOT EXISTS bestiary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        attrs_json TEXT NOT NULL,
        attacks_json TEXT NOT NULL,
        sanity_loss TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'core',
        created_by TEXT,
        created_at INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS rule_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        parent_slug TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS play_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        nickname TEXT NOT NULL,
        character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
        kind TEXT NOT NULL,
        segments_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_play_campaign ON play_entries(campaign_id, created_at ASC)`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        scheduled_at INTEGER,
        started_at INTEGER,
        ended_at INTEGER,
        notes_json TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON sessions(campaign_id, number DESC)`,
      `CREATE TABLE IF NOT EXISTS clues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        resolved INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_clues_campaign ON clues(campaign_id, resolved)`,
      `CREATE TABLE IF NOT EXISTS users (
        nickname TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_login_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        nickname TEXT NOT NULL REFERENCES users(nickname) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)`,
    ], "write");

    // 기존 DB 마이그레이션 (컬럼 추가) — 실패 시 무시
    for (const stmt of [
      "ALTER TABLE bestiary ADD COLUMN created_by TEXT",
      "ALTER TABLE bestiary ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0",
    ]) {
      try { await client.execute(stmt); } catch { /* 이미 존재 */ }
    }

    // 코어 베스티어리 시드 제거 — 사용자 등록 항목만 남김
    try {
      await client.execute("DELETE FROM bestiary WHERE created_by IS NULL");
    } catch { /* 실패해도 무시 */ }

    for (const s of RULE_SECTIONS) {
      await client.execute({
        sql: `INSERT INTO rule_sections (slug, parent_slug, title, body, order_index)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                parent_slug = excluded.parent_slug,
                title = excluded.title,
                body = excluded.body,
                order_index = excluded.order_index`,
        args: [s.slug, s.parent_slug, s.title, s.body, s.order_index],
      });
    }
    for (const b of BESTIARY) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO bestiary (slug, name, category, description, attrs_json, attacks_json, sanity_loss, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [b.slug, b.name, b.category, b.description, JSON.stringify(b.attrs), JSON.stringify(b.attacks), b.sanity_loss, b.source],
      });
    }
  })().catch((e) => {
    readyPromise = null;
    console.error("[db] init failed", e);
    throw e;
  });
  return readyPromise;
}

// ───── 룰북 ─────
export async function listRuleSections(): Promise<RuleSection[]> {
  await ensureReady();
  const res = await client.execute("SELECT * FROM rule_sections ORDER BY order_index ASC");
  return res.rows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    parent_slug: r.parent_slug == null ? null : String(r.parent_slug),
    title: String(r.title),
    body: String(r.body),
    order_index: Number(r.order_index),
  }));
}
export async function getRuleSection(slug: string): Promise<RuleSection | null> {
  await ensureReady();
  const res = await client.execute({ sql: "SELECT * FROM rule_sections WHERE slug = ?", args: [slug] });
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: Number(r.id), slug: String(r.slug),
    parent_slug: r.parent_slug == null ? null : String(r.parent_slug),
    title: String(r.title), body: String(r.body),
    order_index: Number(r.order_index),
  };
}

// ───── 몬스터 ─────
function rowToBestiary(r: Record<string, unknown>): BestiaryEntry {
  return {
    id: Number(r.id), slug: String(r.slug), name: String(r.name),
    category: String(r.category), description: String(r.description),
    attrs: JSON.parse(String(r.attrs_json)),
    attacks: JSON.parse(String(r.attacks_json)),
    sanity_loss: String(r.sanity_loss), source: String(r.source),
    created_by: r.created_by == null ? null : String(r.created_by),
    created_at: r.created_at == null ? 0 : Number(r.created_at),
  };
}
export async function listBestiary(
  query?: string,
  options?: { category?: string; limit?: number; offset?: number }
): Promise<BestiaryEntry[]> {
  await ensureReady();
  const conds: string[] = [];
  const args: (string | number)[] = [];
  if (query) {
    const q = `%${query.toLowerCase()}%`;
    conds.push("(LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)");
    args.push(q, q, q);
  }
  if (options?.category) {
    const c = `%${options.category.toLowerCase()}%`;
    conds.push("LOWER(category) LIKE ?");
    args.push(c);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  args.push(limit, offset);
  const res = await client.execute({
    sql: `SELECT * FROM bestiary ${where} ORDER BY name LIMIT ? OFFSET ?`,
    args,
  });
  return res.rows.map((r) => rowToBestiary(r as unknown as Record<string, unknown>));
}
export async function countBestiaryWith(
  query?: string,
  category?: string,
): Promise<number> {
  await ensureReady();
  const conds: string[] = [];
  const args: string[] = [];
  if (query) {
    const q = `%${query.toLowerCase()}%`;
    conds.push("(LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)");
    args.push(q, q, q);
  }
  if (category) {
    const c = `%${category.toLowerCase()}%`;
    conds.push("LOWER(category) LIKE ?");
    args.push(c);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const res = await client.execute({
    sql: `SELECT COUNT(*) AS n FROM bestiary ${where}`,
    args,
  });
  return Number(res.rows[0]?.n ?? 0);
}
export async function getBestiaryEntry(slug: string): Promise<BestiaryEntry | null> {
  await ensureReady();
  const res = await client.execute({ sql: "SELECT * FROM bestiary WHERE slug = ?", args: [slug] });
  const r = res.rows[0];
  return r ? rowToBestiary(r as unknown as Record<string, unknown>) : null;
}
export async function findRelatedBestiary(slug: string, category: string, limit = 4): Promise<BestiaryEntry[]> {
  await ensureReady();
  const c = `%${category.toLowerCase()}%`;
  const res = await client.execute({
    sql: `SELECT * FROM bestiary
          WHERE slug != ?
            AND (LOWER(category) LIKE ? OR ? = '')
          ORDER BY name LIMIT ?`,
    args: [slug, c, category, limit],
  });
  return res.rows.map((r) => rowToBestiary(r as unknown as Record<string, unknown>));
}

export async function createBestiaryEntry(input: {
  slug: string;
  name: string;
  category: string;
  description: string;
  attrs: BestiaryEntry["attrs"];
  attacks: BestiaryEntry["attacks"];
  sanity_loss: string;
  source: string;
  created_by: string;
}): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: `INSERT INTO bestiary (slug, name, category, description, attrs_json, attacks_json, sanity_loss, source, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.slug, input.name, input.category, input.description,
      JSON.stringify(input.attrs), JSON.stringify(input.attacks),
      input.sanity_loss, input.source, input.created_by, Date.now(),
    ],
  });
}

export async function updateBestiaryEntry(slug: string, input: {
  name: string;
  category: string;
  description: string;
  attrs: BestiaryEntry["attrs"];
  attacks: BestiaryEntry["attacks"];
  sanity_loss: string;
  source: string;
}): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: `UPDATE bestiary SET name = ?, category = ?, description = ?,
            attrs_json = ?, attacks_json = ?, sanity_loss = ?, source = ?
          WHERE slug = ?`,
    args: [
      input.name, input.category, input.description,
      JSON.stringify(input.attrs), JSON.stringify(input.attacks),
      input.sanity_loss, input.source, slug,
    ],
  });
}

export async function deleteBestiaryEntry(slug: string): Promise<boolean> {
  await ensureReady();
  const res = await client.execute({
    sql: "DELETE FROM bestiary WHERE slug = ?",
    args: [slug],
  });
  return Number(res.rowsAffected) > 0;
}

export async function isBestiarySlugTaken(slug: string): Promise<boolean> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT 1 FROM bestiary WHERE slug = ? LIMIT 1",
    args: [slug],
  });
  return res.rows.length > 0;
}

// ───── 캠페인 ─────
function rowToCampaign(r: Record<string, unknown>): Campaign {
  return {
    id: Number(r.id), slug: String(r.slug),
    name: String(r.name), description: String(r.description),
    invite_code: String(r.invite_code), keeper_nick: String(r.keeper_nick),
    system: String(r.system), created_at: Number(r.created_at),
    member_count: r.member_count != null ? Number(r.member_count) : undefined,
    character_count: r.character_count != null ? Number(r.character_count) : undefined,
  };
}
function randomCode(len = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "") || `c-${Date.now()}`;
}

export async function createCampaign(input: {
  name: string; description: string; keeper_nick: string;
}): Promise<Campaign> {
  await ensureReady();
  const now = Date.now();
  let slugBase = slugify(input.name);
  let slug = slugBase;
  for (let i = 2; i < 10; i++) {
    const c = await client.execute({ sql: "SELECT 1 FROM campaigns WHERE slug = ?", args: [slug] });
    if (c.rows.length === 0) break;
    slug = `${slugBase}-${i}`;
  }
  let code = randomCode();
  for (let i = 0; i < 5; i++) {
    const c = await client.execute({ sql: "SELECT 1 FROM campaigns WHERE invite_code = ?", args: [code] });
    if (c.rows.length === 0) break;
    code = randomCode();
  }
  const res = await client.execute({
    sql: `INSERT INTO campaigns (slug, name, description, invite_code, keeper_nick, system, created_at)
          VALUES (?, ?, ?, ?, ?, 'coc', ?)`,
    args: [slug, input.name, input.description, code, input.keeper_nick, now],
  });
  const id = Number(res.lastInsertRowid);
  await client.execute({
    sql: `INSERT INTO campaign_members (campaign_id, nickname, role, joined_at) VALUES (?, ?, 'keeper', ?)`,
    args: [id, input.keeper_nick, now],
  });
  const got = await getCampaign(id);
  return got!;
}

export async function getCampaign(id: number): Promise<Campaign | null> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM campaign_members m WHERE m.campaign_id = c.id) AS member_count,
            (SELECT COUNT(*) FROM characters ch WHERE ch.campaign_id = c.id) AS character_count
          FROM campaigns c WHERE c.id = ?`,
    args: [id],
  });
  const r = res.rows[0];
  return r ? rowToCampaign(r as unknown as Record<string, unknown>) : null;
}
export async function getCampaignByCode(code: string): Promise<Campaign | null> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT * FROM campaigns WHERE invite_code = ?",
    args: [code.toUpperCase()],
  });
  const r = res.rows[0];
  return r ? rowToCampaign(r as unknown as Record<string, unknown>) : null;
}
export async function listMyCampaigns(nick: string): Promise<Campaign[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM campaign_members m2 WHERE m2.campaign_id = c.id) AS member_count,
            (SELECT COUNT(*) FROM characters ch WHERE ch.campaign_id = c.id) AS character_count
          FROM campaigns c
          JOIN campaign_members m ON m.campaign_id = c.id
          WHERE m.nickname = ?
          ORDER BY c.created_at DESC`,
    args: [nick],
  });
  return res.rows.map((r) => rowToCampaign(r as unknown as Record<string, unknown>));
}
export async function joinCampaign(campaignId: number, nick: string): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: `INSERT OR IGNORE INTO campaign_members (campaign_id, nickname, role, joined_at) VALUES (?, ?, 'player', ?)`,
    args: [campaignId, nick, Date.now()],
  });
}
export async function listCampaignMembers(campaignId: number): Promise<CampaignMember[]> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT * FROM campaign_members WHERE campaign_id = ? ORDER BY joined_at ASC",
    args: [campaignId],
  });
  return res.rows.map((r) => ({
    campaign_id: Number(r.campaign_id),
    nickname: String(r.nickname),
    role: r.role === "keeper" ? "keeper" : "player",
    joined_at: Number(r.joined_at),
  }));
}

// ───── 캐릭터 ─────
function rowToCharacter(r: Record<string, unknown>): Character {
  return {
    id: Number(r.id), campaign_id: Number(r.campaign_id),
    owner_nick: String(r.owner_nick), name: String(r.name),
    occupation: String(r.occupation),
    age: r.age == null ? null : Number(r.age),
    attrs: JSON.parse(String(r.attrs_json)) as CocAttrs,
    hp: Number(r.hp), hp_max: Number(r.hp_max),
    mp: Number(r.mp), mp_max: Number(r.mp_max),
    san: Number(r.san), san_max: Number(r.san_max),
    skills: JSON.parse(String(r.skills_json)) as CocSkill[],
    weapons: JSON.parse(String(r.weapons_json)) as CocWeapon[],
    backstory: String(r.backstory), created_at: Number(r.created_at),
  };
}
export async function createCharacter(input: Omit<Character, "id" | "created_at">): Promise<number> {
  await ensureReady();
  const res = await client.execute({
    sql: `INSERT INTO characters (campaign_id, owner_nick, name, occupation, age, attrs_json, hp, hp_max, mp, mp_max, san, san_max, skills_json, weapons_json, backstory, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.campaign_id, input.owner_nick, input.name, input.occupation, input.age,
      JSON.stringify(input.attrs),
      input.hp, input.hp_max, input.mp, input.mp_max, input.san, input.san_max,
      JSON.stringify(input.skills), JSON.stringify(input.weapons), input.backstory,
      Date.now(),
    ],
  });
  return Number(res.lastInsertRowid);
}
export async function getCharacter(id: number): Promise<Character | null> {
  await ensureReady();
  const res = await client.execute({ sql: "SELECT * FROM characters WHERE id = ?", args: [id] });
  const r = res.rows[0];
  return r ? rowToCharacter(r as unknown as Record<string, unknown>) : null;
}
export async function listCampaignCharacters(campaignId: number): Promise<Character[]> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT * FROM characters WHERE campaign_id = ? ORDER BY created_at ASC",
    args: [campaignId],
  });
  return res.rows.map((r) => rowToCharacter(r as unknown as Record<string, unknown>));
}
export async function updateCharacterVitals(id: number, vitals: { hp: number; mp: number; san: number }): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: "UPDATE characters SET hp = ?, mp = ?, san = ? WHERE id = ?",
    args: [vitals.hp, vitals.mp, vitals.san, id],
  });
}

export async function deleteCampaign(id: number, keeperNick: string): Promise<boolean> {
  await ensureReady();
  const res = await client.execute({
    sql: "DELETE FROM campaigns WHERE id = ? AND keeper_nick = ?",
    args: [id, keeperNick],
  });
  return Number(res.rowsAffected) > 0;
}

export async function deleteCharacter(id: number, ownerNick: string): Promise<boolean> {
  await ensureReady();
  const res = await client.execute({
    sql: "DELETE FROM characters WHERE id = ? AND owner_nick = ?",
    args: [id, ownerNick],
  });
  return Number(res.rowsAffected) > 0;
}

export async function updateCharacterProfile(id: number, profile: {
  name: string;
  occupation: string;
  age: number | null;
  backstory: string;
  skills: CocSkill[];
  attrs?: CocAttrs;
  hp_max?: number;
  mp_max?: number;
  san_max?: number;
}): Promise<void> {
  await ensureReady();
  if (profile.attrs && profile.hp_max != null && profile.mp_max != null && profile.san_max != null) {
    await client.execute({
      sql: `UPDATE characters SET name = ?, occupation = ?, age = ?, backstory = ?,
              skills_json = ?, attrs_json = ?,
              hp_max = ?, mp_max = ?, san_max = ?,
              hp = MIN(hp, ?), mp = MIN(mp, ?), san = MIN(san, ?)
            WHERE id = ?`,
      args: [
        profile.name, profile.occupation, profile.age,
        profile.backstory, JSON.stringify(profile.skills),
        JSON.stringify(profile.attrs),
        profile.hp_max, profile.mp_max, profile.san_max,
        profile.hp_max, profile.mp_max, profile.san_max,
        id,
      ],
    });
    return;
  }
  await client.execute({
    sql: `UPDATE characters SET name = ?, occupation = ?, age = ?, backstory = ?, skills_json = ? WHERE id = ?`,
    args: [
      profile.name, profile.occupation, profile.age,
      profile.backstory, JSON.stringify(profile.skills), id,
    ],
  });
}

// ───── 플레이 로그 ─────
function rowToPlayEntry(r: Record<string, unknown>): PlayEntry {
  return {
    id: Number(r.id), campaign_id: Number(r.campaign_id),
    nickname: String(r.nickname),
    character_id: r.character_id == null ? null : Number(r.character_id),
    character_name: r.character_name == null ? undefined : String(r.character_name),
    kind: String(r.kind) as PlayEntry["kind"],
    segments: JSON.parse(String(r.segments_json)) as Segment[],
    created_at: Number(r.created_at),
  };
}
export async function listPlayEntries(campaignId: number): Promise<PlayEntry[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT p.*, c.name AS character_name
          FROM play_entries p
          LEFT JOIN characters c ON c.id = p.character_id
          WHERE p.campaign_id = ?
          ORDER BY p.created_at ASC`,
    args: [campaignId],
  });
  return res.rows.map((r) => rowToPlayEntry(r as unknown as Record<string, unknown>));
}
export async function createPlayEntry(input: {
  campaign_id: number; nickname: string; character_id: number | null;
  kind: PlayEntry["kind"]; segments: Segment[];
}): Promise<number> {
  await ensureReady();
  const res = await client.execute({
    sql: `INSERT INTO play_entries (campaign_id, nickname, character_id, kind, segments_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      input.campaign_id, input.nickname, input.character_id, input.kind,
      JSON.stringify(input.segments), Date.now(),
    ],
  });
  return Number(res.lastInsertRowid);
}

// ───── 검색 ─────
export type SearchHit =
  | { kind: "rule"; slug: string; title: string; snippet: string; meta: string[] }
  | { kind: "monster"; slug: string; name: string; snippet: string; meta: string[] }
  | { kind: "campaign"; id: number; name: string; snippet: string; meta: string[] }
  | { kind: "character"; id: number; name: string; snippet: string; meta: string[] }
  | { kind: "clue"; id: number; campaign_id: number; title: string; snippet: string; meta: string[] };

export async function searchAll(query: string, nick: string | null): Promise<SearchHit[]> {
  await ensureReady();
  const q = `%${query.toLowerCase()}%`;
  const hits: SearchHit[] = [];

  const rules = await client.execute({
    sql: `SELECT slug, title, body FROM rule_sections
          WHERE LOWER(title) LIKE ? OR LOWER(body) LIKE ?
          LIMIT 10`,
    args: [q, q],
  });
  for (const r of rules.rows) {
    hits.push({
      kind: "rule",
      slug: String(r.slug),
      title: String(r.title),
      snippet: snippet(String(r.body), query),
      meta: ["룰북", "한국어"],
    });
  }

  const monsters = await client.execute({
    sql: `SELECT slug, name, description, category, source FROM bestiary
          WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?
          LIMIT 10`,
    args: [q, q, q],
  });
  for (const r of monsters.rows) {
    hits.push({
      kind: "monster",
      slug: String(r.slug),
      name: String(r.name),
      snippet: snippet(String(r.description), query),
      meta: [String(r.category), String(r.source || "코어")],
    });
  }

  if (nick) {
    const camps = await client.execute({
      sql: `SELECT c.id, c.name, c.description FROM campaigns c
            JOIN campaign_members m ON m.campaign_id = c.id
            WHERE m.nickname = ? AND (LOWER(c.name) LIKE ? OR LOWER(c.description) LIKE ?)
            LIMIT 10`,
      args: [nick, q, q],
    });
    for (const r of camps.rows) {
      hits.push({
        kind: "campaign",
        id: Number(r.id),
        name: String(r.name),
        snippet: snippet(String(r.description), query),
        meta: ["캠페인"],
      });
    }

    const chars = await client.execute({
      sql: `SELECT id, name, occupation, backstory FROM characters
            WHERE owner_nick = ? AND (LOWER(name) LIKE ? OR LOWER(occupation) LIKE ? OR LOWER(backstory) LIKE ?)
            LIMIT 10`,
      args: [nick, q, q, q],
    });
    for (const r of chars.rows) {
      hits.push({
        kind: "character",
        id: Number(r.id),
        name: String(r.name),
        snippet: snippet(String(r.backstory || r.occupation || ""), query),
        meta: [String(r.occupation || "탐사자"), "시트"],
      });
    }

    const cluesRes = await client.execute({
      sql: `SELECT cl.id, cl.campaign_id, cl.title, cl.body, c.name AS cname
            FROM clues cl
            JOIN campaign_members m ON m.campaign_id = cl.campaign_id AND m.nickname = ?
            JOIN campaigns c ON c.id = cl.campaign_id
            WHERE LOWER(cl.title) LIKE ? OR LOWER(cl.body) LIKE ?
            LIMIT 10`,
      args: [nick, q, q],
    });
    for (const r of cluesRes.rows) {
      hits.push({
        kind: "clue",
        id: Number(r.id),
        campaign_id: Number(r.campaign_id),
        title: String(r.title),
        snippet: snippet(String(r.body), query),
        meta: [String(r.cname), "단서"],
      });
    }
  }

  return hits;
}

function snippet(text: string, query: string, len = 120): string {
  const lower = text.toLowerCase();
  const i = lower.indexOf(query.toLowerCase());
  if (i < 0) return text.slice(0, len);
  const start = Math.max(0, i - 30);
  return (start > 0 ? "…" : "") + text.slice(start, start + len) + (start + len < text.length ? "…" : "");
}

// ───── 세션 ─────
function rowToSession(r: Record<string, unknown>): Session {
  return {
    id: Number(r.id),
    campaign_id: Number(r.campaign_id),
    number: Number(r.number),
    title: String(r.title),
    scheduled_at: r.scheduled_at == null ? null : Number(r.scheduled_at),
    started_at: r.started_at == null ? null : Number(r.started_at),
    ended_at: r.ended_at == null ? null : Number(r.ended_at),
    notes_segments: JSON.parse(String(r.notes_json || "[]")) as Segment[],
    created_at: Number(r.created_at),
  };
}

export async function listSessions(campaignId: number): Promise<Session[]> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT * FROM sessions WHERE campaign_id = ? ORDER BY number DESC",
    args: [campaignId],
  });
  return res.rows.map((r) => rowToSession(r as unknown as Record<string, unknown>));
}

export async function getNextScheduledSession(nick: string): Promise<{ session: Session; campaign: Campaign } | null> {
  await ensureReady();
  const now = Date.now();
  const res = await client.execute({
    sql: `SELECT s.*, c.id AS c_id, c.slug AS c_slug, c.name AS c_name, c.description AS c_description,
                 c.invite_code AS c_invite, c.keeper_nick AS c_keeper, c.system AS c_system,
                 c.created_at AS c_created
          FROM sessions s
          JOIN campaign_members m ON m.campaign_id = s.campaign_id AND m.nickname = ?
          JOIN campaigns c ON c.id = s.campaign_id
          WHERE s.scheduled_at IS NOT NULL AND s.scheduled_at >= ? AND s.ended_at IS NULL
          ORDER BY s.scheduled_at ASC LIMIT 1`,
    args: [nick, now],
  });
  const r = res.rows[0];
  if (!r) return null;
  const session = rowToSession(r as unknown as Record<string, unknown>);
  const campaign: Campaign = {
    id: Number(r.c_id), slug: String(r.c_slug), name: String(r.c_name),
    description: String(r.c_description), invite_code: String(r.c_invite),
    keeper_nick: String(r.c_keeper), system: String(r.c_system),
    created_at: Number(r.c_created),
  };
  return { session, campaign };
}

export async function getCampaignAggregates(campaignId: number): Promise<{
  unresolved_clues: number;
  total_sessions: number;
  total_play_ms: number;
  members_count: number;
}> {
  await ensureReady();
  const [clues, sessions, members] = await Promise.all([
    client.execute({ sql: "SELECT COUNT(*) AS n FROM clues WHERE campaign_id = ? AND resolved = 0", args: [campaignId] }),
    client.execute({
      sql: `SELECT COUNT(*) AS n,
                   COALESCE(SUM(CASE WHEN ended_at IS NOT NULL AND started_at IS NOT NULL THEN ended_at - started_at ELSE 0 END), 0) AS dur
            FROM sessions WHERE campaign_id = ?`,
      args: [campaignId],
    }),
    client.execute({ sql: "SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ?", args: [campaignId] }),
  ]);
  return {
    unresolved_clues: Number(clues.rows[0]?.n ?? 0),
    total_sessions: Number(sessions.rows[0]?.n ?? 0),
    total_play_ms: Number(sessions.rows[0]?.dur ?? 0),
    members_count: Number(members.rows[0]?.n ?? 0),
  };
}

export async function countCharactersInDanger(campaignId: number): Promise<number> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT COUNT(*) AS n FROM characters WHERE campaign_id = ? AND san <= 30",
    args: [campaignId],
  });
  return Number(res.rows[0]?.n ?? 0);
}

export async function listClues(campaignId: number): Promise<Clue[]> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT * FROM clues WHERE campaign_id = ? ORDER BY created_at DESC",
    args: [campaignId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    campaign_id: Number(r.campaign_id),
    session_id: r.session_id == null ? null : Number(r.session_id),
    title: String(r.title),
    body: String(r.body),
    resolved: Number(r.resolved) === 1,
    created_at: Number(r.created_at),
  }));
}

export async function listActivityFor(nick: string, limit = 8): Promise<ActivityItem[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT p.created_at AS when_at, p.nickname AS who,
                 'play 글 게시' AS what,
                 c.name AS where_name, c.id AS c_id
          FROM play_entries p
          JOIN campaign_members m ON m.campaign_id = p.campaign_id AND m.nickname = ?
          JOIN campaigns c ON c.id = p.campaign_id
          ORDER BY p.created_at DESC LIMIT ?`,
    args: [nick, limit],
  });
  return res.rows.map((r) => ({
    when: Number(r.when_at),
    who: String(r.who),
    what: String(r.what),
    where: String(r.where_name),
    campaign_id: Number(r.c_id),
  }));
}

export async function listRecentCharacterRolls(characterId: number, limit = 5): Promise<PlayEntry[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT p.*, c.name AS character_name
          FROM play_entries p
          LEFT JOIN characters c ON c.id = p.character_id
          WHERE p.character_id = ? AND p.segments_json LIKE '%"type":"dice"%'
          ORDER BY p.created_at DESC LIMIT ?`,
    args: [characterId, limit],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    campaign_id: Number(r.campaign_id),
    nickname: String(r.nickname),
    character_id: r.character_id == null ? null : Number(r.character_id),
    character_name: r.character_name == null ? undefined : String(r.character_name),
    kind: String(r.kind) as PlayEntry["kind"],
    segments: JSON.parse(String(r.segments_json)) as Segment[],
    created_at: Number(r.created_at),
  }));
}

// ───── 글로벌 통계 / 라이브 티커 (Phase 1 실데이터 연동) ─────
export async function getGlobalStats(): Promise<{
  registered_nicks: number;
  total_dice_rolls: number;
  this_week_sessions: number;
}> {
  await ensureReady();
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const [nicks, dice, sessionsThisWeek] = await Promise.all([
    client.execute("SELECT COUNT(DISTINCT nickname) AS n FROM campaign_members"),
    client.execute("SELECT COUNT(*) AS n FROM play_entries WHERE segments_json LIKE '%\"type\":\"dice\"%'"),
    client.execute({
      sql: "SELECT COUNT(*) AS n FROM sessions WHERE created_at >= ? OR (scheduled_at IS NOT NULL AND scheduled_at >= ?)",
      args: [sevenDaysAgo, sevenDaysAgo],
    }),
  ]);
  return {
    registered_nicks: Number(nicks.rows[0]?.n ?? 0),
    total_dice_rolls: Number(dice.rows[0]?.n ?? 0),
    this_week_sessions: Number(sessionsThisWeek.rows[0]?.n ?? 0),
  };
}

export type RecentDiceItem = {
  id: number;
  nickname: string;
  character_name: string | null;
  campaign_name: string;
  campaign_id: number;
  expression: string;
  level: string | null;
  level_label: string | null;
  total: number;
  created_at: number;
};

export async function listRecentDice(limit = 10): Promise<RecentDiceItem[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT p.id, p.nickname, p.segments_json, p.campaign_id, p.created_at,
                 ch.name AS character_name, c.name AS campaign_name
          FROM play_entries p
          LEFT JOIN characters ch ON ch.id = p.character_id
          LEFT JOIN campaigns c ON c.id = p.campaign_id
          WHERE p.segments_json LIKE '%"type":"dice"%'
          ORDER BY p.created_at DESC
          LIMIT ?`,
    args: [limit * 2],
  });
  const out: RecentDiceItem[] = [];
  for (const r of res.rows) {
    const segs = JSON.parse(String(r.segments_json)) as Segment[];
    const dice = segs.find((s) => s.type === "dice");
    if (!dice || dice.type !== "dice") continue;
    let expression: string, level: string | null = null, level_label: string | null = null, total: number;
    if (dice.result.kind === "cc") {
      expression = dice.result.name
        ? `/cc ${dice.result.name} ${dice.result.skill}`
        : `/cc ${dice.result.skill}`;
      total = dice.result.roll;
      level = dice.result.level;
      const { LEVEL_LABEL } = await import("./dice");
      level_label = LEVEL_LABEL[dice.result.level];
    } else {
      expression = `/roll ${dice.result.notation}`;
      total = dice.result.total;
    }
    out.push({
      id: Number(r.id),
      nickname: String(r.nickname),
      character_name: r.character_name == null ? null : String(r.character_name),
      campaign_name: String(r.campaign_name || "—"),
      campaign_id: Number(r.campaign_id),
      expression,
      level,
      level_label,
      total,
      created_at: Number(r.created_at),
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function getRecentNarrationsAndRolls(limit = 6): Promise<{
  who: string;
  text: string;
  isDice: boolean;
  level?: string;
  level_label?: string;
}[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT p.nickname, p.kind, p.segments_json, ch.name AS character_name
          FROM play_entries p
          LEFT JOIN characters ch ON ch.id = p.character_id
          ORDER BY p.created_at DESC
          LIMIT ?`,
    args: [limit],
  });
  const out: { who: string; text: string; isDice: boolean; level?: string; level_label?: string }[] = [];
  const { LEVEL_LABEL } = await import("./dice");
  for (const r of res.rows.reverse()) {
    const who = String(r.character_name || r.nickname);
    const segs = JSON.parse(String(r.segments_json)) as Segment[];
    for (const s of segs) {
      if (s.type === "text") {
        const text = s.value.trim();
        if (text) out.push({ who, text: text.slice(0, 220), isDice: false });
      } else if (s.type === "dice") {
        if (s.result.kind === "cc") {
          out.push({
            who,
            text: `${s.result.name ? `${s.result.name} ` : ""}1d100 ≤ ${s.result.skill} → ${s.result.roll}`,
            isDice: true,
            level: s.result.level,
            level_label: LEVEL_LABEL[s.result.level],
          });
        } else {
          out.push({
            who,
            text: `${s.result.notation} → ${s.result.total}`,
            isDice: true,
          });
        }
      }
    }
  }
  return out.slice(-limit);
}

export async function countMyCampaigns(nick: string): Promise<{ campaigns: number; play_entries: number }> {
  await ensureReady();
  const [c, p] = await Promise.all([
    client.execute({
      sql: "SELECT COUNT(*) AS n FROM campaign_members WHERE nickname = ?",
      args: [nick],
    }),
    client.execute({
      sql: `SELECT COUNT(*) AS n FROM play_entries p
            JOIN campaign_members m ON m.campaign_id = p.campaign_id
            WHERE m.nickname = ?`,
      args: [nick],
    }),
  ]);
  return {
    campaigns: Number(c.rows[0]?.n ?? 0),
    play_entries: Number(p.rows[0]?.n ?? 0),
  };
}

export async function countRuleSections(): Promise<number> {
  await ensureReady();
  const res = await client.execute("SELECT COUNT(*) AS n FROM rule_sections");
  return Number(res.rows[0]?.n ?? 0);
}

export async function countBestiary(): Promise<number> {
  await ensureReady();
  const res = await client.execute("SELECT COUNT(*) AS n FROM bestiary");
  return Number(res.rows[0]?.n ?? 0);
}

// ───── 사용자 / 세션 ─────
export type UserRow = {
  nickname: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
  last_login_at: number | null;
};

export async function findUser(nickname: string): Promise<UserRow | null> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT * FROM users WHERE nickname = ?",
    args: [nickname],
  });
  const r = res.rows[0];
  if (!r) return null;
  return {
    nickname: String(r.nickname),
    password_hash: String(r.password_hash),
    password_salt: String(r.password_salt),
    created_at: Number(r.created_at),
    last_login_at: r.last_login_at == null ? null : Number(r.last_login_at),
  };
}

export async function createUser(input: {
  nickname: string;
  password_hash: string;
  password_salt: string;
}): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: `INSERT INTO users (nickname, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)`,
    args: [input.nickname, input.password_hash, input.password_salt, Date.now()],
  });
}

export async function touchUserLogin(nickname: string): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: "UPDATE users SET last_login_at = ? WHERE nickname = ?",
    args: [Date.now(), nickname],
  });
}

export async function createUserSessionRecord(input: {
  token: string;
  nickname: string;
  expires_at: number;
}): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: `INSERT INTO user_sessions (token, nickname, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    args: [input.token, input.nickname, Date.now(), input.expires_at],
  });
}

export async function findUserSession(token: string): Promise<{ nickname: string; expires_at: number } | null> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT nickname, expires_at FROM user_sessions WHERE token = ?",
    args: [token],
  });
  const r = res.rows[0];
  if (!r) return null;
  const expiresAt = Number(r.expires_at);
  if (expiresAt < Date.now()) return null;
  return { nickname: String(r.nickname), expires_at: expiresAt };
}

export async function updateUserPassword(nick: string, hash: string, salt: string): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: "UPDATE users SET password_hash = ?, password_salt = ? WHERE nickname = ?",
    args: [hash, salt, nick],
  });
}

export async function deleteUser(nick: string): Promise<boolean> {
  await ensureReady();
  const res = await client.execute({
    sql: "DELETE FROM users WHERE nickname = ?",
    args: [nick],
  });
  return Number(res.rowsAffected) > 0;
}

export async function deleteOtherUserSessions(nick: string, exceptToken: string): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: "DELETE FROM user_sessions WHERE nickname = ? AND token != ?",
    args: [nick, exceptToken],
  });
}

export async function countActiveUserSessions(nick: string): Promise<number> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT COUNT(*) AS n FROM user_sessions WHERE nickname = ? AND expires_at > ?",
    args: [nick, Date.now()],
  });
  return Number(res.rows[0]?.n ?? 0);
}

export async function listKeperCampaigns(nick: string): Promise<Campaign[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM campaign_members m WHERE m.campaign_id = c.id) AS member_count,
            (SELECT COUNT(*) FROM characters ch WHERE ch.campaign_id = c.id) AS character_count
          FROM campaigns c WHERE c.keeper_nick = ?
          ORDER BY c.created_at DESC`,
    args: [nick],
  });
  return res.rows.map((r) => rowToCampaign(r as unknown as Record<string, unknown>));
}

export async function deleteUserSession(token: string): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: "DELETE FROM user_sessions WHERE token = ?",
    args: [token],
  });
}

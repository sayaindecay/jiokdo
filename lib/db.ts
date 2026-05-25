import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Board, Comment, Post, Segment } from "./types";

const url = process.env.TURSO_DATABASE_URL || "file:./data/jiokdo.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (process.env.VERCEL && url.startsWith("file:")) {
  throw new Error(
    "TURSO_DATABASE_URL이 설정되지 않았습니다. Vercel 프로젝트의 Environment Variables에 TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN을 추가하고 재배포하세요."
  );
}

if (url.startsWith("file:")) {
  const relative = url.slice(5);
  const abs = path.resolve(process.cwd(), relative);
  mkdirSync(path.dirname(abs), { recursive: true });
}

const client = createClient({ url, authToken });

const DEFAULT_BOARDS: Board[] = [
  { slug: "lobby", name: "로비", description: "TRPG 잡담, 모집, 후기" },
  { slug: "scenario", name: "시나리오", description: "직접 만든 시나리오/공개 자료" },
  { slug: "session", name: "세션", description: "플레이 로그, 진행 중인 세션" },
];

let readyPromise: Promise<void> | null = null;
function ensureReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await client.batch(
      [
        `CREATE TABLE IF NOT EXISTS boards (
          slug TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT ''
        )`,
        `CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          board_slug TEXT NOT NULL REFERENCES boards(slug),
          nickname TEXT NOT NULL,
          title TEXT NOT NULL,
          segments_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_posts_board ON posts(board_slug, created_at DESC)`,
        `CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          nickname TEXT NOT NULL,
          segments_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at ASC)`,
      ],
      "write"
    );
    for (const b of DEFAULT_BOARDS) {
      await client.execute({
        sql: "INSERT OR IGNORE INTO boards (slug, name, description) VALUES (?, ?, ?)",
        args: [b.slug, b.name, b.description],
      });
    }
  })().catch((e) => {
    readyPromise = null;
    console.error("[db] schema init failed", {
      url: url.startsWith("libsql://") ? url.replace(/\/\/.+@/, "//") : url,
      hasAuthToken: !!authToken,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    });
    throw e;
  });
  return readyPromise;
}

export async function listBoards(): Promise<Board[]> {
  await ensureReady();
  const res = await client.execute("SELECT slug, name, description FROM boards");
  return res.rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description),
  }));
}

export async function getBoard(slug: string): Promise<Board | undefined> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT slug, name, description FROM boards WHERE slug = ?",
    args: [slug],
  });
  const r = res.rows[0];
  if (!r) return undefined;
  return {
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description),
  };
}

function rowToPost(r: Record<string, unknown>): Post {
  return {
    id: Number(r.id),
    board_slug: String(r.board_slug),
    nickname: String(r.nickname),
    title: String(r.title),
    segments: JSON.parse(String(r.segments_json)) as Segment[],
    created_at: Number(r.created_at),
    comment_count: r.comment_count != null ? Number(r.comment_count) : undefined,
  };
}

export async function listPosts(boardSlug: string): Promise<Post[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT p.id, p.board_slug, p.nickname, p.title, p.segments_json, p.created_at,
                 (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
          FROM posts p WHERE p.board_slug = ? ORDER BY p.created_at DESC`,
    args: [boardSlug],
  });
  return res.rows.map((r) => rowToPost(r as unknown as Record<string, unknown>));
}

export async function getPost(id: number): Promise<Post | undefined> {
  await ensureReady();
  const res = await client.execute({
    sql: "SELECT id, board_slug, nickname, title, segments_json, created_at FROM posts WHERE id = ?",
    args: [id],
  });
  const r = res.rows[0];
  return r ? rowToPost(r as unknown as Record<string, unknown>) : undefined;
}

export async function createPost(input: {
  board_slug: string;
  nickname: string;
  title: string;
  segments: Segment[];
}): Promise<number> {
  await ensureReady();
  const res = await client.execute({
    sql: `INSERT INTO posts (board_slug, nickname, title, segments_json, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      input.board_slug,
      input.nickname,
      input.title,
      JSON.stringify(input.segments),
      Date.now(),
    ],
  });
  return Number(res.lastInsertRowid);
}

export async function listComments(postId: number): Promise<Comment[]> {
  await ensureReady();
  const res = await client.execute({
    sql: `SELECT id, post_id, nickname, segments_json, created_at
          FROM comments WHERE post_id = ? ORDER BY created_at ASC`,
    args: [postId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    post_id: Number(r.post_id),
    nickname: String(r.nickname),
    segments: JSON.parse(String(r.segments_json)) as Segment[],
    created_at: Number(r.created_at),
  }));
}

export async function createComment(input: {
  post_id: number;
  nickname: string;
  segments: Segment[];
}): Promise<number> {
  await ensureReady();
  const res = await client.execute({
    sql: `INSERT INTO comments (post_id, nickname, segments_json, created_at)
          VALUES (?, ?, ?, ?)`,
    args: [
      input.post_id,
      input.nickname,
      JSON.stringify(input.segments),
      Date.now(),
    ],
  });
  return Number(res.lastInsertRowid);
}

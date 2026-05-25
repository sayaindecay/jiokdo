import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Board, Comment, Post, Segment } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "jiokdo.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_slug TEXT NOT NULL REFERENCES boards(slug),
    nickname TEXT NOT NULL,
    title TEXT NOT NULL,
    segments_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_posts_board ON posts(board_slug, created_at DESC);
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    segments_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at ASC);
`);

const DEFAULT_BOARDS: Board[] = [
  { slug: "lobby", name: "로비", description: "TRPG 잡담, 모집, 후기" },
  { slug: "scenario", name: "시나리오", description: "직접 만든 시나리오/공개 자료" },
  { slug: "session", name: "세션", description: "플레이 로그, 진행 중인 세션" },
];

const insertBoard = db.prepare(
  "INSERT OR IGNORE INTO boards (slug, name, description) VALUES (?, ?, ?)"
);
for (const b of DEFAULT_BOARDS) {
  insertBoard.run(b.slug, b.name, b.description);
}

export function listBoards(): Board[] {
  return db.prepare("SELECT slug, name, description FROM boards").all() as Board[];
}

export function getBoard(slug: string): Board | undefined {
  return db
    .prepare("SELECT slug, name, description FROM boards WHERE slug = ?")
    .get(slug) as Board | undefined;
}

type PostRow = {
  id: number;
  board_slug: string;
  nickname: string;
  title: string;
  segments_json: string;
  created_at: number;
  comment_count?: number;
};

function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    board_slug: row.board_slug,
    nickname: row.nickname,
    title: row.title,
    segments: JSON.parse(row.segments_json) as Segment[],
    created_at: row.created_at,
    comment_count: row.comment_count,
  };
}

export function listPosts(boardSlug: string): Post[] {
  const rows = db
    .prepare(
      `SELECT p.id, p.board_slug, p.nickname, p.title, p.segments_json, p.created_at,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p WHERE p.board_slug = ? ORDER BY p.created_at DESC`
    )
    .all(boardSlug) as PostRow[];
  return rows.map(rowToPost);
}

export function getPost(id: number): Post | undefined {
  const row = db
    .prepare(
      "SELECT id, board_slug, nickname, title, segments_json, created_at FROM posts WHERE id = ?"
    )
    .get(id) as PostRow | undefined;
  return row ? rowToPost(row) : undefined;
}

export function createPost(input: {
  board_slug: string;
  nickname: string;
  title: string;
  segments: Segment[];
}): number {
  const stmt = db.prepare(
    `INSERT INTO posts (board_slug, nickname, title, segments_json, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    input.board_slug,
    input.nickname,
    input.title,
    JSON.stringify(input.segments),
    Date.now()
  );
  return Number(info.lastInsertRowid);
}

type CommentRow = {
  id: number;
  post_id: number;
  nickname: string;
  segments_json: string;
  created_at: number;
};

export function listComments(postId: number): Comment[] {
  const rows = db
    .prepare(
      `SELECT id, post_id, nickname, segments_json, created_at
       FROM comments WHERE post_id = ? ORDER BY created_at ASC`
    )
    .all(postId) as CommentRow[];
  return rows.map((r) => ({
    id: r.id,
    post_id: r.post_id,
    nickname: r.nickname,
    segments: JSON.parse(r.segments_json) as Segment[],
    created_at: r.created_at,
  }));
}

export function createComment(input: {
  post_id: number;
  nickname: string;
  segments: Segment[];
}): number {
  const stmt = db.prepare(
    `INSERT INTO comments (post_id, nickname, segments_json, created_at)
     VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(
    input.post_id,
    input.nickname,
    JSON.stringify(input.segments),
    Date.now()
  );
  return Number(info.lastInsertRowid);
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { contentToSegments } from "@/lib/dice";
import { createComment, createPost, getBoard, getPost } from "@/lib/db";

function sanitizeNickname(raw: FormDataEntryValue | null): string {
  const v = (typeof raw === "string" ? raw : "").trim();
  if (!v) return "익명의 탐사자";
  return v.slice(0, 24);
}

function sanitizeText(raw: FormDataEntryValue | null, max: number): string {
  const v = (typeof raw === "string" ? raw : "").trim();
  return v.slice(0, max);
}

export async function createPostAction(formData: FormData): Promise<void> {
  const boardSlug = sanitizeText(formData.get("board_slug"), 32);
  if (!getBoard(boardSlug)) throw new Error("게시판을 찾을 수 없습니다");

  const title = sanitizeText(formData.get("title"), 120);
  const content = sanitizeText(formData.get("content"), 20000);
  const nickname = sanitizeNickname(formData.get("nickname"));

  if (!title) throw new Error("제목을 입력하세요");
  if (!content) throw new Error("내용을 입력하세요");

  const segments = contentToSegments(content);
  const id = createPost({ board_slug: boardSlug, nickname, title, segments });

  revalidatePath(`/board/${boardSlug}`);
  redirect(`/post/${id}`);
}

export async function createCommentAction(formData: FormData): Promise<void> {
  const postId = Number(formData.get("post_id"));
  const post = getPost(postId);
  if (!post) throw new Error("글을 찾을 수 없습니다");

  const content = sanitizeText(formData.get("content"), 8000);
  const nickname = sanitizeNickname(formData.get("nickname"));
  if (!content) throw new Error("내용을 입력하세요");

  const segments = contentToSegments(content);
  createComment({ post_id: postId, nickname, segments });

  revalidatePath(`/post/${postId}`);
}

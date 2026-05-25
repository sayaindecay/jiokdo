import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/CommentForm";
import { ContentRenderer } from "@/components/ContentRenderer";
import { getBoard, getPost, listComments } from "@/lib/db";
import { formatTime } from "@/lib/format";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const post = await getPost(id);
  if (!post) notFound();
  const board = await getBoard(post.board_slug);
  const comments = await listComments(post.id);

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">게시판</Link>
        <span className="sep">/</span>
        {board ? <Link href={`/board/${board.slug}`}>{board.name}</Link> : null}
      </div>

      <div style={{
        background: "var(--bg-elev)",
        border: "1.5px solid var(--line)",
        borderRadius: "var(--radius)",
        padding: "1.5rem 1.6rem",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "0.5rem",
      }}>
        <div className="post-header">
          <h1 className="page-title">{post.title}</h1>
          <div className="meta">
            <span className="nickname">{post.nickname}</span>
            <span> · {formatTime(post.created_at)}</span>
          </div>
        </div>
        <ContentRenderer segments={post.segments} />
      </div>

      <div style={{
        background: "var(--bg-elev)",
        border: "1.5px solid var(--line)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        marginTop: "0.85rem",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "0.75rem 1.3rem",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-elev-2)",
        }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-dim)" }}>
            댓글
          </span>
          <span style={{ fontSize: "0.82rem", color: "var(--text-faint)", fontWeight: 500 }}>
            {comments.length}개
          </span>
        </div>

        <div style={{ padding: "0 1.3rem" }}>
          {comments.length === 0 ? (
            <p style={{ color: "var(--text-faint)", fontSize: "0.9rem", padding: "1.2rem 0", textAlign: "center" }}>
              첫 댓글을 남겨보세요.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="comment">
                <div className="head">
                  <span className="nickname">{c.nickname}</span>
                  <span className="meta">{formatTime(c.created_at)}</span>
                </div>
                <ContentRenderer segments={c.segments} />
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: "1rem 1.3rem",
          borderTop: "1px solid var(--line)",
          background: "var(--bg-elev-2)",
        }}>
          <CommentForm postId={post.id} />
        </div>
      </div>
    </>
  );
}

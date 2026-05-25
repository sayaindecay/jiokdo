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
  const post = getPost(id);
  if (!post) notFound();
  const board = getBoard(post.board_slug);
  const comments = listComments(post.id);

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">게시판</Link>
        <span className="sep">/</span>
        {board ? <Link href={`/board/${board.slug}`}>{board.name}</Link> : null}
      </div>
      <div className="post-header">
        <h1 className="page-title">{post.title}</h1>
        <div className="meta">
          <span className="nickname">{post.nickname}</span>
          <span> · {formatTime(post.created_at)}</span>
        </div>
      </div>
      <ContentRenderer segments={post.segments} />

      <div className="section-head">
        <h2>댓글</h2>
        <span className="count">{comments.length}개</span>
      </div>
      <div>
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="head">
              <span className="nickname">{c.nickname}</span>
              <span className="meta">{formatTime(c.created_at)}</span>
            </div>
            <ContentRenderer segments={c.segments} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <CommentForm postId={post.id} />
      </div>
    </>
  );
}

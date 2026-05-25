import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/PostForm";
import { getBoard, listPosts } from "@/lib/db";
import { formatTime } from "@/lib/format";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = getBoard(slug);
  if (!board) notFound();
  const posts = listPosts(board.slug);

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">게시판</Link>
        <span className="sep">/</span>
        <span>{board.name}</span>
      </div>
      <h1 className="page-title">{board.name}</h1>
      <p className="page-sub">{board.description}</p>

      <div className="section-head">
        <h2>글 목록</h2>
        <span className="count">{posts.length}개</span>
      </div>
      {posts.length === 0 ? (
        <div className="empty">아직 글이 없습니다. 첫 글을 남겨보세요.</div>
      ) : (
        <div className="post-list">
          {posts.map((p) => (
            <div key={p.id} className="post-row">
              <div>
                <Link href={`/post/${p.id}`} className="title">
                  {p.title}
                </Link>
                {p.comment_count && p.comment_count > 0 ? (
                  <span className="comment-count">[{p.comment_count}]</span>
                ) : null}
              </div>
              <div className="meta">
                <span>{p.nickname}</span>
                <span> · {formatTime(p.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>새 글 쓰기</h2>
      </div>
      <PostForm boardSlug={board.slug} />
    </>
  );
}

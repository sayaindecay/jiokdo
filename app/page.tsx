import Link from "next/link";
import { listBoards } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const boards = await listBoards();
  return (
    <>
      <h1 className="page-title">게시판</h1>
      <p className="page-sub">
        TRPG 롤플레잉과 다이스 굴림을 한 글 안에서. 닉네임만 적으면 누구나 글을 남길 수 있습니다.
      </p>
      <div className="board-grid">
        {boards.map((b) => (
          <Link key={b.slug} href={`/board/${b.slug}`} className="board-card">
            <h2>{b.name}</h2>
            <p>{b.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

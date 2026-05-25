import Link from "next/link";
import { listBestiary } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BestiaryIndex({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const entries = await listBestiary(q);

  return (
    <>
      <h1 className="page-title">스탯블록 / 몬스터</h1>
      <p className="page-sub">코어 룰북의 주요 생물 일람</p>

      <form className="filter-bar" action="/bestiary">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="이름이나 카테고리로 검색"
        />
        <button type="submit" className="btn">검색</button>
      </form>

      {entries.length === 0 ? (
        <div className="empty">결과 없음</div>
      ) : (
        <div className="bestiary-grid">
          {entries.map((e) => (
            <Link key={e.id} href={`/bestiary/${e.slug}`} className="bestiary-card">
              <h3>{e.name}</h3>
              <div className="card-meta">{e.category}</div>
              <p>{e.description.slice(0, 120)}…</p>
              <div className="card-foot">
                <span>HP {e.attrs.hp ?? "-"}</span>
                <span>STR {e.attrs.str ?? "-"}</span>
                <span>SAN {e.sanity_loss}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

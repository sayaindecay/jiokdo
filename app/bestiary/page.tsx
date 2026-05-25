import Link from "next/link";
import { countBestiaryWith, listBestiary } from "@/lib/db";
import { getAuthenticatedNickname } from "@/lib/auth";
import { EmptyState } from "@/components/vtt/EmptyState";
import { ThreatStars } from "@/components/vtt/ThreatStars";

export const dynamic = "force-dynamic";

const QUICK_CATEGORIES = [
  { label: "전부", value: "" },
  { label: "신화 생물", value: "신화" },
  { label: "외계", value: "외계" },
  { label: "사역수", value: "사역수" },
  { label: "독립 종족", value: "독립" },
  { label: "인간 / NPC", value: "인간" },
];

const PAGE_SIZE = 12;

export default async function BestiaryIndex({
  searchParams,
}: { searchParams: Promise<{ q?: string; cat?: string; page?: string }> }) {
  const { q, cat, page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? 1) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const [entries, total, nick] = await Promise.all([
    listBestiary(q, { category: cat, limit: PAGE_SIZE, offset }),
    countBestiaryWith(q, cat),
    getAuthenticatedNickname(),
  ]);

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const linkFor = (extra: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | number | undefined> = { q, cat, page: currentPage, ...extra };
    for (const [k, v] of Object.entries(base)) {
      if (v != null && v !== "" && !(k === "page" && v === 1)) params.set(k, String(v));
    }
    const s = params.toString();
    return `/bestiary${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="page-title">베스티어리</h1>
          <p className="page-sub">
            코어 룰북의 주요 생물 + 사용자 등록 NPC {total > 0 ? `· ${total}개` : ""}
          </p>
        </div>
        {nick ? (
          <Link href="/bestiary/new" className="btn primary">
            + 새 항목
          </Link>
        ) : (
          <Link href="/login?redirect=/bestiary/new" className="btn ghost">
            로그인하고 항목 추가
          </Link>
        )}
      </div>

      <form className="filter-bar" action="/bestiary" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="이름·카테고리·설명 검색"
        />
        {cat ? <input type="hidden" name="cat" value={cat} /> : null}
        <button type="submit" className="btn">검색</button>
      </form>

      {/* 9.1 카테고리 필터 */}
      <div className="bestiary-filter" role="group" aria-label="카테고리 필터">
        <span className="label">카테고리</span>
        {QUICK_CATEGORIES.map((c) => {
          const isActive = (cat ?? "") === c.value;
          const href = linkFor({ cat: c.value || undefined, page: 1 });
          return (
            <Link
              key={c.label}
              href={href}
              className={`filter-chip${isActive ? " active" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          variant="books"
          title="해당하는 항목이 없습니다"
          hint={q || cat ? "다른 단어/카테고리를 시도하세요" : "베스티어리가 비어 있습니다"}
          action={
            nick ? (
              <Link href="/bestiary/new" className="btn primary">
                첫 항목 추가
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="bestiary-grid">
            {entries.map((e) => (
              <Link key={e.id} href={`/bestiary/${e.slug}`} className="bestiary-card">
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ flex: 1 }}>
                    <h3>{e.name}</h3>
                    <div className="card-meta">{e.category || "분류 미지정"}</div>
                  </div>
                  <ThreatStars entry={e} />
                </div>
                <p>{e.description ? `${e.description.slice(0, 120)}${e.description.length > 120 ? "…" : ""}` : "설명 없음"}</p>
                <div className="card-foot">
                  <span>HP {e.attrs.hp ?? "—"}</span>
                  <span>STR {e.attrs.str ?? "—"}</span>
                  <span>SAN {e.sanity_loss || "—"}</span>
                  <span
                    className={`bestiary-author${e.created_by ? " user" : ""}`}
                    style={{ marginLeft: "auto" }}
                  >
                    {e.created_by ? `@${e.created_by}` : "코어"}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* 9.6 페이지네이션 */}
          {lastPage > 1 ? (
            <nav className="pagination" aria-label="페이지">
              {currentPage > 1 ? (
                <Link href={linkFor({ page: currentPage - 1 })}>← 이전</Link>
              ) : (
                <span className="disabled">← 이전</span>
              )}
              <span className="info">{currentPage} / {lastPage} 페이지 · 총 {total}개</span>
              {currentPage < lastPage ? (
                <Link href={linkFor({ page: currentPage + 1 })}>다음 →</Link>
              ) : (
                <span className="disabled">다음 →</span>
              )}
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}

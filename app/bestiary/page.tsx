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
    <div className="bes-page">
      <header className="bes-header">
        <div className="bes-head-text">
          <div className="bes-eyebrow">BESTIARY · 위협 도감</div>
          <h1 className="bes-title">에너미</h1>
          <p className="bes-sub">
            사용자가 등록한 NPC·생물·미지의 존재 자료집{total > 0 ? ` · ${total}개` : ""}
          </p>
        </div>
        <div className="bes-actions">
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
      </header>

      {/* 통합 툴바: 검색 (좌) + 카테고리 필터 (우) */}
      <div className="bes-toolbar">
        <form className="bes-search" action="/bestiary" role="search">
          <span className="bes-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="이름·카테고리·설명 검색"
            aria-label="에너미 검색"
          />
          {cat ? <input type="hidden" name="cat" value={cat} /> : null}
          <button type="submit" className="bes-search-submit">
            검색
          </button>
        </form>

        <div className="bes-filter" role="group" aria-label="카테고리 필터">
          {QUICK_CATEGORIES.map((c) => {
            const isActive = (cat ?? "") === c.value;
            const href = linkFor({ cat: c.value || undefined, page: 1 });
            return (
              <Link
                key={c.label}
                href={href}
                className={`bes-chip${isActive ? " active" : ""}`}
                aria-current={isActive ? "true" : undefined}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          variant="books"
          title="해당하는 항목이 없습니다"
          hint={q || cat ? "다른 단어/카테고리를 시도하세요" : "에너미가 비어 있습니다"}
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
              <Link key={e.id} href={`/bestiary/${e.slug}`} className={`bestiary-card${e.image_url ? " has-image" : ""}`}>
                {e.image_url ? (
                  <div className="bc-thumb" aria-hidden="true">
                    <img src={e.image_url} alt="" />
                  </div>
                ) : null}
                <div className="bc-head">
                  <div className="bc-cat">{e.category || "분류 미지정"}</div>
                  <ThreatStars entry={e} />
                </div>
                <h3 className="bc-name">{e.name}</h3>
                <p className="bc-desc">
                  {e.description
                    ? `${e.description.slice(0, 110)}${e.description.length > 110 ? "…" : ""}`
                    : "설명 없음"}
                </p>
                <dl className="bc-stats" aria-hidden="true">
                  <div><dt>HP</dt><dd>{e.attrs.hp ?? "—"}</dd></div>
                  <div><dt>STR</dt><dd>{e.attrs.str ?? "—"}</dd></div>
                  <div><dt>SAN</dt><dd>{e.sanity_loss || "—"}</dd></div>
                </dl>
                <div className="bc-foot">
                  <span className={`bestiary-author${e.created_by ? " user" : ""}`}>
                    {e.created_by ? `@${e.created_by}` : "코어"}
                  </span>
                  <span className="bc-arrow" aria-hidden="true">→</span>
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
    </div>
  );
}

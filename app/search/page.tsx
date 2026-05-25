import Link from "next/link";
import { getNickname } from "@/lib/auth";
import { searchAll, type SearchHit } from "@/lib/db";
import { highlight } from "@/lib/highlight";

export const dynamic = "force-dynamic";

type SourceKey = "all" | "rulebook" | "campaign" | "sheet" | "note";
type Group = {
  key: Exclude<SourceKey, "all">;
  label: string;
  icon: string;
  kinds: SearchHit["kind"][];
};

const GROUPS: Group[] = [
  { key: "rulebook", label: "룰북", icon: "📖", kinds: ["rule", "monster"] },
  { key: "campaign", label: "캠페인 · 글", icon: "📚", kinds: ["campaign"] },
  { key: "sheet", label: "캐릭터 시트", icon: "👤", kinds: ["character"] },
  { key: "note", label: "노트 · 단서", icon: "🗒", kinds: ["clue"] },
];

function hrefFor(h: SearchHit): string {
  switch (h.kind) {
    case "rule": return `/rulebook/${h.slug}`;
    case "monster": return `/bestiary/${h.slug}`;
    case "campaign": return `/campaigns/${h.id}`;
    case "character": return `/characters/${h.id}`;
    case "clue": return `/campaigns/${h.campaign_id}/play`;
  }
}

function titleFor(h: SearchHit): string {
  switch (h.kind) {
    case "rule": return h.title;
    case "monster": return h.name;
    case "campaign": return h.name;
    case "character": return h.name;
    case "clue": return h.title;
  }
}

export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; in?: string }> }) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const active = (sp.in ?? "all") as SourceKey;
  const nick = await getNickname();
  const hits = query ? await searchAll(query, nick) : [];

  const facetCounts: Record<Exclude<SourceKey, "all">, number> = {
    rulebook: hits.filter((h) => h.kind === "rule" || h.kind === "monster").length,
    campaign: hits.filter((h) => h.kind === "campaign").length,
    sheet: hits.filter((h) => h.kind === "character").length,
    note: hits.filter((h) => h.kind === "clue").length,
  };

  const visibleHits = active === "all"
    ? hits
    : hits.filter((h) => GROUPS.find((g) => g.key === active)?.kinds.includes(h.kind));

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>검색</span>
      </div>

      <form action="/search" className="search-bar">
        <span>🔍</span>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="룰북 · 캠페인 · 시트 · 노트에서 검색"
          autoFocus
        />
        {active !== "all" ? <input type="hidden" name="in" value={active} /> : null}
        <span className="total">{query ? `${visibleHits.length}건` : "—"}</span>
        <Link href="/" className="clear">esc</Link>
      </form>

      <div className="search-layout">
        <aside className="facets">
          <div className="group">
            <div className="group-title">출처</div>
            <Link href={`/search?q=${encodeURIComponent(query)}`} className={`facet${active === "all" ? " active" : ""}`}>
              <span>📦 전부</span>
              <span className="num">{hits.length}</span>
            </Link>
            {GROUPS.map((g) => (
              <Link
                key={g.key}
                href={`/search?q=${encodeURIComponent(query)}&in=${g.key}`}
                className={`facet${active === g.key ? " active" : ""}`}
              >
                <span>{g.icon} {g.label}</span>
                <span className="num">{facetCounts[g.key]}</span>
              </Link>
            ))}
          </div>
          <div className="group">
            <div className="group-title">언어</div>
            <div className="facet" style={{ opacity: 0.55 }}>
              <span>한국어</span>
              <span className="num">{hits.length}</span>
            </div>
            <div className="facet" style={{ opacity: 0.4 }}>
              <span>English</span>
              <span className="num">0</span>
            </div>
          </div>
          <div className="group">
            <div className="group-title">기간</div>
            <div className="facet" style={{ opacity: 0.55 }}>
              <span>전체</span>
              <span className="num">{hits.length}</span>
            </div>
          </div>
        </aside>

        <div>
          {!query ? (
            <div className="empty">
              상단 검색창에 단어를 입력하세요. 룰북·몬스터·캠페인·시트·단서가 출처별로 묶여 표시됩니다.
            </div>
          ) : visibleHits.length === 0 ? (
            <div className="empty">
              <strong>{query}</strong> 에 대한 결과가 없습니다.
            </div>
          ) : (
            GROUPS.filter((g) =>
              active === "all" ? facetCounts[g.key] > 0 : g.key === active
            ).map((g) => {
              const inGroup = hits.filter((h) => g.kinds.includes(h.kind));
              if (inGroup.length === 0) return null;
              return (
                <div className="search-group" key={g.key}>
                  <div className="group-head">
                    <span className="label">{g.icon} {g.label}</span>
                    <span className="num">{inGroup.length}건</span>
                    <span className="sort">관련도 순</span>
                  </div>
                  {inGroup.map((h, i) => (
                    <Link
                      href={hrefFor(h)}
                      className="search-result"
                      key={`${g.key}-${i}`}
                      aria-label={`${g.label}: ${titleFor(h)}${h.snippet ? ` — ${h.snippet}` : ""} (${h.meta.join(", ")})`}
                    >
                      <div className="r-title">
                        {highlight(titleFor(h), query)}
                      </div>
                      {h.snippet ? (
                        <div className="r-snippet">{highlight(h.snippet, query)}</div>
                      ) : null}
                      <div className="r-meta" aria-hidden="true">
                        {h.meta.map((m, j) => (
                          <span key={j}>
                            {j > 0 ? <span>·</span> : null}
                            <span>{m}</span>
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

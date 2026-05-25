import Link from "next/link";
import { Fragment } from "react";
import { getNickname } from "@/lib/auth";
import {
  countBestiary, countMyCampaigns, countRuleSections,
  searchAll, type SearchHit,
} from "@/lib/db";
import { highlight } from "@/lib/highlight";
import { EmptyState } from "@/components/vtt/EmptyState";

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

const SUGGESTIONS = [
  "도서관", "탐색", "회피", "이성", "권총",
  "딥 원", "쇼고스", "결정적", "펌블", "키퍼",
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

function sourceLabel(kind: SearchHit["kind"]): string {
  switch (kind) {
    case "rule": return "룰북";
    case "monster": return "에너미";
    case "campaign": return "캠페인";
    case "character": return "캐릭터";
    case "clue": return "단서";
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; in?: string }>;
}) {
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

  const visibleHits =
    active === "all"
      ? hits
      : hits.filter((h) =>
          GROUPS.find((g) => g.key === active)?.kinds.includes(h.kind)
        );

  // 빈 진입 시 입구 카드용 카운트
  const [ruleCount, beastCount] = !query
    ? await Promise.all([countRuleSections(), countBestiary()])
    : [0, 0];
  const myCounts =
    !query && nick ? await countMyCampaigns(nick) : { campaigns: 0, play_entries: 0 };

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>검색</span>
      </div>

      <form action="/search" className="search-bar">
        <span aria-hidden="true">🔍</span>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="룰북 · 캠페인 · 시트 · 노트에서 검색"
          autoFocus
        />
        {active !== "all" ? <input type="hidden" name="in" value={active} /> : null}
        <span className="total">{query ? `${visibleHits.length}건` : "—"}</span>
        <Link href="/" className="clear" aria-label="검색 닫기">esc</Link>
      </form>

      {!query ? (
        <div className="search-suggest" role="group" aria-label="추천 검색어">
          <span style={{ alignSelf: "center", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", marginRight: "0.3rem" }}>
            제안 →
          </span>
          {SUGGESTIONS.map((s) => (
            <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="chip">
              {s}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="search-layout">
        <aside className="facets">
          <div className="group">
            <div className="group-title">출처</div>
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className={`facet${active === "all" ? " active" : ""}`}
              data-empty={query && hits.length === 0 ? "1" : undefined}
            >
              <span>📦 전부</span>
              <span className="num">{hits.length}</span>
            </Link>
            {GROUPS.map((g) => (
              <Link
                key={g.key}
                href={`/search?q=${encodeURIComponent(query)}&in=${g.key}`}
                className={`facet${active === g.key ? " active" : ""}`}
                data-empty={query && facetCounts[g.key] === 0 ? "1" : undefined}
              >
                <span>{g.icon} {g.label}</span>
                <span className="num">{facetCounts[g.key]}</span>
              </Link>
            ))}
          </div>
          <div className="group">
            <div className="group-title">언어</div>
            <div className="facet" data-empty="1">
              <span>한국어</span>
              <span className="num">{hits.length}</span>
            </div>
            <div className="facet" data-empty="1">
              <span>English</span>
              <span className="num">0</span>
            </div>
          </div>
          <div className="group">
            <div className="group-title">기간</div>
            <div className="facet" data-empty="1">
              <span>전체</span>
              <span className="num">{hits.length}</span>
            </div>
          </div>
        </aside>

        <div>
          {!query ? (
            <>
              <p className="page-sub" style={{ marginBottom: "0.8rem" }}>
                어디서부터 찾을지 모르시면 아래 입구로 시작하세요.
              </p>
              <div className="search-entry-grid">
                <Link href="/rulebook" className="search-entry-card">
                  <span className="icon" aria-hidden="true">📖</span>
                  <h3>룰북</h3>
                  <div className="count">{ruleCount}개 섹션</div>
                  <div className="recent">판정·전투·이성·캐릭터 생성</div>
                </Link>
                <Link href="/bestiary" className="search-entry-card">
                  <span className="icon" aria-hidden="true">🐙</span>
                  <h3>에너미</h3>
                  <div className="count">{beastCount}개 항목</div>
                  <div className="recent">신화 생물 · NPC 스탯블록</div>
                </Link>
                {nick ? (
                  <Link href="/campaigns" className="search-entry-card">
                    <span className="icon" aria-hidden="true">📚</span>
                    <h3>내 캠페인</h3>
                    <div className="count">{myCounts.campaigns}개 참여 중</div>
                    <div className="recent">단서·세션 로그·플레이 기록</div>
                  </Link>
                ) : (
                  <Link href="/login" className="search-entry-card">
                    <span className="icon" aria-hidden="true">📚</span>
                    <h3>내 캠페인</h3>
                    <div className="count">로그인 필요</div>
                    <div className="recent">가입 후 단서·로그·시트 검색 가능</div>
                  </Link>
                )}
                <Link href="/" className="search-entry-card">
                  <span className="icon" aria-hidden="true">🎲</span>
                  <h3>홈으로</h3>
                  <div className="count">최근 굴림 · 라이브 피드</div>
                  <div className="recent">최근 어떤 굴림이 있었는지 확인</div>
                </Link>
              </div>
            </>
          ) : visibleHits.length === 0 ? (
            <EmptyState
              variant="mist"
              title={`"${query}" 에 대한 결과가 없습니다`}
              hint="다른 단어를 시도하거나 facet 을 바꿔보세요."
            />
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
                      <div className="r-title">{highlight(titleFor(h), query)}</div>
                      {h.snippet ? (
                        <div className="r-snippet">{highlight(h.snippet, query)}</div>
                      ) : null}
                      <div className="r-meta" aria-hidden="true">
                        <span className="hit-source">{sourceLabel(h.kind)}</span>
                        {h.meta.map((m, j) => (
                          <Fragment key={j}>
                            <span className="sep">·</span>
                            <span className="meta-tag">{m}</span>
                          </Fragment>
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

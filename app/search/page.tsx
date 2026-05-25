import Link from "next/link";
import { getNickname } from "@/lib/auth";
import { searchAll } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const nick = await getNickname();
  const hits = query ? await searchAll(query, nick) : [];

  const rules = hits.filter((h) => h.kind === "rule");
  const monsters = hits.filter((h) => h.kind === "monster");
  const campaigns = hits.filter((h) => h.kind === "campaign");
  const characters = hits.filter((h) => h.kind === "character");

  return (
    <>
      <h1 className="page-title">검색</h1>
      {!query ? (
        <p className="page-sub">상단 검색창에 단어를 입력하세요.</p>
      ) : (
        <p className="page-sub">
          <strong>{query}</strong>에 대한 결과 {hits.length}건
        </p>
      )}

      <form className="filter-bar" action="/search">
        <input type="search" name="q" defaultValue={query} placeholder="검색어" autoFocus />
        <button type="submit" className="btn">검색</button>
      </form>

      {!query ? null : hits.length === 0 ? (
        <div className="empty">결과 없음</div>
      ) : (
        <div className="search-results">
          {rules.length > 0 ? (
            <Group title="룰북">
              {rules.map((h) => h.kind === "rule" ? (
                <Link key={`r-${h.slug}`} href={`/rules/${h.slug}`} className="search-hit">
                  <span className="hit-kind">룰북</span>
                  <h3>{h.title}</h3>
                  <p>{h.snippet}</p>
                </Link>
              ) : null)}
            </Group>
          ) : null}

          {monsters.length > 0 ? (
            <Group title="몬스터">
              {monsters.map((h) => h.kind === "monster" ? (
                <Link key={`m-${h.slug}`} href={`/bestiary/${h.slug}`} className="search-hit">
                  <span className="hit-kind">몬스터</span>
                  <h3>{h.name}</h3>
                  <p>{h.snippet}</p>
                </Link>
              ) : null)}
            </Group>
          ) : null}

          {campaigns.length > 0 ? (
            <Group title="내 캠페인">
              {campaigns.map((h) => h.kind === "campaign" ? (
                <Link key={`c-${h.id}`} href={`/campaigns/${h.id}`} className="search-hit">
                  <span className="hit-kind">캠페인</span>
                  <h3>{h.name}</h3>
                  <p>{h.snippet}</p>
                </Link>
              ) : null)}
            </Group>
          ) : null}

          {characters.length > 0 ? (
            <Group title="내 캐릭터">
              {characters.map((h) => h.kind === "character" ? (
                <Link key={`ch-${h.id}`} href={`/characters/${h.id}`} className="search-hit">
                  <span className="hit-kind">캐릭터</span>
                  <h3>{h.name}</h3>
                  <p>{h.snippet}</p>
                </Link>
              ) : null)}
            </Group>
          ) : null}
        </div>
      )}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="search-group">
      <h2>{title}</h2>
      <div className="hit-list">{children}</div>
    </section>
  );
}

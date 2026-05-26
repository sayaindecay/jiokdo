import Link from "next/link";
import { Fragment, type ReactNode } from "react";

export type WikiNavItem = {
  slug: string;
  title: string;
  sub?: { id: string; text: string }[];
  group: string;
};

export type WikiAnchor = { id: string; text: string };

const GROUP_ICONS: Record<string, string> = {
  기본: "📘",
  판정: "🎲",
  기타: "✦",
};

// 사이드바 그룹 노출 순서 — '기타' 가 항상 맨 아래
const GROUP_ORDER: string[] = ["기본", "판정", "기타"];

export function WikiLayout({
  nav,
  activeSlug,
  anchors,
  activeAnchorId,
  related,
  children,
}: {
  nav: WikiNavItem[];
  activeSlug: string | null;
  anchors: WikiAnchor[];
  activeAnchorId?: string | null;
  related?: { cmds?: string[]; posts?: { href: string; title: string }[] };
  children: ReactNode;
}) {
  const groups = nav.reduce<Record<string, WikiNavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});
  // GROUP_ORDER 우선 → 거기 없는 그룹은 알파벳 순으로 뒤에 (안전망)
  const sortedGroupEntries = Object.entries(groups).sort(([a], [b]) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="wiki-layout">
      <aside className="wiki-sidebar">
        <Link href="/search?in=rulebook" className="search-box">
          🔍 룰북에서 찾기 <kbd>/</kbd>
        </Link>
        {sortedGroupEntries.map(([groupTitle, items]) => (
          <div className="group" key={groupTitle}>
            <div className="group-title">
              <span className="g-icon" aria-hidden="true">
                {GROUP_ICONS[groupTitle] ?? "✦"}
              </span>
              {groupTitle}
            </div>
            {items.map((item) => {
              const isActive = item.slug === activeSlug;
              return (
                <Fragment key={item.slug}>
                  <Link
                    href={`/rulebook/${item.slug}`}
                    className={isActive ? "active" : ""}
                  >
                    {item.title}
                    {isActive ? " ●" : ""}
                  </Link>
                  {isActive && item.sub
                    ? item.sub.map((s) => (
                        <Link
                          key={`${item.slug}-${s.id}`}
                          href={`/rulebook/${item.slug}#${s.id}`}
                          className={`sub${activeAnchorId === s.id ? " active" : ""}`}
                        >
                          {s.text}
                        </Link>
                      ))
                    : null}
                </Fragment>
              );
            })}
          </div>
        ))}
      </aside>

      <article className="wiki-main">{children}</article>

      <aside className="wiki-aside">
        {anchors.length > 0 ? (
          <div className="group">
            <div className="group-title">이 문서 안에서</div>
            {anchors.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className={activeAnchorId === a.id ? "active" : ""}
              >
                {a.text}
              </a>
            ))}
          </div>
        ) : null}

        {related?.cmds && related.cmds.length > 0 ? (
          <div className="quick quick-cmds">
            <div className="quick-title">관련 명령어</div>
            <div className="cmd-chips">
              {related.cmds.map((c) => (
                <code key={c} className="cmd-chip">{c}</code>
              ))}
            </div>
          </div>
        ) : null}

        {related?.posts && related.posts.length > 0 ? (
          <div className="quick">
            <div className="quick-title">관련 글</div>
            {related.posts.map((p) => (
              <a key={p.href} href={p.href}>{p.title}</a>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

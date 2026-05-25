import Link from "next/link";
import { listRuleSections } from "@/lib/db";
import { MarkdownLite } from "@/components/MarkdownLite";

export const dynamic = "force-dynamic";

export default async function RulesIndex() {
  const sections = await listRuleSections();
  const intro = sections.find((s) => s.slug === "intro");
  const rest = sections.filter((s) => s.slug !== "intro");

  return (
    <div className="rule-layout">
      <aside className="rule-toc">
        <h3>목차</h3>
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <Link href={`/rules/${s.slug}`}>{s.title}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <div className="rule-main">
        <h1 className="page-title">룰북</h1>
        <p className="page-sub">Call of Cthulhu 7판 핵심 규칙 요약</p>
        {intro ? (
          <div className="rule-section">
            <MarkdownLite text={intro.body} />
          </div>
        ) : null}
        <div className="section-head">
          <h2>섹션</h2>
          <span className="count">{rest.length}개</span>
        </div>
        <div className="rule-list">
          {rest.map((s) => (
            <Link key={s.id} href={`/rules/${s.slug}`} className="rule-item">
              <h3>{s.title}</h3>
              <p>{s.body.slice(0, 100).replace(/\n/g, " ")}…</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getRuleSection, listRuleSections } from "@/lib/db";
import { MarkdownLite } from "@/components/MarkdownLite";

export const dynamic = "force-dynamic";

export default async function RuleSectionPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = await getRuleSection(slug);
  if (!section) notFound();
  const all = await listRuleSections();

  return (
    <div className="rule-layout">
      <aside className="rule-toc">
        <h3>목차</h3>
        <ul>
          {all.map((s) => (
            <li key={s.id}>
              <Link
                href={`/rules/${s.slug}`}
                className={s.slug === slug ? "active" : ""}
              >
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <div className="rule-main">
        <div className="breadcrumb">
          <Link href="/rules">룰북</Link>
          <span className="sep">/</span>
          <span>{section.title}</span>
        </div>
        <h1 className="page-title">{section.title}</h1>
        <div className="rule-section">
          <MarkdownLite text={section.body} />
        </div>
      </div>
    </div>
  );
}

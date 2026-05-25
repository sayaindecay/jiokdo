import Link from "next/link";
import { notFound } from "next/navigation";
import { getRuleSection, listRuleSections } from "@/lib/db";
import { WikiLayout } from "@/components/vtt/WikiLayout";
import { WikiSection } from "@/components/vtt/WikiSection";
import { extractHeadings, MarkdownLite } from "@/components/MarkdownLite";
import {
  buildRulebookNav,
  relatedCommandsFor,
  sectionMetaLine,
} from "@/lib/rulebook-nav";

export const dynamic = "force-dynamic";

export default async function RulebookSection({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = await getRuleSection(slug);
  if (!section) notFound();
  const all = await listRuleSections();
  const nav = buildRulebookNav(all);
  const headings = extractHeadings(section.body);
  const anchors = headings
    .filter((h) => h.level === 1 || h.level === 2)
    .map((h) => ({ id: h.id, text: h.text }));

  const meta = sectionMetaLine(section.slug, section.body);
  const cmds = relatedCommandsFor(section.slug);

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <Link href="/rulebook">룰북</Link>
        <span className="sep">/</span>
        <span>{section.title}</span>
      </div>

      <WikiLayout
        nav={nav}
        activeSlug={section.slug}
        anchors={
          anchors.length > 0
            ? anchors
            : [{ id: slug + "-top", text: section.title }]
        }
        related={{ cmds }}
      >
        <h1>{section.title}</h1>
        <div className="subhead">
          {meta.map((m, i) => (
            <span key={i}>
              {i > 0 ? <span>·</span> : null}
              {m}
            </span>
          ))}
          <span>·</span>
          <span className="tag-pill accent">{section.slug === "checks" ? "자주 쓰임" : "코어"}</span>
        </div>

        <WikiSection
          id={slug + "-top"}
          title={section.title}
          anchor={slug}
        >
          <MarkdownLite text={section.body} />
        </WikiSection>
      </WikiLayout>
    </>
  );
}

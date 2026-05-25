import Link from "next/link";
import { notFound } from "next/navigation";
import { findRelatedBestiary, getBestiaryEntry } from "@/lib/db";
import { getAuthenticatedNickname } from "@/lib/auth";
import { StatBlock } from "@/components/vtt/StatBlock";
import { ThreatStars } from "@/components/vtt/ThreatStars";

export const dynamic = "force-dynamic";

export default async function BestiaryDetail({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getBestiaryEntry(slug);
  if (!e) notFound();
  const nick = await getAuthenticatedNickname();
  const isAuthor = nick != null && e.created_by === nick;
  const related = await findRelatedBestiary(slug, e.category || "", 4);

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <Link href="/bestiary">베스티어리</Link>
        <span className="sep">/</span>
        <span>{e.name}</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "0.85rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <ThreatStars entry={e} />
          <span className={`bestiary-author${e.created_by ? " user" : ""}`}>
            {e.created_by ? `@${e.created_by} 등록` : "코어 룰북"}
          </span>
        </div>
        {isAuthor ? (
          <Link href={`/bestiary/${slug}/edit`} className="btn ghost">
            편집
          </Link>
        ) : null}
      </div>

      <StatBlock entry={e} />

      {related.length > 0 ? (
        <>
          <div className="section-head">
            <h2>비슷한 분류</h2>
            <span className="count">{related.length}개</span>
          </div>
          <div className="related-bestiary">
            {related.map((r) => (
              <Link key={r.id} href={`/bestiary/${r.slug}`} className="mini-card">
                <div className="n">{r.name}</div>
                <div className="c">{r.category || "—"} · HP {r.attrs.hp ?? "—"}</div>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

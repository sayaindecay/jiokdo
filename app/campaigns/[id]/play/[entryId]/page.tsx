import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaign, getPlayEntry } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/dice";
import { speakerHueStyle } from "@/lib/hue";

export const dynamic = "force-dynamic";

function kindLabel(k: string): string {
  if (k === "narration") return "내레이션";
  if (k === "system") return "시스템";
  return "발화";
}

export default async function PlayEntryDetail({
  params,
}: { params: Promise<{ id: string; entryId: string }> }) {
  const { id: idStr, entryId: entryStr } = await params;
  const id = Number(idStr);
  const entryId = Number(entryStr);
  if (!Number.isFinite(id) || !Number.isFinite(entryId)) notFound();
  const [camp, entry] = await Promise.all([
    getCampaign(id),
    getPlayEntry(entryId),
  ]);
  if (!camp || !entry || entry.campaign_id !== id) notFound();

  const author = entry.character_name || entry.nickname;
  const isKeeperEntry = entry.nickname === camp.keeper_nick;
  const firstText = entry.segments.find((s) => s.type === "text") as
    | { type: "text"; value: string } | undefined;
  const fallbackTitle = firstText
    ? firstText.value.split(/\n/)[0].slice(0, 60) || "(빈 글)"
    : "(굴림만 있는 글)";
  const title = entry.title || fallbackTitle;

  return (
    <div className="entry-detail-shell">
      <div className="breadcrumb">
        <Link href={`/campaigns/${id}`}>{camp.name}</Link>
        <span className="sep">/</span>
        <Link href={`/campaigns/${id}/play`}>플레이</Link>
        <span className="sep">/</span>
        <span>{title}</span>
      </div>

      <article
        className={`entry-detail kind-${entry.kind}${isKeeperEntry ? " is-keeper" : ""}`}
        style={speakerHueStyle(author)}
      >
        <header className="ed-head">
          <span className={`kind-tag kind-${entry.kind}`}>{kindLabel(entry.kind)}</span>
          <h1 className="ed-title">{title}</h1>
          <div className="ed-meta">
            <span className="ed-author">
              {isKeeperEntry ? <span aria-hidden="true" className="ks-crown">♛ </span> : null}
              {author}
            </span>
            <span className="ed-sep" aria-hidden="true">·</span>
            <span className="ed-time">{formatTime(entry.created_at)}</span>
          </div>
        </header>

        <div className="ed-body">
          {entry.segments.map((seg, i) => {
            if (seg.type === "text") {
              return <p key={i} className="ed-text">{seg.value}</p>;
            }
            const r = seg.result;
            if (r.kind === "cc") {
              return (
                <div key={i} className={`ed-dice cc level ${r.level}`}>
                  <span className="ed-dice-icon" aria-hidden="true">⌬</span>
                  <span className="ed-dice-expr">
                    {r.name ? `${r.name} (${r.skill})` : `1d100 ≤ ${r.skill}`}
                  </span>
                  <span className="ed-dice-arrow" aria-hidden="true">→</span>
                  <span className="ed-dice-total">{r.roll}</span>
                  <span className={`ed-dice-level level ${r.level}`}>
                    {LEVEL_LABEL[r.level]}
                  </span>
                </div>
              );
            }
            return (
              <div key={i} className="ed-dice plain">
                <span className="ed-dice-icon" aria-hidden="true">⌬</span>
                <span className="ed-dice-expr">{r.notation}</span>
                <span className="ed-dice-arrow" aria-hidden="true">=</span>
                <span className="ed-dice-total">{r.total}</span>
              </div>
            );
          })}
        </div>

        <footer className="ed-foot">
          <Link href={`/campaigns/${id}/play`} className="btn ghost">
            ← 목록으로
          </Link>
        </footer>
      </article>
    </div>
  );
}

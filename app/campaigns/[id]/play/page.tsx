import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, listCampaignCharacters, listCampaignMembers, listClues,
  listPlayEntries, listSessions,
} from "@/lib/db";
import { formatTime } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/dice";
import { SceneStage } from "@/components/vtt/SceneStage";
import { CluesPanel, SceneRoster } from "@/components/vtt/SceneRoster";
import { PlayComposerSticky } from "@/components/vtt/PlayComposerSticky";
import type { PlayEntry, Segment } from "@/lib/types";

export const dynamic = "force-dynamic";

type DiceMini =
  | { kind: "cc"; expr: string; total: number; level: string; level_label: string }
  | { kind: "roll"; notation: string; total: number };

function diceMini(segs: Segment[]): DiceMini[] {
  const out: DiceMini[] = [];
  for (const s of segs) {
    if (s.type !== "dice") continue;
    const r = s.result;
    if (r.kind === "cc") {
      out.push({
        kind: "cc",
        expr: `${r.name ? `${r.name} ` : ""}d100≤${r.skill} → ${r.roll}`,
        total: r.roll,
        level: r.level,
        level_label: LEVEL_LABEL[r.level],
      });
    } else {
      out.push({ kind: "roll", notation: r.notation, total: r.total });
    }
  }
  return out;
}

function textFromSegs(segs: Segment[]): string {
  const t = segs.find((s) => s.type === "text") as { type: "text"; value: string } | undefined;
  return t ? t.value : "";
}

function kindLabel(k: string): string {
  if (k === "narration") return "묘사";
  if (k === "system") return "시스템";
  return "발화";
}

export default async function PlayPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const camp = await getCampaign(id);
  if (!camp) notFound();
  const [nick, entries, members, characters, sessions, clues] = await Promise.all([
    getNickname(),
    listPlayEntries(id),
    listCampaignMembers(id),
    listCampaignCharacters(id),
    listSessions(id),
    listClues(id),
  ]);

  const isMember = nick != null && members.some((m) => m.nickname === nick);
  const myChar = nick ? characters.find((c) => c.owner_nick === nick) ?? null : null;
  const currentSession = sessions[0] ?? null;

  // 가장 최근 → 옛 순서의 묘사 흐름 (5.2)
  const narrationHistory: PlayEntry[] = [...entries]
    .reverse()
    .filter((e) => e.kind === "narration")
    .slice(0, 3);

  const recentEntries = [...entries].reverse().slice(0, 8);

  return (
    <div className="play-shell">
      <div className="breadcrumb">
        <Link href={`/campaigns/${camp.id}`}>{camp.name}</Link>
        <span className="sep">/</span>
        {currentSession ? (
          <>
            <Link href={`/campaigns/${camp.id}/scene`}>세션 #{currentSession.number}</Link>
            <span className="sep">/</span>
          </>
        ) : null}
        <span>플레이</span>
      </div>

      <div className="scene-side">
        <SceneStage
          campaign={camp}
          session={currentSession}
          narrationHistory={narrationHistory}
          myCharacter={myChar}
          onlineCount={members.length}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SceneRoster members={members} characters={characters} myNick={nick} />
          <CluesPanel clues={clues} />
        </div>
      </div>

      <div className="section-head">
        <h2>세션 로그</h2>
        <span className="count">
          최근 {recentEntries.length}개 · <Link href="/search">전체 검색 →</Link>
        </span>
      </div>
      {recentEntries.length === 0 ? (
        <div className="empty">
          아직 기록이 없습니다. {isMember ? "아래 composer에서 첫 글을 남겨보세요." : "이 캠페인의 멤버가 아닙니다."}
        </div>
      ) : (
        <div className="post-list session-log">
          {recentEntries.map((e) => {
            const dice = diceMini(e.segments);
            const text = textFromSegs(e.segments);
            const author = e.character_name || e.nickname;
            const preview = text ? text.slice(0, 80) : null;
            return (
              <div className={`post-row session-row kind-${e.kind}`} key={e.id}>
                <div className="session-row-main">
                  <span className={`kind-tag kind-${e.kind}`}>{kindLabel(e.kind)}</span>
                  <span className="session-author">{author}</span>
                  {preview ? <span className="session-preview">{preview}{text.length > 80 ? "…" : ""}</span> : null}
                  {/* 5.7 dice 결과 인라인 chip */}
                  {dice.length > 0 ? (
                    <span className="session-dice-row">
                      {dice.map((d, i) =>
                        d.kind === "cc" ? (
                          <span key={i} className={`session-dice cc level ${d.level}`} title={d.expr}>
                            <span className="dice-icon" aria-hidden="true">⌬</span>
                            {d.level_label} · {d.total}
                          </span>
                        ) : (
                          <span key={i} className="session-dice plain" title={d.notation}>
                            <span className="dice-icon" aria-hidden="true">⌬</span>
                            {d.notation} = {d.total}
                          </span>
                        )
                      )}
                    </span>
                  ) : null}
                </div>
                <div className="session-meta">{formatTime(e.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}

      {isMember ? (
        <PlayComposerSticky
          campaignId={id}
          characters={
            nick
              ? characters
                  .filter((c) => c.owner_nick === nick)
                  .map((c) => ({ id: c.id, name: c.name }))
              : []
          }
          isKeeper={nick === camp.keeper_nick}
        />
      ) : (
        <div className="empty" style={{ marginTop: "1.25rem" }}>
          이 캠페인의 멤버가 아닙니다. <Link href="/campaigns">캠페인 목록</Link>에서 초대 코드로 참여하세요.
        </div>
      )}
    </div>
  );
}

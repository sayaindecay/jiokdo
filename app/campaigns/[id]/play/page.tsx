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
import { PlayComposer } from "@/components/PlayComposer";
import type { Segment } from "@/lib/types";

export const dynamic = "force-dynamic";

function summarizeSegments(segs: Segment[]): { line: string; tail?: string } {
  for (const s of segs) {
    if (s.type === "dice") {
      if (s.result.kind === "cc") {
        return {
          line: `${s.result.name ? `${s.result.name} ` : ""}/cc ${s.result.skill} → ${s.result.roll}`,
          tail: LEVEL_LABEL[s.result.level],
        };
      }
      return { line: `${s.result.notation} → ${s.result.total}`, tail: undefined };
    }
  }
  const text = segs.find((s) => s.type === "text") as { type: "text"; value: string } | undefined;
  return { line: text ? text.value.slice(0, 80) : "(빈 글)" };
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

  const lastNarration = [...entries].reverse().find((e) => e.kind === "narration") ?? null;
  const recentEntries = [...entries].reverse().slice(0, 8);

  return (
    <>
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
          lastNarration={lastNarration}
          myCharacter={myChar}
          onlineCount={members.length}
          round={null}
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
        <div className="post-list">
          {recentEntries.map((e) => {
            const sum = summarizeSegments(e.segments);
            const author = e.character_name || e.nickname;
            return (
              <div className="post-row" key={e.id}>
                <div>
                  <span className="title">
                    {author}: {sum.line}
                  </span>
                  {sum.tail ? <span className="comment-count">{sum.tail}</span> : null}
                </div>
                <div className="meta">
                  {kindLabel(e.kind)} · {formatTime(e.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isMember ? (
        <div id="composer" style={{ marginTop: "1.25rem" }}>
          <PlayComposer
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
        </div>
      ) : (
        <div className="empty" style={{ marginTop: "1.25rem" }}>
          이 캠페인의 멤버가 아닙니다. <Link href="/campaigns">캠페인 목록</Link>에서 초대 코드로 참여하세요.
        </div>
      )}
    </>
  );
}

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
import { SceneSpotlight } from "@/components/vtt/SceneSpotlight";
import { CluesPanel, SceneRoster } from "@/components/vtt/SceneRoster";
import { MySheetPanel } from "@/components/vtt/MySheetPanel";
import { PlayComposerSticky } from "@/components/vtt/PlayComposerSticky";
import { speakerHueStyle } from "@/lib/hue";
import type { PlayEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

function kindLabel(k: string): string {
  if (k === "narration") return "내레이션";
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
  const myChars = nick ? characters.filter((c) => c.owner_nick === nick) : [];
  const myChar = myChars[0] ?? null;
  const currentSession = sessions[0] ?? null;
  const isKeeper = nick != null && nick === camp.keeper_nick;
  const lastEntry: PlayEntry | null = entries.length > 0 ? entries[entries.length - 1] : null;
  const lastEntryAuthor = lastEntry
    ? (lastEntry.character_name || lastEntry.nickname)
    : null;
  const myCharName = myChar?.name ?? null;
  const isMyTurn =
    isMember &&
    lastEntry != null &&
    lastEntryAuthor !== myCharName &&
    lastEntryAuthor !== nick;

  // 게시판 스타일 — 오래된 것 → 최신 (composer 가 화면 하단이라 spatial 흐름이 자연스러움)
  const recentEntries = entries.slice(-12);

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
        <div className="scene-col">
          <SceneStage
            campaign={camp}
            session={currentSession}
            lastEntry={lastEntry}
            memberCount={members.length}
            isKeeper={isKeeper}
          />
          <SceneSpotlight
            campaignId={id}
            scenePin={camp.scene_pin}
            clues={clues}
            isKeeper={isKeeper}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isMember ? <MySheetPanel characters={myChars} campaignId={id} /> : null}
          <SceneRoster members={members} characters={characters} myNick={nick} />
          <CluesPanel clues={clues} campaignId={id} isKeeper={isKeeper} />
        </div>
      </div>

      <div className="section-head">
        <h2>세션 로그</h2>
        <span className="count">
          최근 {recentEntries.length}개
        </span>
      </div>
      {recentEntries.length === 0 ? (
        <div className="empty">
          아직 기록이 없습니다. {isMember ? "아래 composer에서 첫 글을 남겨보세요." : "이 캠페인의 멤버가 아닙니다."}
        </div>
      ) : (
        <div className="session-log">
          {recentEntries.map((e) => {
            const author = e.character_name || e.nickname;
            const isKeeperEntry = e.nickname === camp.keeper_nick;
            return (
              <article
                className={`session-post kind-${e.kind}${isKeeperEntry ? " is-keeper" : ""}`}
                key={e.id}
                style={speakerHueStyle(author)}
              >
                <header className="sp-head">
                  <span className={`kind-tag kind-${e.kind}`}>{kindLabel(e.kind)}</span>
                  <span className="sp-author">
                    {isKeeperEntry ? <span aria-hidden="true" className="ks-crown">♛ </span> : null}
                    {author}
                  </span>
                  <span className="sp-time">{formatTime(e.created_at)}</span>
                </header>
                <div className="sp-body">
                  {e.segments.map((seg, i) => {
                    if (seg.type === "text") {
                      return (
                        <p key={i} className="sp-text">{seg.value}</p>
                      );
                    }
                    const r = seg.result;
                    if (r.kind === "cc") {
                      return (
                        <div key={i} className={`sp-dice cc level ${r.level}`}>
                          <span className="sp-dice-icon" aria-hidden="true">⌬</span>
                          <span className="sp-dice-expr">
                            {r.name ? `${r.name} (${r.skill})` : `1d100 ≤ ${r.skill}`}
                          </span>
                          <span className="sp-dice-arrow" aria-hidden="true">→</span>
                          <span className="sp-dice-total">{r.roll}</span>
                          <span className={`sp-dice-level level ${r.level}`}>
                            {LEVEL_LABEL[r.level]}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="sp-dice plain">
                        <span className="sp-dice-icon" aria-hidden="true">⌬</span>
                        <span className="sp-dice-expr">{r.notation}</span>
                        <span className="sp-dice-arrow" aria-hidden="true">=</span>
                        <span className="sp-dice-total">{r.total}</span>
                      </div>
                    );
                  })}
                </div>
              </article>
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
          isKeeper={isKeeper}
          isMyTurn={isMyTurn}
          hasEntries={entries.length > 0}
        />
      ) : (
        <div className="empty" style={{ marginTop: "1.25rem" }}>
          이 캠페인의 멤버가 아닙니다. <Link href="/campaigns">캠페인 목록</Link>에서 초대 코드로 참여하세요.
        </div>
      )}
    </div>
  );
}

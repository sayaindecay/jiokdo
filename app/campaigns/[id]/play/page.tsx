import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, listCampaignCharacters, listCampaignMembers, listClues,
  listPlayEntries, listSessions,
} from "@/lib/db";
import { SceneStage } from "@/components/vtt/SceneStage";
import { SceneSpotlight } from "@/components/vtt/SceneSpotlight";
import { CluesPanel, SceneRoster } from "@/components/vtt/SceneRoster";
import { MySheetPanel } from "@/components/vtt/MySheetPanel";
import { PlayComposerSticky } from "@/components/vtt/PlayComposerSticky";
import { PostBoard } from "@/components/vtt/PostBoard";
import type { PlayEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  // 게시판 스타일 — 최신 글이 맨 위 (역순)
  const recentEntries = [...entries].slice(-20).reverse();

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
        <PostBoard
          entries={recentEntries}
          keeperNick={camp.keeper_nick}
          currentNick={nick}
          campaignId={id}
        />
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

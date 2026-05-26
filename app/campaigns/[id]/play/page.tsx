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

const PAGE_SIZE = 15;

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id: idStr } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, Number(sp.page ?? 1) || 1);
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

  // 게시판 — 최신 글이 맨 위 (역순) + 15개씩 페이지네이션
  const sortedDesc = [...entries].reverse();
  const totalPages = Math.max(1, Math.ceil(sortedDesc.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEntries = sortedDesc.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="play-shell">
      <div className="play-topbar">
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
        <Link
          href={`/campaigns/${camp.id}/scene`}
          className="play-tracker-link"
          title="이니셔티브 / NPC HP / 장면 추적"
        >
          ⊞ 장면 트래커 →
        </Link>
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
          총 {sortedDesc.length}개 · {page} / {totalPages} 페이지
        </span>
      </div>
      {sortedDesc.length === 0 ? (
        <div className="empty">
          아직 기록이 없습니다. {isMember ? "아래 composer에서 첫 글을 남겨보세요." : "이 캠페인의 멤버가 아닙니다."}
        </div>
      ) : (
        <>
          <PostBoard
            entries={pageEntries}
            keeperNick={camp.keeper_nick}
            currentNick={nick}
            campaignId={id}
          />
          {totalPages > 1 ? (
            <nav className="pagination" aria-label="세션 로그 페이지">
              {page > 1 ? (
                <Link
                  href={`/campaigns/${id}/play?page=${page - 1}`}
                  scroll={false}
                >
                  ← 이전
                </Link>
              ) : (
                <span className="disabled">← 이전</span>
              )}
              <span className="info">
                {page} / {totalPages} 페이지
              </span>
              {page < totalPages ? (
                <Link
                  href={`/campaigns/${id}/play?page=${page + 1}`}
                  scroll={false}
                >
                  다음 →
                </Link>
              ) : (
                <span className="disabled">다음 →</span>
              )}
            </nav>
          ) : null}
        </>
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
          lastEntryId={lastEntry?.id ?? null}
        />
      ) : (
        <div className="empty" style={{ marginTop: "1.25rem" }}>
          이 캠페인의 멤버가 아닙니다. <Link href="/campaigns">캠페인 목록</Link>에서 초대 코드로 참여하세요.
        </div>
      )}
    </div>
  );
}

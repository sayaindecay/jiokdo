import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, listAllCharactersOwnedBy, listBestiary,
  listCampaignCharacters, listCampaignMembers, listClues,
  listPlayEntries, listSessions,
} from "@/lib/db";
import { SceneStage } from "@/components/vtt/SceneStage";
import { SceneSpotlight } from "@/components/vtt/SceneSpotlight";
import { CluesPanel, SceneRoster } from "@/components/vtt/SceneRoster";
import { MySheetPanel } from "@/components/vtt/MySheetPanel";
import { PlayComposerSticky } from "@/components/vtt/PlayComposerSticky";
import { PostBoard } from "@/components/vtt/PostBoard";
import { TrackerPanel, type PcLite } from "@/components/vtt/TrackerPanel";
import type { Character, PlayEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

type Mode = "scene" | "tracker";

function toPcLite(c: Character): PcLite {
  return {
    id: c.id,
    name: c.name,
    occupation: c.occupation,
    attrs: c.attrs,
    hp: c.hp,
    hp_max: c.hp_max,
    skills: c.skills.map((s) => ({ name: s.name, value: s.value, group: s.group })),
    weapons: c.weapons.map((w) => ({ name: w.name, skill: w.skill, damage: w.damage })),
  };
}

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; mode?: string }>;
}) {
  const { id: idStr } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, Number(sp.page ?? 1) || 1);
  const mode: Mode = sp.mode === "tracker" ? "tracker" : "scene";
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

  // 트래커 모드일 때 필요한 추가 데이터
  const trackerData = mode === "tracker"
    ? {
        bestiary: await listBestiary(),
        keeperChars: isKeeper
          ? (await listAllCharactersOwnedBy(camp.keeper_nick)).map(toPcLite)
          : [],
        pcChars: characters.map(toPcLite),
        initialRows: characters.map((c) => ({
          id: `pc-${c.id}`,
          dex: c.attrs.dex,
          name: c.name,
          is_pc: true,
          hp: c.hp,
          hp_max: c.hp_max,
        })),
      }
    : null;

  // 세션 + 전투 로그 통합 게시판 — 최신 글이 맨 위 (역순) + 15개씩 페이지네이션
  const sortedDesc = [...entries].reverse();
  const totalPages = Math.max(1, Math.ceil(sortedDesc.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEntries = sortedDesc.slice(pageStart, pageStart + PAGE_SIZE);

  const sceneLink = `/campaigns/${camp.id}/play`;
  const trackerLink = `/campaigns/${camp.id}/play?mode=tracker`;

  return (
    <div className="play-shell">
      <div className="play-topbar">
        <div className="breadcrumb">
          <Link href={`/campaigns/${camp.id}`}>{camp.name}</Link>
          <span className="sep">/</span>
          {currentSession ? (
            <>
              <span>세션 #{currentSession.number}</span>
              <span className="sep">/</span>
            </>
          ) : null}
          <span>{mode === "tracker" ? "플레이 · 트래커" : "플레이"}</span>
        </div>
        <div className="play-mode-toggle" role="tablist" aria-label="모드 전환">
          <Link
            href={sceneLink}
            className={`play-mode-tab${mode === "scene" ? " active" : ""}`}
            role="tab"
            aria-selected={mode === "scene"}
            prefetch={false}
          >
            ▷ 장면
          </Link>
          <Link
            href={trackerLink}
            className={`play-mode-tab${mode === "tracker" ? " active" : ""}`}
            role="tab"
            aria-selected={mode === "tracker"}
            prefetch={false}
          >
            ⊞ 트래커
          </Link>
        </div>
      </div>

      {mode === "tracker" && trackerData ? (
        <TrackerPanel
          campaignId={id}
          initialRows={trackerData.initialRows}
          bestiary={trackerData.bestiary}
          pcChars={trackerData.pcChars}
          keeperChars={trackerData.keeperChars}
        />
      ) : (
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
      )}

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
                  href={`/campaigns/${id}/play?page=${page - 1}${mode === "tracker" ? "&mode=tracker" : ""}`}
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
                  href={`/campaigns/${id}/play?page=${page + 1}${mode === "tracker" ? "&mode=tracker" : ""}`}
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

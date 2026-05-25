import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, listCampaignCharacters, listCampaignMembers, listPlayEntries,
} from "@/lib/db";
import { formatTime } from "@/lib/format";
import { ContentRenderer } from "@/components/ContentRenderer";
import { PlayComposer } from "@/components/PlayComposer";

export const dynamic = "force-dynamic";

export default async function PlayPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const camp = await getCampaign(id);
  if (!camp) notFound();
  const nick = await getNickname();
  const [entries, members, characters] = await Promise.all([
    listPlayEntries(id),
    listCampaignMembers(id),
    listCampaignCharacters(id),
  ]);
  const isMember = nick != null && members.some((m) => m.nickname === nick);
  const myChars = nick ? characters.filter((c) => c.owner_nick === nick) : [];

  return (
    <div className="play-page">
      <div className="breadcrumb">
        <Link href="/campaigns">캠페인</Link>
        <span className="sep">/</span>
        <Link href={`/campaigns/${camp.id}`}>{camp.name}</Link>
        <span className="sep">/</span>
        <span>플레이</span>
      </div>

      <div className="play-header">
        <h1 className="page-title">{camp.name}</h1>
        <Link href={`/campaigns/${camp.id}`} className="btn ghost small">
          대시보드
        </Link>
      </div>

      <div className="play-log">
        {entries.length === 0 ? (
          <div className="empty">아직 기록이 없습니다. 키퍼가 첫 내레이션을 남겨보세요.</div>
        ) : (
          entries.map((e) => (
            <article key={e.id} className={`play-entry kind-${e.kind}`}>
              <header>
                <span className="speaker">
                  {e.character_name || e.nickname}
                </span>
                {e.character_name ? (
                  <span className="speaker-sub">@{e.nickname}</span>
                ) : null}
                <span className={`kind-badge kind-${e.kind}`}>
                  {labelKind(e.kind)}
                </span>
                <time>{formatTime(e.created_at)}</time>
              </header>
              <ContentRenderer segments={e.segments} />
            </article>
          ))
        )}
      </div>

      {isMember ? (
        <PlayComposer
          campaignId={id}
          characters={myChars.map((c) => ({ id: c.id, name: c.name }))}
          isKeeper={nick === camp.keeper_nick}
        />
      ) : (
        <div className="empty">
          이 캠페인의 멤버가 아닙니다. <Link href="/campaigns">캠페인 목록</Link>에서 초대 코드로 참여하세요.
        </div>
      )}
    </div>
  );
}

function labelKind(k: string): string {
  if (k === "narration") return "내레이션";
  if (k === "system") return "시스템";
  return "발화";
}

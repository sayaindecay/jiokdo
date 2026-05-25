import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, listClues, listCampaignCharacters, listCampaignMembers,
  listPlayEntries, listSessions,
} from "@/lib/db";
import { formatTime } from "@/lib/format";
import { CharacterCreateForm } from "@/components/CharacterCreateForm";
import { CampaignDangerZone } from "@/components/vtt/CampaignDangerZone";

export const dynamic = "force-dynamic";

export default async function CampaignDashboard({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const camp = await getCampaign(id);
  if (!camp) notFound();
  const nick = await getNickname();
  const [members, chars, entries, sessions, clues] = await Promise.all([
    listCampaignMembers(id),
    listCampaignCharacters(id),
    listPlayEntries(id),
    listSessions(id),
    listClues(id),
  ]);
  const isKeeper = nick === camp.keeper_nick;
  const isMember = nick != null && members.some((m) => m.nickname === nick);
  const recent = entries.slice(-5).reverse();

  return (
    <>
      <div className="breadcrumb">
        <Link href="/campaigns">캠페인</Link>
        <span className="sep">/</span>
        <span>{camp.name}</span>
      </div>

      <div className="campaign-header">
        <div>
          <h1 className="page-title">{camp.name}</h1>
          <p className="page-sub">{camp.description || "설명 없음"}</p>
        </div>
        <Link href={`/campaigns/${id}/play`} className="btn large">
          플레이 페이지 →
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dash-card">
          <h2>멤버 ({members.length})</h2>
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.nickname}>
                <span className="nickname">{m.nickname}</span>
                <span className={`role-badge ${m.role}`}>
                  {m.role === "keeper" ? "키퍼" : "플레이어"}
                </span>
              </li>
            ))}
          </ul>
          {isKeeper ? (
            <div className="invite-box">
              <div className="label">초대 코드</div>
              <code className="invite-code">{camp.invite_code}</code>
              <p className="hint">플레이어에게 이 코드를 알려주세요.</p>
            </div>
          ) : null}
        </section>

        <section className="dash-card">
          <h2>캐릭터 ({chars.length})</h2>
          {chars.length === 0 ? (
            <p className="text-faint">아직 등록된 캐릭터가 없습니다.</p>
          ) : (
            <ul className="character-list">
              {chars.map((c) => (
                <li key={c.id}>
                  <Link href={`/characters/${c.id}`}>
                    <span className="char-name">{c.name}</span>
                    <span className="char-occu">{c.occupation || "—"}</span>
                  </Link>
                  <span className="text-faint small">@{c.owner_nick}</span>
                </li>
              ))}
            </ul>
          )}
          {isMember ? <CharacterCreateForm campaignId={id} /> : null}
        </section>

        <section className="dash-card span-2">
          <h2>최근 플레이 ({entries.length}건)</h2>
          {recent.length === 0 ? (
            <p className="text-faint">아직 플레이 로그가 없습니다.</p>
          ) : (
            <ul className="recent-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <span className="nickname">
                    {e.character_name || e.nickname}
                  </span>
                  <span className="kind-badge">{labelKind(e.kind)}</span>
                  <span className="text-faint small">{formatTime(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/campaigns/${id}/play`} className="btn ghost" style={{ marginTop: "0.7rem" }}>
            전체 보기
          </Link>
        </section>
      </div>

      {isKeeper ? (
        <CampaignDangerZone
          campaignId={id}
          campaignName={camp.name}
          counts={{
            members: members.length,
            characters: chars.length,
            sessions: sessions.length,
            clues: clues.length,
            play_entries: entries.length,
          }}
        />
      ) : null}
    </>
  );
}

function labelKind(k: string): string {
  if (k === "narration") return "내레이션";
  if (k === "system") return "시스템";
  return "발화";
}

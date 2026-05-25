import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, listClues, listCampaignCharacters, listCampaignMembers,
  listPlayEntries, listSessions,
} from "@/lib/db";
import { formatTime } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/dice";
import { campaignHueStyle } from "@/lib/hue";
import { CharacterCreateForm } from "@/components/CharacterCreateForm";
import { CampaignDangerZone } from "@/components/vtt/CampaignDangerZone";
import { CopyButton } from "@/components/vtt/CopyButton";
import { EmptyState } from "@/components/vtt/EmptyState";
import type { Segment } from "@/lib/types";

export const dynamic = "force-dynamic";

function summaryOf(segs: Segment[]): string {
  for (const s of segs) {
    if (s.type === "dice") {
      if (s.result.kind === "cc") {
        return `${s.result.name ?? "1d100"} → ${s.result.roll} ${LEVEL_LABEL[s.result.level]}`;
      }
      return `${s.result.notation} = ${s.result.total}`;
    }
  }
  const t = segs.find((s) => s.type === "text") as { type: "text"; value: string } | undefined;
  return t ? t.value.slice(0, 60) : "(빈 글)";
}

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
    <div style={campaignHueStyle(camp.slug)}>
      <div className="breadcrumb">
        <Link href="/campaigns">캠페인</Link>
        <span className="sep">/</span>
        <span>{camp.name}</span>
      </div>

      {/* 4.5 헤더 — 모바일에서 줄바꿈 처리 + sticky 친절성 */}
      <div className="campaign-header">
        <div className="ch-text">
          <h1 className="page-title">{camp.name}</h1>
          <p className="page-sub">{camp.description || "설명 없음"}</p>
        </div>
        <div className="ch-actions">
          <Link href={`/campaigns/${id}/scene`} className="btn ghost">
            장면 트래커
          </Link>
          <Link href={`/campaigns/${id}/play`} className="btn primary">
            플레이 페이지 →
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* 멤버 */}
        <section className="dash-card">
          <h2>멤버 ({members.length})</h2>
          <ul className="member-list">
            {members.map((m) => {
              const isKp = m.role === "keeper";
              return (
                <li key={m.nickname} className={isKp ? "member-keeper" : ""}>
                  <span className="nickname">
                    {isKp ? <span aria-hidden="true" className="keeper-crown">♛</span> : null}
                    {m.nickname}
                  </span>
                  <span className={`role-badge ${m.role}`}>
                    {isKp ? "키퍼" : "플레이어"}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* 4.2 초대 코드 복사 */}
          {isKeeper ? (
            <div className="invite-box">
              <div className="label">초대 코드</div>
              <div className="invite-row">
                <code className="invite-code">{camp.invite_code}</code>
                <CopyButton value={camp.invite_code} label="복사" copiedLabel="복사됨" />
              </div>
              <p className="hint">플레이어에게 이 코드를 알려주세요.</p>
            </div>
          ) : null}
        </section>

        {/* 캐릭터 */}
        <section className="dash-card">
          <h2>캐릭터 ({chars.length})</h2>
          {chars.length === 0 ? (
            <EmptyState
              variant="scroll"
              title="아직 캐릭터가 없습니다"
              hint={isMember ? "아래에서 새 캐릭터를 등록하세요." : "멤버만 캐릭터를 만들 수 있습니다."}
            />
          ) : (
            <ul className="character-list">
              {chars.map((c) => {
                const mine = nick != null && c.owner_nick === nick;
                return (
                  <li key={c.id} className={mine ? "char-mine" : ""}>
                    <Link href={`/characters/${c.id}`}>
                      <span className="char-name">{c.name}</span>
                      <span className="char-occu">{c.occupation || "—"}</span>
                    </Link>
                    <span className="text-faint small">@{c.owner_nick}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {isMember ? <CharacterCreateForm campaignId={id} /> : null}
        </section>

        {/* 4.4 최근 플레이 — 각 항목 링크 */}
        <section className="dash-card span-2">
          <h2>최근 플레이 ({entries.length}건)</h2>
          {recent.length === 0 ? (
            <EmptyState
              variant="dice"
              title="아직 플레이 로그가 없습니다"
              hint="플레이 페이지에서 첫 글을 남겨보세요."
              action={
                isMember ? (
                  <Link href={`/campaigns/${id}/play`} className="btn primary">
                    플레이 페이지 →
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <ul className="recent-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/campaigns/${id}/play#entry-${e.id}`} className="recent-link">
                    <span className="nickname">{e.character_name || e.nickname}</span>
                    <span className={`kind-badge kind-${e.kind}`}>{labelKind(e.kind)}</span>
                    <span className="recent-summary">{summaryOf(e.segments)}</span>
                  </Link>
                  <span className="text-faint small">{formatTime(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          {entries.length > 0 ? (
            <Link href={`/campaigns/${id}/play`} className="btn ghost" style={{ marginTop: "0.7rem" }}>
              전체 보기
            </Link>
          ) : null}
        </section>
      </div>

      {/* 4.7 위험 영역과 구분 */}
      {isKeeper ? (
        <>
          <div className="danger-divider" aria-hidden="true">
            <span>키퍼 전용</span>
          </div>
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
        </>
      ) : null}
    </div>
  );
}

function labelKind(k: string): string {
  if (k === "narration") return "내레이션";
  if (k === "system") return "시스템";
  return "발화";
}

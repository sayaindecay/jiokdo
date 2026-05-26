import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, getCampaignDisplayNumber, listClues, listCampaignCharacters,
  listCampaignMembers, listPlayEntries, listSessions,
} from "@/lib/db";
import { formatTime } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/dice";
import { campaignHueStyle } from "@/lib/hue";
import { CharacterCreateForm } from "@/components/CharacterCreateForm";
import { CampaignDangerZone } from "@/components/vtt/CampaignDangerZone";
import { CampaignProfileEditor } from "@/components/vtt/CampaignProfileEditor";
import { CampaignStatusToggle } from "@/components/vtt/CampaignStatusToggle";
import { CopyButton } from "@/components/vtt/CopyButton";
import { EmptyState } from "@/components/vtt/EmptyState";
import { InviteShareLink } from "@/components/vtt/InviteShareLink";
import { KeeperChecklist } from "@/components/vtt/KeeperChecklist";
import type { Segment } from "@/lib/types";

export const dynamic = "force-dynamic";

function summaryOf(segs: Segment[]): string {
  for (const s of segs) {
    if (s.type === "dice") {
      if (s.result.kind === "cc") {
        const prefix = s.result.name ? `${s.result.name} → ` : "";
        return `${prefix}${s.result.roll} ${LEVEL_LABEL[s.result.level]}`;
      }
      return `굴림 결과 ${s.result.total}`;
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
  const [members, chars, entries, sessions, clues, displayNum] = await Promise.all([
    listCampaignMembers(id),
    listCampaignCharacters(id),
    listPlayEntries(id),
    listSessions(id),
    listClues(id),
    getCampaignDisplayNumber(id, camp.keeper_nick),
  ]);
  const isKeeper = nick === camp.keeper_nick;
  const isMember = nick != null && members.some((m) => m.nickname === nick);
  const recent = entries.slice(-5).reverse();
  const campaignNum = String(displayNum).padStart(2, "0");

  return (
    <div className="campaign-dashboard" style={campaignHueStyle(camp.slug)}>
      <div className="breadcrumb">
        <Link href="/campaigns">캠페인</Link>
        <span className="sep">/</span>
        <span>{camp.name}</span>
      </div>

      {/* ─── 헤더 — 명조 제목 + 산세리프 설명 + mono 메타 + 액션 ─── */}
      <header className="cd-header">
        <div className="cd-head-block">
          {isKeeper ? (
            <CampaignProfileEditor
              campaignId={id}
              campaignNum={campaignNum}
              system={camp.system}
              initialName={camp.name}
              initialDescription={camp.description}
            />
          ) : (
            <div className="cd-head-text">
              <div className="cd-eyebrow">
                캠페인 №{campaignNum} · {camp.system.toUpperCase()}
              </div>
              <h1 className="cd-title">{camp.name}</h1>
              {camp.description ? (
                <p className="cd-description">{camp.description}</p>
              ) : (
                <p className="cd-description cd-description-empty">
                  설명이 아직 비어 있습니다.
                </p>
              )}
            </div>
          )}

          {isKeeper ? (
            <CampaignStatusToggle campaignId={id} current={camp.status} />
          ) : (
            <div className="cd-status-readonly">
              <span className="cd-status-label">상태</span>
              <span className={`cd-status-pill st-${camp.status}`}>
                {camp.status === "active" ? "활성" : camp.status === "dormant" ? "휴면" : "종료"}
              </span>
            </div>
          )}

          <dl className="cd-meta">
            <div><dt>멤버</dt><dd>{members.length}</dd></div>
            <div><dt>캐릭터</dt><dd>{chars.length}</dd></div>
            <div><dt>세션</dt><dd>{sessions.length}</dd></div>
            <div><dt>플레이</dt><dd>{entries.length}</dd></div>
          </dl>
        </div>
        <div className="cd-actions">
          {isKeeper ? (
            <a
              href={`/api/campaigns/${id}/export`}
              className="btn ghost"
              title="캠페인 전체를 JSON 파일로 다운로드"
              download
            >
              ↓ 백업
            </a>
          ) : null}
          <Link href={`/campaigns/${id}/scene`} className="btn ghost">
            장면 트래커
          </Link>
          <Link href={`/campaigns/${id}/play`} className="btn primary">
            플레이 페이지 →
          </Link>
        </div>
      </header>

      {isKeeper ? (
        <KeeperChecklist
          campaignId={id}
          membersCount={members.length}
          sessionsCount={sessions.length}
          entriesCount={entries.length}
        />
      ) : null}

      <div className="cd-grid">
        {/* ─── 멤버 ─── */}
        <section className="cd-card">
          <header className="cd-card-head">
            <h2>멤버</h2>
            <span className="cd-card-count">{members.length}</span>
          </header>
          <ul className="cd-member-list">
            {members.map((m) => {
              const isKp = m.role === "keeper";
              return (
                <li key={m.nickname} className={isKp ? "is-keeper" : ""}>
                  <span className="cm-name">
                    {isKp ? <span aria-hidden="true" className="cm-crown">♛</span> : null}
                    {m.nickname}
                  </span>
                  <span className={`cm-role role-${m.role}`}>
                    {isKp ? "키퍼" : "플레이어"}
                  </span>
                </li>
              );
            })}
          </ul>

          {isKeeper ? (
            <div className="cd-invite">
              <div className="cd-invite-label">초대 코드</div>
              <div className="cd-invite-row">
                <code className="cd-invite-code">{camp.invite_code}</code>
                <CopyButton value={camp.invite_code} label="코드 복사" copiedLabel="복사됨" />
                <InviteShareLink inviteCode={camp.invite_code} />
              </div>
              <p className="cd-invite-hint">
                코드를 직접 알려주거나, 공유 링크를 보내면 클릭 한 번으로 합류합니다.
              </p>
            </div>
          ) : null}
        </section>

        {/* ─── 캐릭터 ─── */}
        <section className="cd-card">
          <header className="cd-card-head">
            <h2>캐릭터</h2>
            <span className="cd-card-count">{chars.length}</span>
          </header>
          {chars.length === 0 ? (
            <EmptyState
              variant="scroll"
              title="아직 캐릭터가 없습니다"
              hint={isMember ? "아래에서 새 캐릭터를 등록하세요." : "멤버만 캐릭터를 만들 수 있습니다."}
            />
          ) : (
            <ul className="cd-char-list">
              {chars.map((c) => {
                const mine = nick != null && c.owner_nick === nick;
                return (
                  <li key={c.id} className={mine ? "is-mine" : ""}>
                    <Link href={`/characters/${c.id}`} className="cc-link">
                      <span className="cc-name">{c.name}</span>
                      <span className="cc-occu">{c.occupation || "직업 미기재"}</span>
                    </Link>
                    <span className="cc-owner">@{c.owner_nick}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {isMember ? (
            <div className="cd-card-foot">
              <CharacterCreateForm campaignId={id} />
            </div>
          ) : null}
        </section>

        {/* ─── 최근 플레이 ─── */}
        <section className="cd-card cd-span-2">
          <header className="cd-card-head">
            <h2>최근 플레이</h2>
            <span className="cd-card-count">{entries.length}건</span>
          </header>
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
            <ul className="cd-recent">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/campaigns/${id}/play#entry-${e.id}`}
                    className="cd-recent-link"
                  >
                    <span className={`cd-recent-kind kind-${e.kind}`}>
                      {labelKind(e.kind)}
                    </span>
                    <span className="cd-recent-who">
                      {e.character_name || e.nickname}
                    </span>
                    <span className="cd-recent-summary">{summaryOf(e.segments)}</span>
                    <span className="cd-recent-time">{formatTime(e.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {entries.length > 0 ? (
            <div className="cd-card-foot">
              <Link href={`/campaigns/${id}/play`} className="btn ghost">
                전체 로그 보기 →
              </Link>
            </div>
          ) : null}
        </section>
      </div>

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

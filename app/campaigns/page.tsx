import Link from "next/link";
import { getNickname } from "@/lib/auth";
import {
  getLastEntryAt, listCampaignCharacters, listCampaignMembers, listMyCampaigns,
  listNotificationsFor, listSessions,
} from "@/lib/db";
import { campaignHueStyle } from "@/lib/hue";
import { formatTime } from "@/lib/format";
import type { Character, Campaign } from "@/lib/types";
import { CampaignFormsCollapsible } from "@/components/vtt/CampaignFormsCollapsible";
import { ContinueCard, type ContinueTarget } from "@/components/vtt/ContinueCard";
import { NicknameInline } from "@/components/vtt/NicknameInline";
import { CampaignsTable, type CampaignTableRow } from "@/components/vtt/CampaignsTable";
import { NotificationsCard } from "@/components/vtt/NotificationsCard";
import { MobileCampaignDashboard } from "@/components/vtt/MobileCampaignDashboard";

export const dynamic = "force-dynamic";

type StatusFilter = "active" | "dormant" | "closed" | null;

export default async function CampaignsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const joinCode = (sp.join ?? "").toUpperCase().slice(0, 16);
  const statusFilter: StatusFilter =
    sp.status === "active" || sp.status === "dormant" || sp.status === "closed"
      ? sp.status
      : null;
  const nick = await getNickname();
  if (!nick) {
    const redirectPath = joinCode
      ? `/campaigns?join=${encodeURIComponent(joinCode)}`
      : "/campaigns";
    return (
      <>
        <div className="breadcrumb">
          <Link href="/">지옥도</Link>
          <span className="sep">/</span>
          <span>내 캠페인</span>
        </div>
        <NicknameInline redirect={redirectPath} />
      </>
    );
  }

  const campaigns = await listMyCampaigns(nick);
  const notifications = await listNotificationsFor(nick, 8);

  const enriched = await Promise.all(
    campaigns.map(async (c) => {
      const [sessions, members, chars, lastEntryAt] = await Promise.all([
        listSessions(c.id),
        listCampaignMembers(c.id),
        listCampaignCharacters(c.id),
        getLastEntryAt(c.id),
      ]);
      const upcoming = sessions
        .filter((s) => s.scheduled_at && s.scheduled_at >= Date.now() && !s.ended_at)
        .sort((a, b) => (a.scheduled_at ?? 0) - (b.scheduled_at ?? 0));
      const role: "keeper" | "player" = c.keeper_nick === nick ? "keeper" : "player";
      const row: CampaignTableRow = {
        campaign: c,
        role,
        next_session: upcoming[0] ?? null,
        characters_count: c.character_count ?? chars.length,
        members_count: members.length,
        status: c.status,
      };
      const myChars: { char: Character; campaign: Campaign }[] = chars
        .filter((ch) => ch.owner_nick === nick)
        .map((ch) => ({ char: ch, campaign: c }));
      return { row, myChars, lastEntryAt, chars };
    })
  );
  const charactersByCampaign: Record<number, Character[]> = {};
  for (const e of enriched) charactersByCampaign[e.row.campaign.id] = e.chars;
  const allRows: CampaignTableRow[] = enriched.map((e) => e.row);
  const rows = statusFilter ? allRows.filter((r) => r.status === statusFilter) : allRows;
  const myChars = enriched.flatMap((e) => e.myChars);

  const activeCount = allRows.filter((r) => r.status === "active").length;
  const dormantCount = allRows.filter((r) => r.status === "dormant").length;
  const closedCount = allRows.filter((r) => r.status === "closed").length;

  const keeperCount = campaigns.filter((c) => c.keeper_nick === nick).length;
  const playerCount = campaigns.length - keeperCount;

  // 이어서 플레이 — 가장 최근 활동(or 다가오는 세션 가장 빠른) 활성 캠페인
  const continueTarget: ContinueTarget | null = (() => {
    const active = enriched.filter((e) => e.row.status === "active");
    if (active.length === 0) return null;
    const sorted = [...active].sort((a, b) => {
      const aNext = a.row.next_session?.scheduled_at ?? Infinity;
      const bNext = b.row.next_session?.scheduled_at ?? Infinity;
      if (aNext !== bNext) return aNext - bNext;
      // 같으면 최근 활동 기준
      const aLast = a.lastEntryAt ?? 0;
      const bLast = b.lastEntryAt ?? 0;
      return bLast - aLast;
    });
    const target = sorted[0];
    return {
      campaign: target.row.campaign,
      next_session: target.row.next_session,
      last_entry_at: target.lastEntryAt,
      role: target.row.role,
    };
  })();

  const isEmpty = campaigns.length === 0;
  const lastNotifyAt = notifications[0]?.when ?? null;

  return (
    <>
    {campaigns.length > 0 ? (
      <MobileCampaignDashboard
        nick={nick}
        rows={rows}
        allRows={allRows}
        myChars={myChars}
        charactersByCampaign={charactersByCampaign}
        continueTarget={continueTarget}
        statusFilter={statusFilter}
        activeCount={activeCount}
        dormantCount={dormantCount}
        closedCount={closedCount}
      />
    ) : null}
    <div className="cl-page cl-page-desktop">
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>내 캠페인</span>
      </div>

      {/* ─── 페이지 헤더 ─── */}
      <header className="cl-header">
        <div className="cl-head-text">
          <div className="cl-eyebrow">CAMPAIGNS · @{nick}</div>
          <h1 className="cl-title">내 캠페인</h1>
          <p className="cl-subtitle">
            {isEmpty
              ? "처음 시작하는 캠페인을 기다리는 중입니다."
              : "진행 중인 사건과 가까운 세션, 누적 기록을 한 화면에서."}
          </p>
          {!isEmpty ? (
            <dl className="cl-meta">
              <div><dt>참여</dt><dd>{campaigns.length}</dd></div>
              {keeperCount > 0 ? <div><dt>키퍼</dt><dd>{keeperCount}</dd></div> : null}
              {playerCount > 0 ? <div><dt>플레이어</dt><dd>{playerCount}</dd></div> : null}
              {activeCount > 0 ? <div><dt>활성</dt><dd>{activeCount}</dd></div> : null}
            </dl>
          ) : null}
        </div>
      </header>

      {/* ─── 이어서 플레이 (활성 캠페인 있을 때) ─── */}
      {continueTarget ? <ContinueCard target={continueTarget} /> : null}

      {/* ─── 빈 상태 분기 (캠페인 0개) ─── */}
      {isEmpty && !joinCode ? (
        <section className="cl-welcome">
          <a href="#campaign-forms" className="cl-welcome-card cl-welcome-keeper">
            <div className="clw-eyebrow">키퍼로 시작</div>
            <div className="clw-title">새 캠페인 만들기</div>
            <p className="clw-hint">
              내가 직접 시나리오를 끌고 갑니다. 만들고 나면 초대 코드가 발급돼, 그 코드를 플레이어에게 공유합니다.
            </p>
            <span className="clw-cta">아래에서 시작 →</span>
          </a>
          <a href="#campaign-forms" className="cl-welcome-card cl-welcome-player">
            <div className="clw-eyebrow">플레이어로 참여</div>
            <div className="clw-title">초대 코드로 참여</div>
            <p className="clw-hint">
              키퍼가 알려준 초대 코드를 입력하면 해당 캠페인에 멤버로 합류합니다. 그 다음 캐릭터를 만듭니다.
            </p>
            <span className="clw-cta">초대 코드 입력 →</span>
          </a>
        </section>
      ) : null}

      {/* ─── 내 캐릭터 (위로 올림 — 자주 가는 정보) ─── */}
      {myChars.length > 0 ? (
        <section className="cl-section">
          <div className="cl-section-head">
            <div className="cl-section-eyebrow">DOSSIER · @{nick}</div>
            <h2>내 캐릭터</h2>
            <p className="cl-section-hint">
              참여 중인 캠페인의 내 시트들. 클릭하면 시트로, 우측 아이콘은 플레이 페이지로 이동합니다.
            </p>
          </div>
          <div className="my-chars-grid">
            {myChars.map(({ char, campaign }) => (
              <div
                key={char.id}
                className="my-char-card"
                style={campaignHueStyle(campaign.slug)}
              >
                <Link
                  href={`/characters/${char.id}`}
                  className="mc-main"
                  aria-label={`${char.name} 시트 · ${campaign.name}`}
                >
                  <div className="mc-camp">{campaign.name}</div>
                  <div className="mc-name">{char.name}</div>
                  <div className="mc-occu">{char.occupation || "직업 미기재"}</div>
                  <dl className="mc-vitals" aria-hidden="true">
                    <div><dt>HP</dt><dd>{char.hp}<span>/{char.hp_max}</span></dd></div>
                    <div><dt>MP</dt><dd>{char.mp}<span>/{char.mp_max}</span></dd></div>
                    <div><dt>SAN</dt><dd>{char.san}<span>/{char.san_max}</span></dd></div>
                  </dl>
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/play`}
                  className="mc-play"
                  title="플레이 페이지로 이동"
                  aria-label={`${campaign.name} 플레이 페이지로 이동`}
                >
                  플레이 →
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ─── 신규 알림 (활동 있을 때만 풀 카드, 빈 상태는 한 줄 hint) ─── */}
      {!isEmpty ? (
        notifications.length > 0 ? (
          <section className="cl-section">
            <div className="cl-section-head">
              <div className="cl-section-eyebrow">FOCUS · 신규 알림</div>
              <h2>최근 변동 사항</h2>
              <p className="cl-section-hint">
                참여 중인 캠페인의 최근 글·굴림·캐릭터 등록·단서. 클릭하면 해당 장소로 이동합니다.
              </p>
            </div>
            <NotificationsCard notifications={notifications} hasCampaigns={true} />
          </section>
        ) : (
          <div className="cl-notify-mini">
            <span className="cnm-icon" aria-hidden="true">·</span>
            <span>
              새 알림 없음
              {lastNotifyAt ? ` · 마지막 변동 ${formatTime(lastNotifyAt)}` : " · 플레이어가 글을 쓰면 여기에 알림이 표시됩니다."}
            </span>
          </div>
        )
      ) : null}

      {/* ─── 모든 캠페인 표 (상태 필터 pill 포함) ─── */}
      {campaigns.length > 0 ? (
        <section className="cl-section">
          <div className="cl-section-head">
            <div className="cl-head-row">
              <div>
                <div className="cl-section-eyebrow">ROSTER</div>
                <h2>모든 캠페인</h2>
              </div>
              <div className="cl-status-pills" role="group" aria-label="상태 필터">
                <FilterPill
                  status={null}
                  current={statusFilter}
                  count={allRows.length}
                  label="전부"
                />
                <FilterPill
                  status="active"
                  current={statusFilter}
                  count={activeCount}
                  label="활성"
                />
                {dormantCount > 0 ? (
                  <FilterPill
                    status="dormant"
                    current={statusFilter}
                    count={dormantCount}
                    label="휴면"
                  />
                ) : null}
                {closedCount > 0 ? (
                  <FilterPill
                    status="closed"
                    current={statusFilter}
                    count={closedCount}
                    label="종료"
                  />
                ) : null}
              </div>
            </div>
          </div>
          <CampaignsTable rows={rows} myNick={nick} />
        </section>
      ) : null}

      {/* ─── 새 캠페인 / 참여 폼 (collapsible) ─── */}
      <section className="cl-section" id="campaign-forms">
        {isEmpty || joinCode ? (
          <>
            <div className="cl-section-head">
              <div className="cl-section-eyebrow">JOIN · CREATE</div>
              <h2>새 캠페인 / 초대 코드</h2>
              <p className="cl-section-hint">
                {campaigns.length > 0
                  ? "새 사건을 시작하거나, 다른 키퍼가 보낸 초대 코드를 입력하세요."
                  : "첫 캠페인을 만들거나, 다른 키퍼가 보낸 초대 코드를 입력해 합류하세요."}
              </p>
            </div>
            <CampaignFormsCollapsible
              initialTab={joinCode ? "join" : "create"}
              initialCode={joinCode}
            />
          </>
        ) : (
          <CampaignFormsCollapsible initialTab="create" initialCode="" />
        )}
      </section>

      <div className="cl-footer-links">
        <Link href="/account">⚙ 내 계정 / 데이터 다운로드</Link>
        <Link href="/rulebook">📖 룰북·사이트 사용법</Link>
      </div>
    </div>
    </>
  );
}

function FilterPill({
  status, current, count, label,
}: {
  status: StatusFilter;
  current: StatusFilter;
  count: number;
  label: string;
}) {
  const active = status === current;
  const href = status ? `/campaigns?status=${status}` : "/campaigns";
  const cls =
    status === "active" ? "cl-status-pill accent" :
    status === "closed" ? "cl-status-pill closed" :
    "cl-status-pill";
  return (
    <Link
      href={href}
      className={`${cls}${active ? " is-active" : ""}`}
      aria-current={active ? "true" : undefined}
      scroll={false}
    >
      {label} {count}
    </Link>
  );
}

import Link from "next/link";
import { getNickname } from "@/lib/auth";
import {
  listCampaignCharacters, listCampaignMembers, listMyCampaigns,
  listNotificationsFor, listSessions,
} from "@/lib/db";
import { campaignHueStyle } from "@/lib/hue";
import type { Character, Campaign } from "@/lib/types";
import { CampaignForms } from "@/components/CampaignForms";
import { NicknameInline } from "@/components/vtt/NicknameInline";
import { CampaignsTable, type CampaignTableRow } from "@/components/vtt/CampaignsTable";
import { NotificationsCard } from "@/components/vtt/NotificationsCard";

export const dynamic = "force-dynamic";

export default async function CampaignsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>;
}) {
  const sp = await searchParams;
  const joinCode = (sp.join ?? "").toUpperCase().slice(0, 16);
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
      const [sessions, members, chars] = await Promise.all([
        listSessions(c.id),
        listCampaignMembers(c.id),
        listCampaignCharacters(c.id),
      ]);
      const upcoming = sessions
        .filter((s) => s.scheduled_at && s.scheduled_at >= Date.now() && !s.ended_at)
        .sort((a, b) => (a.scheduled_at ?? 0) - (b.scheduled_at ?? 0));
      const role: "keeper" | "player" = c.keeper_nick === nick ? "keeper" : "player";
      const row: CampaignTableRow = {
        campaign: c,
        role,
        next_session: upcoming[0] ?? null,
        characters_count: c.character_count ?? 0,
        members_count: members.length,
        status: c.status,
      };
      const myChars: { char: Character; campaign: Campaign }[] = chars
        .filter((ch) => ch.owner_nick === nick)
        .map((ch) => ({ char: ch, campaign: c }));
      return { row, myChars };
    })
  );
  const rows: CampaignTableRow[] = enriched.map((e) => e.row);
  const myChars = enriched.flatMap((e) => e.myChars);

  const activeCount = rows.filter((r) => r.status === "active").length;
  const dormantCount = rows.filter((r) => r.status === "dormant").length;
  const closedCount = rows.filter((r) => r.status === "closed").length;

  const keeperCount = campaigns.filter((c) => c.keeper_nick === nick).length;
  const playerCount = campaigns.length - keeperCount;

  return (
    <div className="cl-page">
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
            진행 중인 사건과 가까운 세션, 누적 기록을 한 화면에서.
          </p>
          <dl className="cl-meta">
            <div><dt>참여</dt><dd>{campaigns.length}</dd></div>
            <div><dt>키퍼</dt><dd>{keeperCount}</dd></div>
            <div><dt>플레이어</dt><dd>{playerCount}</dd></div>
            <div><dt>활성</dt><dd>{activeCount}</dd></div>
          </dl>
        </div>
      </header>

      {/* ─── 빈 상태 분기 (캠페인 0개) ─── */}
      {campaigns.length === 0 && !joinCode ? (
        <section className="cl-welcome">
          <a href="#campaign-forms-create" className="cl-welcome-card cl-welcome-keeper">
            <div className="clw-eyebrow">키퍼로 시작</div>
            <div className="clw-title">새 캠페인 만들기</div>
            <p className="clw-hint">
              내가 직접 시나리오를 끌고 갑니다. 만들고 나면 초대 코드가 발급돼, 그 코드를 플레이어에게 공유합니다.
            </p>
            <span className="clw-cta">아래에서 시작 →</span>
          </a>
          <a href="#campaign-forms-join" className="cl-welcome-card cl-welcome-player">
            <div className="clw-eyebrow">플레이어로 참여</div>
            <div className="clw-title">초대 코드로 참여</div>
            <p className="clw-hint">
              키퍼가 알려준 초대 코드를 입력하면 해당 캠페인에 멤버로 합류합니다. 그 다음 캐릭터를 만듭니다.
            </p>
            <span className="clw-cta">초대 코드 입력 →</span>
          </a>
        </section>
      ) : null}

      {/* ─── 신규 알림 ─── */}
      {notifications.length > 0 || campaigns.length > 0 ? (
        <section className="cl-section">
          <div className="cl-section-head">
            <div className="cl-section-eyebrow">FOCUS · 신규 알림</div>
            <h2>최근 변동 사항</h2>
            <p className="cl-section-hint">
              참여 중인 캠페인의 최근 글·굴림·캐릭터 등록·단서. 클릭하면 해당 장소로 이동합니다.
            </p>
          </div>
          <NotificationsCard
            notifications={notifications}
            hasCampaigns={campaigns.length > 0}
          />
        </section>
      ) : null}

      {/* ─── 모든 캠페인 표 ─── */}
      {campaigns.length > 0 ? (
        <section className="cl-section">
          <div className="cl-section-head">
            <div className="cl-head-row">
              <div>
                <div className="cl-section-eyebrow">ROSTER</div>
                <h2>모든 캠페인</h2>
              </div>
              <div className="cl-status-pills">
                <span className="cl-status-pill accent">활성 {activeCount}</span>
                {dormantCount > 0 ? (
                  <span className="cl-status-pill">휴면 {dormantCount}</span>
                ) : null}
                {closedCount > 0 ? (
                  <span className="cl-status-pill closed">종료 {closedCount}</span>
                ) : null}
              </div>
            </div>
          </div>
          <CampaignsTable rows={rows} myNick={nick} />
        </section>
      ) : null}

      {/* ─── 새 캠페인 / 참여 폼 ─── */}
      <section className="cl-section" id="campaign-forms">
        <span id="campaign-forms-create" aria-hidden="true" />
        <span id="campaign-forms-join" aria-hidden="true" />
        <div className="cl-section-head">
          <div className="cl-section-eyebrow">JOIN · CREATE</div>
          <h2>새 캠페인 / 초대 코드</h2>
          <p className="cl-section-hint">
            {campaigns.length > 0
              ? "새 사건을 시작하거나, 다른 키퍼가 보낸 초대 코드를 입력하세요."
              : "첫 캠페인을 만들거나, 다른 키퍼가 보낸 초대 코드를 입력해 합류하세요."}
          </p>
        </div>
        <CampaignForms
          initialTab={joinCode ? "join" : "create"}
          initialCode={joinCode}
        />
      </section>

      {/* ─── 내 캐릭터 ─── */}
      {myChars.length > 0 ? (
        <section className="cl-section">
          <div className="cl-section-head">
            <div className="cl-section-eyebrow">DOSSIER · @{nick}</div>
            <h2>내 캐릭터</h2>
            <p className="cl-section-hint">
              참여 중인 캠페인의 내 시트들. 클릭하면 해당 캐릭터 시트로 이동합니다.
            </p>
          </div>
          <div className="my-chars-grid">
            {myChars.map(({ char, campaign }) => (
              <Link
                key={char.id}
                href={`/characters/${char.id}`}
                className="my-char-card"
                style={campaignHueStyle(campaign.slug)}
                aria-label={`${char.name} · ${campaign.name}`}
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
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

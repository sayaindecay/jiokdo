import Link from "next/link";
import type { Campaign, Character } from "@/lib/types";
import { hueFromString } from "@/lib/hue";
import { formatTime } from "@/lib/format";
import type { CampaignTableRow } from "./CampaignsTable";
import type { ContinueTarget } from "./ContinueCard";

type StatusFilter = "active" | "dormant" | "closed" | null;

function avatarChar(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return Array.from(trimmed)[0]!;
}

function hueColor(key: string, sat = 50, light = 42): string {
  const h = hueFromString(key);
  return `hsl(${h}, ${sat}%, ${light}%)`;
}

function nextLabelShort(ms: number): string {
  const delta = ms - Date.now();
  const hh = String(new Date(ms).getHours()).padStart(2, "0");
  const mm = String(new Date(ms).getMinutes()).padStart(2, "0");
  if (delta < 0) return "시작됨";
  const min = delta / 60_000;
  if (min < 60) return `${Math.round(min)}분 후`;
  const h = min / 60;
  if (h < 24) return `오늘 ${hh}:${mm}`;
  if (h < 48) return `내일 ${hh}:${mm}`;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${days[new Date(ms).getDay()]} ${hh}:${mm}`;
}

export function MobileCampaignDashboard({
  nick,
  rows,
  allRows,
  myChars,
  charactersByCampaign,
  continueTarget,
  statusFilter,
  activeCount,
  dormantCount,
  closedCount,
}: {
  nick: string;
  rows: CampaignTableRow[];
  allRows: CampaignTableRow[];
  myChars: { char: Character; campaign: Campaign }[];
  charactersByCampaign: Record<number, Character[]>;
  continueTarget: ContinueTarget | null;
  statusFilter: StatusFilter;
  activeCount: number;
  dormantCount: number;
  closedCount: number;
}) {
  return (
    <div className="m-cl">
      <header className="m-cl-header">
        <div className="m-cl-eyebrow">CAMPAIGNS · @{nick}</div>
        <h1 className="m-cl-title">내 캠페인</h1>
        <dl className="m-cl-meta">
          <div>
            <dt>참여</dt>
            <dd>{allRows.length}</dd>
          </div>
          {allRows.filter((r) => r.role === "keeper").length > 0 ? (
            <div>
              <dt>키퍼</dt>
              <dd>{allRows.filter((r) => r.role === "keeper").length}</dd>
            </div>
          ) : null}
          {activeCount > 0 ? (
            <div>
              <dt>활성</dt>
              <dd>{activeCount}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      {myChars.length > 0 ? (
        <div className="m-dossier-strip" aria-label="내 캐릭터">
          {myChars.map(({ char, campaign }) => (
            <Link
              key={char.id}
              href={`/characters/${char.id}`}
              className="m-ds-chip"
            >
              <span
                className="m-ds-ava"
                style={{ background: hueColor(campaign.slug) }}
                aria-hidden="true"
              >
                {avatarChar(char.name)}
              </span>
              <span className="m-ds-tx">
                <span className="m-ds-name">{char.name}</span>
                <span className="m-ds-hp">
                  HP {char.hp}/{char.hp_max}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {continueTarget ? (
        <Link
          href={`/campaigns/${continueTarget.campaign.id}/play`}
          className="m-resume"
        >
          <span
            className="m-resume-play"
            style={{
              boxShadow: `0 0 0 4px ${hueColor(continueTarget.campaign.slug, 60, 30)}33`,
            }}
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="m-resume-tx">
            <span className="m-resume-eyebrow">
              이어서 · {continueTarget.role === "keeper" ? "키퍼" : "탐사자"}
            </span>
            <span className="m-resume-name">{continueTarget.campaign.name}</span>
            <span className="m-resume-meta">
              {continueTarget.next_session?.scheduled_at
                ? `다음 세션 · ${nextLabelShort(continueTarget.next_session.scheduled_at)}`
                : continueTarget.last_entry_at
                ? `마지막 활동 · ${formatTime(continueTarget.last_entry_at)}`
                : "아직 활동이 없습니다"}
            </span>
          </span>
          <span className="m-resume-arrow" aria-hidden="true">
            ›
          </span>
        </Link>
      ) : null}

      <nav className="m-segmented" aria-label="상태 필터">
        <FilterSeg
          status={null}
          current={statusFilter}
          count={allRows.length}
          label="전부"
        />
        <FilterSeg
          status="active"
          current={statusFilter}
          count={activeCount}
          label="활성"
        />
        {dormantCount > 0 ? (
          <FilterSeg
            status="dormant"
            current={statusFilter}
            count={dormantCount}
            label="휴면"
          />
        ) : null}
        {closedCount > 0 ? (
          <FilterSeg
            status="closed"
            current={statusFilter}
            count={closedCount}
            label="종료"
          />
        ) : null}
      </nav>

      <div className="m-files">
        {rows.length === 0 ? (
          <div className="m-files-empty">
            해당 상태의 캠페인이 없습니다.
          </div>
        ) : (
          rows.map((r, idx) => {
            const chars = charactersByCampaign[r.campaign.id] ?? [];
            const shown = chars.slice(0, 3);
            const more = chars.length - shown.length;
            const statusLabel =
              r.status === "active"
                ? "활성"
                : r.status === "dormant"
                ? "휴면"
                : "종료";
            const nextLabel = r.next_session?.scheduled_at
              ? nextLabelShort(r.next_session.scheduled_at)
              : null;
            return (
              <Link
                href={`/campaigns/${r.campaign.id}`}
                key={r.campaign.id}
                className={`m-file status-${r.status}`}
                style={{
                  ["--m-hue" as string]: hueColor(r.campaign.slug),
                }}
              >
                <div className="m-file-top">
                  <span className="m-file-num">№{String(idx + 1).padStart(2, "0")}</span>
                  <span className="m-file-name">{r.campaign.name}</span>
                  <span className={`m-file-status status-${r.status}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="m-file-bottom">
                  <div className="m-file-roles">
                    <span className="m-file-role">
                      {r.role === "keeper" ? "키퍼" : "탐사자"}
                    </span>
                    {shown.length > 0 ? (
                      <div className="m-file-avatars" aria-hidden="true">
                        {shown.map((c) => (
                          <span
                            key={c.id}
                            className="m-fa"
                            style={{
                              background: hueColor(`${r.campaign.slug}-${c.id}`),
                            }}
                            title={c.name}
                          >
                            {avatarChar(c.name)}
                          </span>
                        ))}
                        {more > 0 ? (
                          <span
                            className="m-fa m-fa-more"
                            title={`외 ${more}명`}
                          >
                            +{more}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <span className="m-file-next">
                    {nextLabel ? (
                      <>
                        다음 <b>{nextLabel}</b>
                      </>
                    ) : (
                      `멤버 ${r.members_count}명`
                    )}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <a href="#campaign-forms" className="m-fab" aria-label="새 캠페인 / 초대 코드">
        +
      </a>
    </div>
  );
}

function FilterSeg({
  status,
  current,
  count,
  label,
}: {
  status: StatusFilter;
  current: StatusFilter;
  count: number;
  label: string;
}) {
  const active = status === current;
  const href = status ? `/campaigns?status=${status}` : "/campaigns";
  return (
    <Link
      href={href}
      className={`m-seg${active ? " active" : ""}`}
      aria-current={active ? "true" : undefined}
      scroll={false}
    >
      {label}
      <b>{count}</b>
    </Link>
  );
}

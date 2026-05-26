import Link from "next/link";
import type { Campaign, Session } from "@/lib/types";
import { campaignHueStyle } from "@/lib/hue";

export type CampaignTableRow = {
  campaign: Campaign;
  role: "keeper" | "player";
  next_session: Session | null;
  characters_count: number;
  members_count: number;
  status: "active" | "dormant" | "closed";
};

function relTime(ms: number | null): { label: string; urgent: boolean } {
  if (!ms) return { label: "—", urgent: false };
  const now = Date.now();
  const delta = ms - now;
  if (delta < 0) return { label: "시작됨 ●", urgent: true };
  const min = delta / 60000;
  if (min < 60) return { label: `${Math.round(min)}분 후 ●`, urgent: true };
  const h = min / 60;
  if (h < 24) return { label: `오늘 ${formatHHMM(ms)} ●`, urgent: true };
  if (h < 48) return { label: `내일 ${formatHHMM(ms)}`, urgent: false };
  const date = new Date(ms);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return { label: `${days[date.getDay()]} ${formatHHMM(ms)}`, urgent: false };
}

function formatHHMM(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CampaignsTable({ rows, myNick }: { rows: CampaignTableRow[]; myNick: string }) {
  return (
    <div className="dash-table">
      <div className="thead" aria-hidden="true">
        <span>캠페인</span>
        <span>역할</span>
        <span>다음 세션</span>
        <span>멤버</span>
        <span>상태</span>
        <span></span>
      </div>
      {rows.length === 0 ? (
        <div className="trow trow-empty">
          <span className="c-name">
            해당 상태의 캠페인이 없습니다.
          </span>
        </div>
      ) : (
        rows.map((r) => {
          const isKeeper = r.role === "keeper" || r.campaign.keeper_nick === myNick;
          const sessionLabel = r.next_session
            ? `${isKeeper ? "키퍼" : "투자자"} · #${r.next_session.number}`
            : isKeeper ? "키퍼" : "투자자";
          const next = relTime(r.next_session?.scheduled_at ?? null);
          const statusLabel = r.status === "active" ? "활성" : r.status === "dormant" ? "휴면" : "종료";
          const statusColor =
            r.status === "active" ? "var(--accent)" :
            r.status === "closed" ? "var(--ink-3)" : undefined;
          return (
            <div
              key={r.campaign.id}
              className={`trow status-${r.status}`}
              style={campaignHueStyle(r.campaign.slug)}
            >
              <Link
                href={`/campaigns/${r.campaign.id}`}
                className="c-name trow-link"
                aria-label={`${r.campaign.name}, ${sessionLabel}, 다음 세션 ${next.label}, 멤버 ${r.members_count}명, 상태 ${statusLabel}`}
              >
                {r.campaign.name}
              </Link>
              <span className="c-role" data-th="역할">{sessionLabel}</span>
              <span className={`c-next${next.urgent ? " urgent" : ""}`} data-th="다음 세션">
                {next.label}
              </span>
              <span className="c-members" data-th="멤버">
                <span aria-hidden="true">👥</span> {r.members_count}
                {r.characters_count > 0 ? (
                  <span className="c-members-chars">
                    <span aria-hidden="true">🎭</span> {r.characters_count}
                  </span>
                ) : null}
              </span>
              <span className="c-status" style={{ color: statusColor }} data-th="상태">
                {statusLabel}
              </span>
              <Link
                href={`/campaigns/${r.campaign.id}/play`}
                className="c-play"
                title="플레이 페이지로 이동"
                aria-label="플레이 페이지"
              >
                플레이 →
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
}

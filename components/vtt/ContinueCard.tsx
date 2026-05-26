import Link from "next/link";
import type { Campaign, Session } from "@/lib/types";
import { campaignHueStyle } from "@/lib/hue";
import { formatTime } from "@/lib/format";

export type ContinueTarget = {
  campaign: Campaign;
  next_session: Session | null;
  last_entry_at: number | null;
  role: "keeper" | "player";
};

function nextSessionLabel(ms: number): string {
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

export function ContinueCard({ target }: { target: ContinueTarget }) {
  const { campaign, next_session, last_entry_at, role } = target;
  const nextLabel = next_session?.scheduled_at
    ? nextSessionLabel(next_session.scheduled_at)
    : null;
  const lastLabel = last_entry_at ? formatTime(last_entry_at) : null;
  return (
    <section
      className="continue-card"
      style={campaignHueStyle(campaign.slug)}
      aria-label={`이어서 플레이: ${campaign.name}`}
    >
      <div className="cc-text">
        <div className="cc-eyebrow">
          CONTINUE · {role === "keeper" ? "키퍼" : "투자자"}
        </div>
        <h2 className="cc-title">
          <Link href={`/campaigns/${campaign.id}`}>{campaign.name}</Link>
        </h2>
        <div className="cc-meta">
          {next_session ? (
            <span className="cc-meta-item">
              <span className="cc-meta-label">다음 세션</span>
              <span className="cc-meta-val">
                #{next_session.number} · {nextLabel}
              </span>
            </span>
          ) : null}
          {lastLabel ? (
            <span className="cc-meta-item">
              <span className="cc-meta-label">마지막 활동</span>
              <span className="cc-meta-val">{lastLabel}</span>
            </span>
          ) : null}
          {!next_session && !lastLabel ? (
            <span className="cc-meta-item cc-meta-empty">아직 활동이 없습니다. 첫 글을 남겨보세요.</span>
          ) : null}
        </div>
      </div>
      <Link href={`/campaigns/${campaign.id}/play`} className="cc-cta btn primary large">
        플레이 페이지 →
      </Link>
    </section>
  );
}

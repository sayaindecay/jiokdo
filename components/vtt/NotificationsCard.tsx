import Link from "next/link";
import type { Notification } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { campaignHueStyle } from "@/lib/hue";

function kindMeta(kind: Notification["kind"]): { icon: string; label: string } {
  switch (kind) {
    case "play":      return { icon: "✎", label: "플레이" };
    case "character": return { icon: "✦", label: "캐릭터" };
    case "clue":      return { icon: "📌", label: "단서" };
  }
}

export function NotificationsCard({
  notifications,
  hasCampaigns,
}: {
  notifications: Notification[];
  hasCampaigns: boolean;
}) {
  if (notifications.length === 0) {
    return (
      <div className="nc-card nc-empty">
        <div className="nc-empty-eyebrow">새 알림 없음</div>
        <div className="nc-empty-title">
          {hasCampaigns
            ? "조용한 하루입니다."
            : "아직 캠페인이 없습니다."}
        </div>
        <div className="nc-empty-hint">
          {hasCampaigns
            ? "플레이어가 새 글을 올리거나 키퍼가 단서를 등록하면 여기에 표시됩니다."
            : "아래에서 캠페인을 만들거나 초대 코드로 합류하세요."}
        </div>
      </div>
    );
  }

  return (
    <div className="nc-card">
      <header className="nc-head">
        <div className="nc-head-eyebrow">신규 알림</div>
        <div className="nc-head-row">
          <h3 className="nc-head-title">최근 활동</h3>
          <span className="nc-head-count">{notifications.length}건</span>
        </div>
      </header>

      <ul className="nc-list">
        {notifications.map((n) => {
          const meta = kindMeta(n.kind);
          const href = n.kind === "play"
            ? `/campaigns/${n.campaign_id}/play`
            : `/campaigns/${n.campaign_id}`;
          return (
            <li key={n.id}>
              <Link
                href={href}
                className="nc-item"
                style={campaignHueStyle(`c-${n.campaign_id}`)}
              >
                <span className={`nc-icon nc-icon-${n.kind}`} aria-hidden="true">
                  {meta.icon}
                </span>
                <div className="nc-body">
                  <div className="nc-line-top">
                    <span className="nc-who">{n.who}</span>
                    <span className="nc-sep" aria-hidden="true">·</span>
                    <span className="nc-campaign">{n.campaign_name}</span>
                    {n.level && n.level_label ? (
                      <span className={`level ${n.level} nc-level`}>
                        {n.level_label}
                      </span>
                    ) : null}
                  </div>
                  <div className="nc-what">{n.what}</div>
                </div>
                <span className="nc-time">{formatTime(n.when)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

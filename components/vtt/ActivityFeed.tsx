import type { ActivityItem } from "@/lib/types";
import { formatTime } from "@/lib/format";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="activity-feed">
        <h2>최근 활동</h2>
        <div className="item">
          <span className="when">—</span>
          <span className="what" style={{ color: "var(--ink-3)", fontFamily: "var(--font-anno)" }}>
            세션이 시작되면 여기에 단서, 굴림, 메모가 시간순으로 쌓입니다.
          </span>
          <span className="where">—</span>
        </div>
      </div>
    );
  }
  return (
    <div className="activity-feed">
      <h2>최근 활동</h2>
      {items.map((it, i) => (
        <div className="item" key={i}>
          <span className="when">{formatTime(it.when)}</span>
          <span className="what">
            <b>{it.who}</b> · {it.what}
          </span>
          <span className="where">{it.where}</span>
        </div>
      ))}
    </div>
  );
}

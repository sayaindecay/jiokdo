import type { Session } from "@/lib/types";

export function SessionHistory({
  campaignName,
  sessions,
}: {
  campaignName: string;
  sessions: Session[];
}) {
  if (sessions.length === 0) return null;
  return (
    <div className="dash-history">
      <h2>「{campaignName}」 지난 세션</h2>
      <div className="session-log">
        {sessions.map((s) => (
          <div className="row" key={s.id}>
            <span className="num">#{s.number}</span>
            <span className="title">{s.title}</span>
            <span className="when">{formatDate(s.scheduled_at ?? s.started_at ?? s.created_at)}</span>
            <span className="dur">{formatDuration(s.started_at, s.ended_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} (${days[d.getDay()]}) ${hh}:${mi}`;
}

function formatDuration(started: number | null, ended: number | null): string {
  if (!started || !ended) return "—";
  const min = Math.round((ended - started) / 60000);
  const h = Math.floor(min / 60);
  const m = min - h * 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

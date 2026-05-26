import type { Campaign, PlayEntry, Session } from "@/lib/types";
import { SceneIllustration } from "./Illustrations";
import { SceneIllustrationEditor } from "./SceneIllustrationEditor";
import { formatTime } from "@/lib/format";

function kindLabel(kind: PlayEntry["kind"]): string {
  if (kind === "narration") return "내레이션";
  if (kind === "system") return "시스템";
  return "발화";
}

export function SceneStage({
  campaign, session, lastEntry, memberCount, isKeeper = false,
}: {
  campaign: Campaign;
  session: Session | null;
  lastEntry: PlayEntry | null;
  memberCount: number;
  isKeeper?: boolean;
}) {
  const headerLeft = session
    ? `세션 #${session.number} · ${session.title}`
    : campaign.name;

  const hasImage = !!campaign.illustration_url;
  const compact = !hasImage && !isKeeper;

  return (
    <div className={`scene${compact ? " scene-compact" : ""}`}>
      <div className="scene-bg"></div>

      <div className="scene-top">
        <span className="scene-top-meta">{headerLeft}</span>
        <span className="scene-members" title="이 캠페인의 멤버 수">
          👥 멤버 {memberCount}명
        </span>
      </div>

      {lastEntry ? (
        <div className="scene-last-activity" aria-label="가장 최근 활동">
          <span className={`sla-kind kind-${lastEntry.kind}`}>
            {kindLabel(lastEntry.kind)}
          </span>
          <span className="sla-who">
            {lastEntry.character_name || lastEntry.nickname}
          </span>
          <span className="sla-when">{formatTime(lastEntry.created_at)}</span>
        </div>
      ) : null}

      {!compact ? (
        <div className="scene-center">
          <div className={`scene-illustration${hasImage ? " has-image" : ""}`}>
            {hasImage ? (
              <img
                src={campaign.illustration_url!}
                alt="장면 일러스트"
                className="scene-illustration-img"
              />
            ) : (
              <SceneIllustration />
            )}
            {isKeeper ? (
              <SceneIllustrationEditor
                campaignId={campaign.id}
                currentUrl={campaign.illustration_url}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

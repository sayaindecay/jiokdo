import type { Campaign, Character, PlayEntry, Session } from "@/lib/types";
import { SceneSkillBar } from "./SceneSkillBar";

export function SceneStage({
  campaign, session, lastNarration, myCharacter, onlineCount, round,
}: {
  campaign: Campaign;
  session: Session | null;
  lastNarration: PlayEntry | null;
  myCharacter: Character | null;
  onlineCount: number;
  round: number | null;
}) {
  const headerLeft = session
    ? `세션 #${session.number} · ${session.title}`
    : campaign.name;

  // 가장 최근 내레이션의 텍스트 추출
  const narratorName = lastNarration
    ? (lastNarration.character_name || lastNarration.nickname)
    : "키퍼";
  const narrationText = lastNarration
    ? lastNarration.segments
        .filter((s) => s.type === "text")
        .map((s) => (s as { type: "text"; value: string }).value)
        .join("\n")
    : null;

  const topSkills = myCharacter
    ? [...myCharacter.skills]
        .sort((a, b) => Number(!!b.used) - Number(!!a.used) || b.value - a.value)
        .slice(0, 4)
    : [];

  return (
    <div className="scene">
      <div className="scene-bg"></div>

      <div className="scene-top">
        <span>{headerLeft}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span className="live-pip"></span>
          {onlineCount}명 접속{round != null ? ` · 라운드 ${round}` : ""}
        </span>
      </div>

      <div className="scene-center">
        <div className="scene-illustration">[ 장면 일러스트 · 비어 있음 ]</div>
      </div>

      <div className="scene-narration">
        <div className="who">{narratorName}</div>
        {narrationText ? (
          <p>{narrationText}</p>
        ) : (
          <p style={{ opacity: 0.65 }}>
            아직 내레이션이 시작되지 않았습니다. 키퍼가 첫 묘사를 남기면 여기에 표시됩니다.
          </p>
        )}
      </div>

      <SceneSkillBar character={myCharacter} skills={topSkills} />
    </div>
  );
}

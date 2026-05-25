import type { Campaign, Character, PlayEntry, Session } from "@/lib/types";
import { SceneSkillBar } from "./SceneSkillBar";
import { SceneIllustration } from "./Illustrations";
import { RoundControl } from "./RoundControl";

function textOf(entry: PlayEntry): string {
  return entry.segments
    .filter((s) => s.type === "text")
    .map((s) => (s as { type: "text"; value: string }).value)
    .join("\n")
    .trim();
}

export function SceneStage({
  campaign, session, narrationHistory, myCharacter, onlineCount,
}: {
  campaign: Campaign;
  session: Session | null;
  narrationHistory: PlayEntry[]; // 최근 → 더 옛 순서. [0]이 가장 최근
  myCharacter: Character | null;
  onlineCount: number;
}) {
  const headerLeft = session
    ? `세션 #${session.number} · ${session.title}`
    : campaign.name;

  const [current, ...older] = narrationHistory;
  const currentText = current ? textOf(current) : null;
  const currentWho = current ? (current.character_name || current.nickname) : "키퍼";
  const olderEntries = older.slice(0, 2); // 최대 2개 fade out

  const topSkills = myCharacter
    ? [...myCharacter.skills]
        .sort((a, b) => Number(!!b.used) - Number(!!a.used) || b.value - a.value)
        .slice(0, 4)
    : [];

  return (
    <div className="scene">
      <div className="scene-bg"></div>

      <div className="scene-top">
        <span className="scene-top-meta">{headerLeft}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <span className="live-pip"></span>
            {onlineCount}명 접속
          </span>
          <RoundControl />
        </span>
      </div>

      <div className="scene-center">
        <div className="scene-illustration">
          <SceneIllustration />
          <div className="scene-illustration-tag" aria-hidden="true">장면 일러스트</div>
        </div>
      </div>

      {/* 직전 묘사 fade out (5.2) */}
      {olderEntries.length > 0 ? (
        <div className="narration-history" aria-hidden="true">
          {olderEntries.map((e, i) => {
            const txt = textOf(e);
            if (!txt) return null;
            return (
              <div key={e.id} className="narration-old" style={{ opacity: 0.55 - i * 0.18 }}>
                <span className="who">{e.character_name || e.nickname}</span>
                <span className="excerpt">{txt.length > 120 ? `${txt.slice(0, 120)}…` : txt}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="scene-narration">
        <div className="who">{currentWho}</div>
        {currentText ? (
          <p>{currentText}</p>
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

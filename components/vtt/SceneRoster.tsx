import type { CampaignMember, Character, Clue } from "@/lib/types";

export function SceneRoster({
  members, characters, myNick,
}: {
  members: CampaignMember[];
  characters: Character[];
  myNick: string | null;
}) {
  return (
    <div className="scene-roster">
      <div className="head">참여자 · {members.length}명</div>
      {members.map((m) => {
        const ownChar = characters.find((c) => c.owner_nick === m.nickname);
        const isMe = myNick === m.nickname;
        return (
          <div className="member" key={m.nickname}>
            <div className="av">{m.nickname.slice(0, 1)}</div>
            <div>
              <div className="name">
                {ownChar?.name ?? m.nickname}
                {isMe ? " (당신)" : null}
              </div>
              <div className="info">
                {m.role === "keeper"
                  ? "GM · 운영 중"
                  : ownChar
                    ? `SAN ${ownChar.san}${ownChar.san < 30 ? " ⚠" : ""} · HP ${ownChar.hp}`
                    : "캐릭터 미생성"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CluesPanel({ clues }: { clues: Clue[] }) {
  return (
    <div className="scene-roster">
      <div className="head">이 장면의 단서</div>
      {clues.length === 0 ? (
        <div className="member" style={{ display: "block", padding: "0.7rem 0.85rem", opacity: 0.6 }}>
          <div className="name">아직 등록된 단서가 없습니다.</div>
        </div>
      ) : (
        clues.slice(0, 5).map((c) => (
          <div className="member" key={c.id} style={{ display: "block", padding: "0.7rem 0.85rem" }}>
            <div className="name">📌 {c.title}</div>
            {c.body ? (
              <div className="info" style={{ fontFamily: "inherit", color: "var(--text-dim)", marginTop: "0.1rem" }}>
                {c.body}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

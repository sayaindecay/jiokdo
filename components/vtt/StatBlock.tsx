import type { BestiaryEntry } from "@/lib/types";

const ATTR_LABELS: { key: keyof BestiaryEntry["attrs"]; label: string }[] = [
  { key: "str", label: "STR" }, { key: "con", label: "CON" }, { key: "siz", label: "SIZ" },
  { key: "dex", label: "DEX" }, { key: "int", label: "INT" }, { key: "pow", label: "POW" },
];

export function StatBlock({
  entry, showActions = false, compact = false,
}: {
  entry: BestiaryEntry;
  showActions?: boolean;
  compact?: boolean;
}) {
  const a = entry.attrs;
  return (
    <div className="statblock">
      <div className="sb-head">
        <h2>{entry.name}</h2>
        <div className="en">
          {entry.category}
          {entry.source ? ` · ${entry.source}` : null}
        </div>
      </div>
      <div className="sb-body">
        <div className="stat-grid">
          {ATTR_LABELS.map(({ key, label }) => {
            const v = a[key];
            if (v == null) return null;
            return (
              <div key={key}>
                <div className="k">{label}</div>
                <div className="v">{v}</div>
              </div>
            );
          })}
        </div>

        <div className="sb-meta">
          {a.hp != null ? (
            <div className="mrow"><span className="k">HP</span><span className="v">{a.hp} / {a.hp}</span></div>
          ) : null}
          {a.move != null ? (
            <div className="mrow"><span className="k">이동</span><span className="v">{a.move}</span></div>
          ) : null}
          {a.build != null ? (
            <div className="mrow"><span className="k">체격</span><span className="v">{a.build}</span></div>
          ) : null}
          {entry.sanity_loss ? (
            <div className="mrow"><span className="k">SAN 손실</span><span className="v">{entry.sanity_loss}</span></div>
          ) : null}
          {a.damage_bonus ? (
            <div className="mrow"><span className="k">DB</span><span className="v">{a.damage_bonus}</span></div>
          ) : null}
        </div>

        {entry.attacks.length > 0 ? (
          <>
            <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", margin: "0.5rem 0 0.4rem", fontFamily: "var(--font-mono)" }}>
              공격 / Attacks
            </h3>
            <div className="attacks">
              {entry.attacks.map((atk, i) => (
                <div className="attack-row" key={i}>
                  <span className="name">{atk.name}</span>
                  <span className="formula">{atk.skill}% · {atk.damage}</span>
                  <span className="roll-btn" style={{ opacity: 0.4, cursor: "default" }} title="향후 키퍼 액션">d100</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {!compact && entry.description ? (
          <div className="wiki-callout" style={{ marginTop: "0.85rem" }}>
            <b>키퍼 메모 ─</b> {entry.description}
          </div>
        ) : null}

        {showActions ? (
          <div className="dice-toolbar" style={{ marginTop: "0.85rem", marginBottom: 0 }}>
            <span className="chip">-1d6 HP</span>
            <span className="chip">-1d4 HP</span>
            <span className="chip">상태: 출혈</span>
            <span className="chip">상태: 기절</span>
            <span className="chip">+ NPC 복제</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

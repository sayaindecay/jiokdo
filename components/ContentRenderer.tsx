import { LEVEL_LABEL } from "@/lib/dice";
import type { Segment } from "@/lib/types";

export function ContentRenderer({ segments }: { segments: Segment[] }) {
  return (
    <div className="content">
      {segments.map((seg, i) => {
        if (seg.type === "text") return <p key={i}>{seg.value}</p>;
        const r = seg.result;
        if (r.kind === "roll") {
          return (
            <div key={i} className="dice-block">
              <span className="label">굴림</span>
              <span className="expr">{r.notation}</span>
              <span className="dice-faces">
                [{r.dice.join(", ")}]
                {r.modifier !== 0
                  ? ` ${r.modifier > 0 ? "+" : ""}${r.modifier}`
                  : ""}
              </span>
              <span className="total">= {r.total}</span>
            </div>
          );
        }
        return (
          <div key={i} className="dice-block cc">
            <span className="label">CoC 판정</span>
            {r.name ? <span className="expr">{r.name}</span> : null}
            <span className="expr">1d100 ≤ {r.skill}</span>
            <span className="total">→ {r.roll}</span>
            <span className={`level ${r.level}`}>{LEVEL_LABEL[r.level]}</span>
          </div>
        );
      })}
    </div>
  );
}

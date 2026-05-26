"use client";

export type InitiativeRow = {
  id: string;
  dex: number;
  name: string;
  is_pc: boolean;
  hp: number;
  hp_max: number;
  dead?: boolean;
  acted?: boolean;
  source_slug?: string;
};

export function InitiativeTracker({
  rows,
  round,
  activeIndex,
  roundFlash,
  allActed,
  onAdvance,
  onReset,
  onDamage,
  onRemove,
  onSelect,
  activeStatblockId,
}: {
  rows: InitiativeRow[];
  round: number;
  activeIndex: number;
  roundFlash: boolean;
  allActed: boolean;
  onAdvance: () => void;
  onReset: () => void;
  onDamage: (id: string, amount: number) => void;
  onRemove?: (id: string) => void;
  onSelect?: (row: InitiativeRow) => void;
  activeStatblockId?: string;
}) {
  const sorted = [...rows].sort((a, b) => b.dex - a.dex);
  const liveCount = sorted.filter((r) => !r.dead).length;
  const actedCount = sorted.filter((r) => !r.dead && r.acted).length;

  return (
    <div className="initiative">
      <div className="ini-head">
        <span>이니셔티브 (DEX 순)</span>
        <span>
          라운드{" "}
          <span className={`round${roundFlash ? " flash" : ""}`}>{round}</span>
          {liveCount > 0 ? (
            <span className="ini-acted-progress">
              {" · "}
              {actedCount}/{liveCount} 행동
            </span>
          ) : null}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div
          className="empty"
          style={{ padding: "1.4rem 1rem", margin: "0.4rem 0" }}
        >
          <div style={{ fontFamily: "var(--font-anno)", color: "var(--ink-2)", fontSize: "0.95rem" }}>
            트래커가 비어 있습니다.
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.74rem",
              color: "var(--ink-3)",
              marginTop: "0.3rem",
            }}
          >
            우측에서 NPC 를 추가하거나 PC 를 등장시키세요.
          </div>
        </div>
      ) : (
        sorted.map((r, i) => {
          const isActive = i === activeIndex && !r.dead;
          const isSelected = activeStatblockId === r.id;
          const acted = !!r.acted && !r.dead;
          return (
            <div
              key={r.id}
              className={`ini-row${isActive ? " active" : ""}${r.dead ? " dead" : ""}${acted ? " acted" : ""}`}
              style={{
                outline: isSelected ? "1.5px dashed var(--accent)" : undefined,
              }}
            >
              <span className="dex">{r.dex}</span>
              <button
                type="button"
                onClick={() => onSelect?.(r)}
                className="name name-btn"
                title={`${r.name} 스탯블록 보기`}
              >
                {acted ? <span className="ini-check" aria-hidden="true">✓ </span> : null}
                {r.name}
                {isActive ? <span className="active-mark"> ← 지금</span> : null}
                {r.is_pc ? <span className="muted role-mark"> PC</span> : null}
                {r.dead ? <span className="muted role-mark"> 사망</span> : null}
              </button>
              <span className="hp" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="ini-damage"
                  onClick={() => onDamage(r.id, 1)}
                  aria-label={`${r.name} HP 1 감소`}
                  title="HP −1"
                  disabled={r.dead}
                >
                  −
                </button>
                <span className="ini-hp-val">{r.hp}/{r.hp_max}</span>
                <button
                  type="button"
                  className="ini-damage heal"
                  onClick={() => onDamage(r.id, -1)}
                  aria-label={`${r.name} HP 1 회복`}
                  title="HP +1"
                  disabled={r.dead}
                >
                  +
                </button>
                {onRemove ? (
                  <button
                    type="button"
                    className="ini-remove"
                    onClick={() => onRemove(r.id)}
                    aria-label={`${r.name} 트래커에서 제거`}
                    title="트래커에서 제거"
                  >
                    ✕
                  </button>
                ) : null}
              </span>
            </div>
          );
        })
      )}

      <div className="ini-actions">
        <button
          className="btn ghost"
          type="button"
          onClick={onReset}
          disabled={sorted.length === 0}
        >
          ↺ 라운드 초기화
        </button>
        <button
          className={`btn${allActed ? " accent" : ""}`}
          type="button"
          onClick={onAdvance}
          disabled={liveCount === 0}
          title={allActed ? "전원이 행동했습니다 — 다음 라운드로" : "현재 행동자를 완료로 표시하고 다음으로"}
        >
          {allActed ? "다음 라운드 →" : "다음 턴 →"}
        </button>
      </div>
    </div>
  );
}

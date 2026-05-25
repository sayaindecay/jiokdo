export function Meter({
  label, current, max, variant, danger,
}: {
  label: string;
  current: number;
  max: number;
  variant: "hp" | "mp" | "san" | "luck";
  danger?: boolean;
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.min(100, Math.max(0, (current / safeMax) * 100));
  return (
    <div className={`meter ${variant}`} data-danger={danger ? "1" : undefined}>
      <div className="meter-head">
        <span className="label">{label}</span>
        <span className="num">{current} / {max}</span>
      </div>
      <div className="meter-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

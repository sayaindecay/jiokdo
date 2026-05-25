export function Meter({
  label, current, max, variant,
}: {
  label: string;
  current: number;
  max: number;
  variant: "hp" | "mp" | "san" | "luck";
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.min(100, Math.max(0, (current / safeMax) * 100));
  return (
    <div className={`meter ${variant}`}>
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

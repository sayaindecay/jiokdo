export default function Loading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <div className="rl-stripe" />
      <div className="rl-card" />
      <div className="rl-card" />
      <div className="rl-card" />
    </div>
  );
}

export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        marginTop: "0.65rem",
        padding: "0.55rem 0.8rem",
        background: "var(--accent-soft)",
        border: "1.5px solid var(--accent)",
        borderRadius: "var(--radius)",
        color: "var(--accent)",
        fontSize: "0.85rem",
        fontWeight: 500,
      }}
    >
      ⚠ {message}
    </div>
  );
}

import type { BestiaryEntry } from "@/lib/types";

/**
 * HP 와 STR 평균으로 1~5 별 위협 등급을 계산.
 * 단순 휴리스틱 — 실제 키퍼 판단을 대체하진 않지만 시각적 정렬에 도움.
 */
export function threatRating(entry: BestiaryEntry): number {
  const hp = entry.attrs.hp ?? 5;
  const str = entry.attrs.str ?? 50;
  const pow = entry.attrs.pow ?? 50;
  // 0–100 점수
  const score = hp * 2.4 + str * 0.18 + pow * 0.12;
  if (score >= 80) return 5;
  if (score >= 55) return 4;
  if (score >= 36) return 3;
  if (score >= 22) return 2;
  return 1;
}

export function ThreatStars({ entry }: { entry: BestiaryEntry }) {
  const rating = threatRating(entry);
  const labels = ["가벼움", "낮음", "보통", "높음", "극단"];
  return (
    <span
      className="threat-stars"
      aria-label={`위협 등급 ${rating}/5 — ${labels[rating - 1]}`}
      title={`위협 ${labels[rating - 1]}`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "on" : "off"} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

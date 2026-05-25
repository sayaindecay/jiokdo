// 단순한 잉크 라인 일러스트 — paper + oxblood 톤.

export function MistIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55">
        <path d="M10 60 q20 -10 40 0 t40 0 t40 0 t40 0 t30 0" />
        <path d="M14 75 q22 -8 44 0 t44 0 t44 0 t44 0" />
        <path d="M22 92 q18 -6 36 0 t36 0 t36 0 t36 0 t26 0" />
        <path d="M30 110 q16 -5 32 0 t32 0 t32 0 t32 0 t30 0" />
      </g>
      <g fill="currentColor" opacity="0.18">
        <circle cx="60" cy="40" r="1.5" />
        <circle cx="120" cy="32" r="2" />
        <circle cx="155" cy="48" r="1.5" />
        <circle cx="40" cy="48" r="1" />
      </g>
    </svg>
  );
}

export function DiceIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <polygon points="70,20 110,42 110,90 70,112 30,90 30,42" />
        <line x1="70" y1="20" x2="70" y2="66" />
        <line x1="70" y1="66" x2="110" y2="42" />
        <line x1="70" y1="66" x2="30" y2="42" />
        <line x1="70" y1="66" x2="70" y2="112" opacity="0.4" strokeDasharray="3 3" />
      </g>
      <g fill="currentColor" opacity="0.45">
        <text x="50" y="60" fontFamily="var(--font-display)" fontSize="12">d</text>
        <text x="58" y="60" fontFamily="var(--font-display)" fontSize="16">100</text>
      </g>
    </svg>
  );
}

export function BooksIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="20" y="50" width="36" height="70" />
        <rect x="58" y="40" width="32" height="80" />
        <rect x="92" y="60" width="28" height="60" />
        <rect x="122" y="48" width="24" height="72" />
        <line x1="20" y1="60" x2="56" y2="60" opacity="0.5" />
        <line x1="58" y1="52" x2="90" y2="52" opacity="0.5" />
        <line x1="92" y1="70" x2="120" y2="70" opacity="0.5" />
      </g>
      <g fill="currentColor" opacity="0.20" fontFamily="var(--font-display)" fontSize="6">
        <text x="28" y="92" transform="rotate(-90 28 92)">RULES</text>
        <text x="66" y="92" transform="rotate(-90 66 92)">CTHULHU</text>
      </g>
    </svg>
  );
}

export function ScrollIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M30 30 Q30 22 38 22 H122 Q130 22 130 30 V100 Q130 108 122 108 H38 Q30 108 30 100 Z" />
        <line x1="42" y1="40" x2="118" y2="40" opacity="0.5" />
        <line x1="42" y1="52" x2="110" y2="52" opacity="0.5" />
        <line x1="42" y1="64" x2="118" y2="64" opacity="0.5" />
        <line x1="42" y1="76" x2="100" y2="76" opacity="0.5" />
        <line x1="42" y1="88" x2="114" y2="88" opacity="0.5" />
      </g>
    </svg>
  );
}

/** 캐릭터 시트 portrait placeholder — 잉크 실루엣 */
export function PortraitSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 68 84" className={className} aria-hidden="true">
      <g fill="currentColor" opacity="0.85">
        {/* 머리 */}
        <ellipse cx="34" cy="28" rx="14" ry="16" />
        {/* 목 + 어깨 */}
        <path d="M22 50 L46 50 L52 60 Q52 64 50 66 L18 66 Q16 64 16 60 Z" />
        {/* 몸통/외투 */}
        <path d="M12 66 L56 66 L60 84 L8 84 Z" />
      </g>
      {/* 모자 (1920s 페도라 느낌) */}
      <g fill="currentColor" opacity="0.65">
        <ellipse cx="34" cy="14" rx="18" ry="3" />
        <path d="M22 14 Q22 6 34 6 Q46 6 46 14 Z" />
      </g>
    </svg>
  );
}

/** 시네마틱 무대 일러스트 — 안개 낀 부두 (oxblood 가로등 + 달) */
export function SceneIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 320" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(245, 243, 228, 0.55)" />
          <stop offset="40%" stopColor="rgba(245, 243, 228, 0.18)" />
          <stop offset="100%" stopColor="rgba(245, 243, 228, 0)" />
        </radialGradient>
        <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(245, 243, 228, 0)" />
          <stop offset="100%" stopColor="rgba(245, 243, 228, 0.06)" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(207, 102, 20, 0.55)" />
          <stop offset="60%" stopColor="rgba(207, 102, 20, 0.16)" />
          <stop offset="100%" stopColor="rgba(207, 102, 20, 0)" />
        </radialGradient>
      </defs>

      {/* 하늘 */}
      <rect x="0" y="0" width="800" height="320" fill="rgba(20, 17, 13, 0)" />

      {/* 달 */}
      <circle cx="650" cy="80" r="110" fill="url(#moonGlow)" />
      <circle cx="650" cy="80" r="32" fill="rgba(245, 243, 228, 0.78)" />
      <circle cx="630" cy="68" r="3" fill="rgba(20, 17, 13, 0.35)" />
      <circle cx="664" cy="92" r="5" fill="rgba(20, 17, 13, 0.30)" />
      <circle cx="640" cy="92" r="2" fill="rgba(20, 17, 13, 0.30)" />

      {/* 별 */}
      <g fill="rgba(245, 243, 228, 0.5)">
        <circle cx="80" cy="40" r="0.8" />
        <circle cx="160" cy="22" r="1.2" />
        <circle cx="250" cy="55" r="0.7" />
        <circle cx="380" cy="30" r="1.0" />
        <circle cx="460" cy="60" r="0.6" />
        <circle cx="730" cy="160" r="0.8" />
      </g>

      {/* 가로등 글로우 (좌) */}
      <circle cx="140" cy="200" r="120" fill="url(#lampGlow)" />

      {/* 부두 라인 */}
      <line x1="0" y1="260" x2="800" y2="260" stroke="rgba(245, 243, 228, 0.18)" strokeWidth="1" />
      <line x1="0" y1="276" x2="800" y2="276" stroke="rgba(245, 243, 228, 0.12)" strokeWidth="1" />

      {/* 부두 기둥 */}
      <g stroke="rgba(245, 243, 228, 0.28)" strokeWidth="2" fill="none">
        <line x1="60" y1="260" x2="60" y2="320" />
        <line x1="220" y1="260" x2="220" y2="320" />
        <line x1="380" y1="260" x2="380" y2="320" />
        <line x1="540" y1="260" x2="540" y2="320" />
        <line x1="700" y1="260" x2="700" y2="320" />
      </g>

      {/* 가로등 (왼쪽) */}
      <g stroke="rgba(245, 243, 228, 0.55)" strokeWidth="1.8" fill="none">
        <line x1="140" y1="260" x2="140" y2="170" />
        <path d="M 130 170 Q 140 160 150 170" />
      </g>
      <circle cx="140" cy="178" r="5" fill="rgba(207, 102, 20, 0.85)" />

      {/* 안개 */}
      <rect x="0" y="220" width="800" height="100" fill="url(#mistGrad)" />
      <g stroke="rgba(245, 243, 228, 0.10)" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M 0 240 Q 100 232 200 240 T 400 240 T 600 240 T 800 240" />
        <path d="M 0 254 Q 120 246 240 254 T 480 254 T 720 254 T 800 254" opacity="0.7" />
      </g>

      {/* 떠 있는 검은 봉투 (희미한 작은 형체) */}
      <g transform="translate(360, 232)" opacity="0.5">
        <rect x="-12" y="-8" width="24" height="16" fill="rgba(245, 243, 228, 0.1)" stroke="rgba(245, 243, 228, 0.4)" strokeWidth="0.8" />
        <path d="M -12 -8 L 0 0 L 12 -8" fill="none" stroke="rgba(245, 243, 228, 0.4)" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

/** 베스티어리 placeholder — 신화 글리프 (호어이 단순 사각문양) */
export function MythicGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="70" cy="70" r="48" />
        <polygon points="70,30 96,86 44,86" />
        <circle cx="70" cy="74" r="6" fill="currentColor" opacity="0.7" />
        <line x1="70" y1="22" x2="70" y2="32" />
        <line x1="70" y1="108" x2="70" y2="118" />
        <line x1="22" y1="70" x2="32" y2="70" />
        <line x1="108" y1="70" x2="118" y2="70" />
      </g>
      <g fill="currentColor" opacity="0.30" fontFamily="var(--font-display)" fontSize="9" textAnchor="middle">
        <text x="70" y="135">Y'HA-NTHLEI</text>
      </g>
    </svg>
  );
}

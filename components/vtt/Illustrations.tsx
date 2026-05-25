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

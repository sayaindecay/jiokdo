"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "복사",
  copiedLabel = "복사됨",
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        // 폴백
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`copy-btn${copied ? " copied" : ""} ${className ?? ""}`}
      aria-label={`${value} 복사`}
      title={copied ? copiedLabel : `${value} 복사`}
    >
      {copied ? (
        <>
          <span aria-hidden="true">✓</span> {copiedLabel}
        </>
      ) : (
        <>
          <span aria-hidden="true">📋</span> {label}
        </>
      )}
    </button>
  );
}

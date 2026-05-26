"use client";

import { useState } from "react";

export function InviteShareLink({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/campaigns?join=${encodeURIComponent(inviteCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback — prompt
      window.prompt("이 링크를 복사해 공유하세요", url);
    }
  };
  return (
    <button
      type="button"
      className="btn ghost cd-invite-share"
      onClick={onClick}
      title="합류용 1-click 링크를 복사"
    >
      {copied ? "✓ 링크 복사됨" : "🔗 공유 링크"}
    </button>
  );
}

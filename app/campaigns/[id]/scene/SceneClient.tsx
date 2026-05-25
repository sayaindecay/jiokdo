"use client";

import { useState } from "react";
import Link from "next/link";
import type { BestiaryEntry } from "@/lib/types";
import { InitiativeTracker, type InitiativeRow } from "@/components/vtt/InitiativeTracker";
import { StatBlock } from "@/components/vtt/StatBlock";

export function SceneClient({
  rows, focusedNpc, otherNpcs,
}: {
  rows: InitiativeRow[];
  focusedNpc: BestiaryEntry | null;
  otherNpcs: BestiaryEntry[];
}) {
  const [focused, setFocused] = useState<BestiaryEntry | null>(focusedNpc);

  return (
    <>
      <div className="scene-grid">
        <InitiativeTracker
          initial={rows}
          onSelect={(r) => {
            if (r.is_pc) return;
            // 베스티어리 매칭
            const slug = r.id.replace(/^npc-/, "").replace(/-\d+$/, "");
            const found = [focusedNpc, ...otherNpcs].find((n) => n?.slug === slug);
            if (found) setFocused(found);
          }}
          activeStatblockId={focused?.slug ? `npc-${focused.slug}-1` : undefined}
        />

        {focused ? (
          <StatBlock entry={focused} showActions />
        ) : (
          <div className="statblock" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240 }}>
            <p className="empty" style={{ background: "none", border: "none", padding: 0 }}>
              왼쪽 트래커에서 NPC를 선택하면 스탯블록이 표시됩니다.
            </p>
          </div>
        )}
      </div>

      <div className="section-head">
        <h2>오늘 세션의 다른 NPC</h2>
        <span className="count">{otherNpcs.length}개</span>
      </div>
      <div className="board-grid">
        {otherNpcs.map((n) => (
          <Link key={n.slug} href={`/bestiary/${n.slug}`} className="board-card">
            <h2>{n.name}</h2>
            <p className="desc">{n.category}</p>
            <div className="stats">
              {n.attrs.hp != null ? <span>HP <b>{n.attrs.hp}</b></span> : null}
              {n.attrs.pow != null ? <span>POW <b>{n.attrs.pow}</b></span> : null}
              {n.sanity_loss ? <span>SAN <b>{n.sanity_loss}</b></span> : null}
            </div>
          </Link>
        ))}
        {otherNpcs.length === 0 ? (
          <div className="empty">베스티어리에 등록된 다른 NPC가 없습니다.</div>
        ) : null}
      </div>
    </>
  );
}

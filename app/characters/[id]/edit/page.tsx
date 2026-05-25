import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getNickname } from "@/lib/auth";
import { getCharacter } from "@/lib/db";
import { updateCharacterProfileAction } from "@/app/actions";
import { DangerZone } from "@/components/vtt/DangerZone";

export const dynamic = "force-dynamic";

export default async function CharacterEditPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const ch = await getCharacter(id);
  if (!ch) notFound();
  const nick = await getNickname();
  if (!nick || nick !== ch.owner_nick) {
    redirect(`/characters/${id}`);
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href={`/characters/${id}`}>{ch.name}</Link>
        <span className="sep">/</span>
        <span>편집</span>
      </div>

      <h1 className="page-title">시트 편집</h1>
      <p className="page-sub">기본 정보, 배경, 기능치를 수정할 수 있습니다.</p>

      <form action={updateCharacterProfileAction} className="form">
        <input type="hidden" name="character_id" value={id} />

        <h3 style={{ marginBottom: "0.5rem" }}>기본 정보</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label>이름</label>
            <input name="name" defaultValue={ch.name} required maxLength={40} />
          </div>
          <div>
            <label>직업</label>
            <input name="occupation" defaultValue={ch.occupation} maxLength={40} />
          </div>
          <div>
            <label>나이</label>
            <input name="age" type="number" defaultValue={ch.age ?? ""} min={1} max={120} />
          </div>
        </div>

        <h3 style={{ marginBottom: "0.5rem", marginTop: "1.5rem" }}>배경 / Backstory</h3>
        <label>이상 · 의미 있는 사람 · 소중한 장소 · 특성</label>
        <textarea
          name="backstory"
          defaultValue={ch.backstory}
          maxLength={2000}
          placeholder="자유롭게 작성하세요."
          style={{ minHeight: "10rem" }}
        />

        <h3 style={{ marginBottom: "0.5rem", marginTop: "1.5rem" }}>기능치</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-2)", marginBottom: "0.75rem", fontFamily: "var(--font-anno)" }}>
          기능치는 1~99 사이의 정수. 0으로 두면 기존 값 유지.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
          {ch.skills.map((s) => (
            <label
              key={s.name}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0 }}
            >
              <span style={{ flex: 1, color: "var(--ink-2)", fontSize: "0.88rem" }}>{s.name}</span>
              <input
                name={`skill_${s.name}`}
                type="number"
                min={0}
                max={99}
                defaultValue={s.value}
                style={{ width: "5rem", fontFamily: "var(--font-mono)", textAlign: "center" }}
              />
            </label>
          ))}
        </div>

        <h3 style={{ marginBottom: "0.5rem", marginTop: "1.5rem" }}>새 기능 추가 (선택)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "0.5rem" }}>
          <input name="new_skill_name" placeholder="예) 등반" maxLength={40} />
          <input name="new_skill_value" type="number" min={1} max={99} placeholder="기능치" />
        </div>

        <div className="actions" style={{ marginTop: "1.5rem", gap: "0.5rem" }}>
          <button type="submit" className="btn primary">저장</button>
          <Link href={`/characters/${id}`} className="btn ghost">취소</Link>
        </div>
      </form>

      <DangerZone characterId={id} characterName={ch.name} />
    </>
  );
}

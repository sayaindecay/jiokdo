import Link from "next/link";
import { notFound } from "next/navigation";
import { getBestiaryEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BestiaryDetail({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getBestiaryEntry(slug);
  if (!e) notFound();

  const attrPairs: [string, number | string | undefined][] = [
    ["STR", e.attrs.str], ["CON", e.attrs.con], ["SIZ", e.attrs.siz],
    ["DEX", e.attrs.dex], ["INT", e.attrs.int], ["POW", e.attrs.pow],
    ["HP", e.attrs.hp], ["Move", e.attrs.move], ["Build", e.attrs.build],
    ["DB", e.attrs.damage_bonus],
  ];

  return (
    <div className="statblock-page">
      <div className="breadcrumb">
        <Link href="/bestiary">몬스터</Link>
        <span className="sep">/</span>
        <span>{e.name}</span>
      </div>

      <div className="statblock">
        <header className="statblock-head">
          <h1>{e.name}</h1>
          <div className="statblock-cat">{e.category}</div>
        </header>
        <p className="statblock-desc">{e.description}</p>

        <h3 className="statblock-h">능력치</h3>
        <div className="stat-grid">
          {attrPairs.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
            <div key={k} className="stat-cell">
              <div className="stat-key">{k}</div>
              <div className="stat-val">{v}</div>
            </div>
          ))}
        </div>

        <h3 className="statblock-h">공격</h3>
        <table className="md-table attacks">
          <thead>
            <tr><th>이름</th><th>기능치</th><th>피해</th><th>비고</th></tr>
          </thead>
          <tbody>
            {e.attacks.map((a, i) => (
              <tr key={i}>
                <td>{a.name}</td>
                <td>{a.skill}%</td>
                <td>{a.damage}</td>
                <td>{a.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="statblock-h">SAN 손실</h3>
        <p className="san-loss">{e.sanity_loss}</p>

        <footer className="statblock-foot">출처: {e.source}</footer>
      </div>
    </div>
  );
}

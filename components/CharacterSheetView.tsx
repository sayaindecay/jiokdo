import type { Character } from "@/lib/types";

export function CharacterSheetView({ character: ch }: { character: Character }) {
  const attrEntries: [string, number][] = [
    ["STR", ch.attrs.str], ["CON", ch.attrs.con], ["SIZ", ch.attrs.siz],
    ["DEX", ch.attrs.dex], ["APP", ch.attrs.app], ["INT", ch.attrs.int],
    ["POW", ch.attrs.pow], ["EDU", ch.attrs.edu], ["행운", ch.attrs.luck],
  ];

  return (
    <div className="sheet">
      <section className="sheet-section">
        <h3>능력치</h3>
        <div className="stat-grid">
          {attrEntries.map(([k, v]) => (
            <div key={k} className="stat-cell">
              <div className="stat-key">{k}</div>
              <div className="stat-val">{v}</div>
              <div className="stat-half">
                <span>{Math.floor(v / 2)}</span>
                <span>{Math.floor(v / 5)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sheet-section">
        <h3>상태</h3>
        <div className="vitals">
          <div className="vital hp">
            <span className="label">HP</span>
            <span className="val">{ch.hp} <span className="max">/ {ch.hp_max}</span></span>
          </div>
          <div className="vital mp">
            <span className="label">MP</span>
            <span className="val">{ch.mp} <span className="max">/ {ch.mp_max}</span></span>
          </div>
          <div className="vital san">
            <span className="label">SAN</span>
            <span className="val">{ch.san} <span className="max">/ {ch.san_max}</span></span>
          </div>
        </div>
      </section>

      <section className="sheet-section">
        <h3>기능치</h3>
        <div className="skill-grid">
          {ch.skills.map((s) => (
            <div key={s.name} className="skill-row">
              <span className="skill-name">{s.name}</span>
              <span className="skill-val">{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sheet-section">
        <h3>무기</h3>
        <table className="md-table">
          <thead>
            <tr><th>이름</th><th>기능</th><th>피해</th></tr>
          </thead>
          <tbody>
            {ch.weapons.map((w, i) => (
              <tr key={i}>
                <td>{w.name}</td>
                <td>{w.skill}%</td>
                <td>{w.damage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {ch.backstory ? (
        <section className="sheet-section">
          <h3>배경</h3>
          <p className="backstory">{ch.backstory}</p>
        </section>
      ) : null}
    </div>
  );
}

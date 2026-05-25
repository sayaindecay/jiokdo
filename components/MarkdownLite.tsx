import { Fragment, type ReactNode } from "react";

// 가벼운 마크다운 파서: **bold**, `code`, # 헤더, | 표, 빈줄=문단
export type Heading = { id: string; level: number; text: string };

export function extractHeadings(text: string): Heading[] {
  const out: Heading[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const m = raw.match(/^(#{1,3})\s+(.+)$/);
    if (!m) continue;
    out.push({ level: m[1].length, text: m[2].trim(), id: slugify(m[2]) });
  }
  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "section";
}

export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="md">
      {blocks.map((block, i) => {
        if (/^\|.+\|$/m.test(block) && block.split("\n").every((l) => l.trim().startsWith("|"))) {
          return <Table key={i} rows={block.split("\n").filter((l) => l.trim())} />;
        }
        const h = block.match(/^(#{1,3})\s+(.+)$/);
        if (h) {
          const level = h[1].length;
          const raw = h[2];
          const id = slugify(raw);
          if (level === 1) return <h2 key={i} id={id}>{inline(raw)}</h2>;
          if (level === 2) return <h3 key={i} id={id}>{inline(raw)}</h3>;
          return <h4 key={i} id={id}>{inline(raw)}</h4>;
        }
        if (block.split("\n").every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={i}>
              {block.split("\n").map((l, j) => (
                <li key={j}>{inline(l.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }
        if (block.split("\n").every((l) => /^[-*]\s/.test(l.trim()))) {
          return (
            <ul key={i}>
              {block.split("\n").map((l, j) => (
                <li key={j}>{inline(l.replace(/^[-*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {block.split("\n").map((line, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Table({ rows }: { rows: string[] }) {
  const cells = rows
    .map((r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()))
    .filter((cs) => !cs.every((c) => /^[-:\s]+$/.test(c)));
  if (cells.length === 0) return null;
  const [head, ...body] = cells;
  return (
    <table className="wiki-table">
      <thead>
        <tr>{head.map((c, i) => <th key={i}>{inline(c)}</th>)}</tr>
      </thead>
      <tbody>
        {body.map((row, i) => (
          <tr key={i}>{row.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

function inline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3]) parts.push(<code key={key++}>{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

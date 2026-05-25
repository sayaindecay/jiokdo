import { Fragment, type ReactNode } from "react";

// 매우 가벼운 마크다운 파서: **bold**, `code`, # 헤더, | 표, 빈줄=문단
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
          const text = h[2];
          if (level === 1) return <h2 key={i}>{inline(text)}</h2>;
          if (level === 2) return <h3 key={i}>{inline(text)}</h3>;
          return <h4 key={i}>{inline(text)}</h4>;
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
  // skip separator row (---)
  const cells = rows
    .map((r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()))
    .filter((cs) => !cs.every((c) => /^[-:\s]+$/.test(c)));
  if (cells.length === 0) return null;
  const [head, ...body] = cells;
  return (
    <table className="md-table">
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

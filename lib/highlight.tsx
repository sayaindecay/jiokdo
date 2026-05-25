import { Fragment, type ReactNode } from "react";

export function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const k = lower.indexOf(q, i);
    if (k < 0) {
      parts.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }
    if (k > i) parts.push(<Fragment key={key++}>{text.slice(i, k)}</Fragment>);
    parts.push(<mark key={key++}>{text.slice(k, k + q.length)}</mark>);
    i = k + q.length;
  }
  return parts;
}

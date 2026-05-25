import type { ReactNode } from "react";

export function WikiSection({
  id,
  title,
  en,
  anchor,
  children,
}: {
  id: string;
  title: string;
  en?: string;
  anchor?: string;
  children: ReactNode;
}) {
  return (
    <section className="wiki-section">
      <h2 id={id}>
        {title}
        {anchor ? <span className="anchor">#{anchor}</span> : null}
        {en ? <span className="en">{en}</span> : null}
      </h2>
      {children}
    </section>
  );
}

export function WikiCallout({ children }: { children: ReactNode }) {
  return <div className="wiki-callout">{children}</div>;
}

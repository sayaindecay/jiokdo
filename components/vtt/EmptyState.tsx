import type { ReactNode } from "react";
import {
  BooksIllustration, DiceIllustration, MistIllustration, ScrollIllustration,
} from "./Illustrations";

type Variant = "mist" | "dice" | "books" | "scroll";

const ILLUSTRATIONS: Record<Variant, (props: { className?: string }) => ReactNode> = {
  mist: MistIllustration,
  dice: DiceIllustration,
  books: BooksIllustration,
  scroll: ScrollIllustration,
};

export function EmptyState({
  variant = "mist",
  title,
  hint,
  action,
}: {
  variant?: Variant;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  const Illus = ILLUSTRATIONS[variant];
  return (
    <div className="empty-state">
      <div className="empty-illus">
        <Illus />
      </div>
      <div className="empty-title">{title}</div>
      {hint ? <div className="empty-hint">{hint}</div> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

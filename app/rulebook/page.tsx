import { redirect } from "next/navigation";
import { listRuleSections } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RulebookIndex() {
  const sections = await listRuleSections();
  const first = sections[0];
  redirect(first ? `/rulebook/${first.slug}` : "/rulebook/intro");
}

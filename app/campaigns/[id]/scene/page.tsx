import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// 장면 트래커는 이제 /campaigns/[id]/play?mode=tracker 로 통합되었음.
export default async function ScenePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/campaigns/${id}/play?mode=tracker`);
}

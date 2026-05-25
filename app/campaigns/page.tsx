import Link from "next/link";
import { getNickname } from "@/lib/auth";
import { listMyCampaigns } from "@/lib/db";
import { CampaignForms } from "@/components/CampaignForms";

export const dynamic = "force-dynamic";

export default async function CampaignsIndex() {
  const nick = await getNickname();
  if (!nick) {
    return (
      <>
        <h1 className="page-title">캠페인</h1>
        <p className="page-sub">먼저 우측 상단에서 닉네임을 설정하세요.</p>
        <div className="empty">닉네임 미설정</div>
      </>
    );
  }
  const my = await listMyCampaigns(nick);
  return (
    <>
      <h1 className="page-title">캠페인</h1>
      <p className="page-sub">{nick} 님이 참여 중인 캠페인</p>

      <CampaignForms />

      <div className="section-head">
        <h2>내 캠페인</h2>
        <span className="count">{my.length}개</span>
      </div>
      {my.length === 0 ? (
        <div className="empty">아직 캠페인이 없습니다. 위에서 만들거나 초대 코드로 참여하세요.</div>
      ) : (
        <div className="campaign-grid">
          {my.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="campaign-card">
              <div className="campaign-head">
                <h3>{c.name}</h3>
                <span className="role-badge">
                  {c.keeper_nick === nick ? "키퍼" : "플레이어"}
                </span>
              </div>
              <p>{c.description || "설명 없음"}</p>
              <div className="campaign-meta">
                <span>👤 {c.member_count}</span>
                <span>📖 {c.character_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

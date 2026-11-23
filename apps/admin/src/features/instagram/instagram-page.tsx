// 인스타 성과 화면 (작업 0324 · 사용자 결정 "인스타 확인하는 화면 하나") — 0323 의 성과 판을 알리기 탭에서 옮김 · 보이는 값 · 빈 칸 규칙은 그대로
import { AdminNav } from "@/shared/nav/admin-nav";
import { Stamp } from "@/shared/ui/panel/panel";
import { IgSection } from "./ig-section";

export function InstagramPage() {
  return (
    <AdminNav page="instagram">
      <div className="adm-top">
        <div>
          <p className="adm-eyebrow">인스타 성과</p>
          <h1>올린 게시물이 얼마나 보였는지</h1>
          <p className="adm-lede">매일 한 번 인스타 게시물과 계정의 도달 · 반응을 받아 날짜별로 남깁니다. 받지 못한 값은 빈 칸입니다.</p>
        </div>
        <Stamp>매일 04:40 받음</Stamp>
      </div>
      <IgSection />
    </AdminNav>
  );
}

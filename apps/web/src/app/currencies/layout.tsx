import type { Metadata } from "next";
import { BrowseLayout } from "@/features/currencies/components/browse-layout";
import { RECENT_KEY } from "@/features/currencies/lib/recent-chips";
import { api } from "@hav/shared/api";

export const metadata: Metadata = {
  title: "통화 둘러보기 · Flapfx",
  description: "통화마다 오늘 환율 · 싼 편인지 · 최근 1년 흐름",
};

// 고른 통화가 저장돼 있으면 <html data-recent-chips> 를 다는 아주 작은 스크립트 (작업 0231 · 저장 칩 첫 그림 깜빡임) — 칩 줄보다 앞에서 돌아, 서버가 그린 기본 칩 줄이 잠깐 보였다가 저장 순서로 바뀌는 일을 막음
//   CSS(globals.css)가 그 표시가 있고 칩 줄이 아직 준비 전(data-ready 없음)이면 칩 줄을 숨김 · 저장이 없거나(처음 방문) 자바스크립트가 꺼져 있으면 숨기지 않고 바로 기본 칩
const MARK = `try{var v=localStorage.getItem(${JSON.stringify(RECENT_KEY)});if(v&&v!=="[]")document.documentElement.setAttribute("data-recent-chips","")}catch(e){}`;

// 목록 · 동전은 여기 (통화를 바꿔도 그대로) · 빌드 때 API 에서
export default async function Layout({ children }: LayoutProps<"/currencies">) {
  const [latest, signals, changes] = await Promise.all([api.latest(), api.signals(), api.changes(30)]);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MARK }} />
      <BrowseLayout latest={latest} signals={signals} changes={changes}>
        {children}
      </BrowseLayout>
    </>
  );
}

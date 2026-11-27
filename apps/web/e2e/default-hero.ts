// 작업 0381 — 블랙프라이데이 기간(~2026-12-01 17:00 KST)에는 기본 hero(home-hero · 탑승권 · 칩 · 안내 줄)가 숨겨짐
// 기본 hero 를 보는 홈 spec 은 beforeEach 에서 이 함수를 불러 기간이 끝난 뒤의 홈을 만든다
// (작업 0385: 캐러셀이 생겨 html 의 data-hero 만 바꾸면 보이는 장 상태가 블프 장에 남아 기본 장이 inert 가 됨 — 기간 판정이 읽는 Date.now() 를 기간 끝 뒤로 옮겨 실제 기간 뒤와 같은 상태를 만듦)
// Date.now 만 일정한 간격으로 앞당김 — new Date() · 타이머는 그대로라 날짜에 기대는 다른 검사와 움직임 시간 간격은 그대로 (기간 판정 자체는 home-bf.spec.ts 가 시각을 고정해 확인)
import type { Page } from "@playwright/test";

export async function forceDefaultHero(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    const offset = Math.max(0, Date.parse("2026-12-01T17:00:00+09:00") - realNow() + 1000);
    if (offset > 0) Date.now = () => realNow() + offset;
    // 초기화 스크립트는 html 이 생기기 전에 돌아서 document 를 관찰 · head 스크립트가 data-hero 를 정하면 바로 default 로 되돌림(첫 그림 전)
    const fix = () => {
      const html = document.documentElement;
      if (html && html.getAttribute("data-hero") !== "default") html.setAttribute("data-hero", "default");
    };
    new MutationObserver(fix).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-hero"] });
    fix();
  });
}

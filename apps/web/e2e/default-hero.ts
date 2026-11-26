// 작업 0381 — 블랙프라이데이 기간(~2026-12-01 17:00 KST)에는 기본 hero(home-hero · 탑승권 · 칩 · 안내 줄)가 숨겨짐
// 기본 hero 를 보는 홈 spec 은 beforeEach 에서 이 함수를 불러 html 의 data-hero 를 기간과 상관없이 default 로 고정한다
// (시계를 바꾸지 않으므로 날짜에 기대는 다른 검사는 그대로 · 기간 판정 자체는 home-bf.spec.ts 가 시각을 고정해 확인)
import type { Page } from "@playwright/test";

export async function forceDefaultHero(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // 초기화 스크립트는 html 이 생기기 전에 돌아서 document 를 관찰 · head 스크립트가 data-hero 를 정하면 바로 default 로 되돌림(첫 그림 전)
    const fix = () => {
      const html = document.documentElement;
      if (html && html.getAttribute("data-hero") !== "default") html.setAttribute("data-hero", "default");
    };
    new MutationObserver(fix).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-hero"] });
    fix();
  });
}

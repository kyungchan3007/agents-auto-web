// 작업 0355 — 테두리 버튼 공통 부품 OutlineLink (시안 10-A · 작업 0356 의 "다른 나라 통화 보기" 도 같은 모양 규칙을 씀) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — packages/ui/src/components/action/outline-link.tsx
//   export function OutlineLink(p: { href: string; children: ReactNode; testId?: string }): JSX
//     - <a href> (훅 없음 · 서버에서 그려지는 부품) · 테두리 1px 이상 · 누르는 자리 높이 44px 이상(tap-44 클래스)
//     - 글 뒤에 꾸밈 화살표 "›" (aria-hidden) · testId 가 있으면 data-testid 로 붙임
// 글은 부품이 정하지 않고 받은 children 만 그림
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OutlineLink } from "./outline-link";

const html = (p: { href: string; testId?: string } = { href: "/prices" }) => renderToStaticMarkup(createElement(OutlineLink, { ...p, children: "다른 나라 물가도 보기 · 39개 나라" }));

describe("OutlineLink", () => {
  it("받은 주소 그대로 <a href> · 받은 글 그대로", () => {
    const h = html();
    expect(h).toMatch(/^<a [^>]*href="\/prices"/);
    expect(h).toContain("다른 나라 물가도 보기 · 39개 나라");
  });

  it("끝 화살표는 꾸밈(aria-hidden) — 읽는 이름에는 글만", () => {
    expect(html()).toMatch(/<span[^>]*aria-hidden="true"[^>]*>›<\/span>/);
  });

  it("testId 를 data-testid 로 붙임 · 없으면 붙이지 않음", () => {
    expect(html({ href: "/prices", testId: "more-countries" })).toContain('data-testid="more-countries"');
    expect(html()).not.toContain("data-testid");
  });

  it("모양 규칙: 테두리 · 누르는 자리 44px(tap-44) 클래스", () => {
    const cls = /class="([^"]*)"/.exec(html())?.[1] ?? "";
    expect(cls).toMatch(/(^|\s)border(-2)?(\s|$)|border-\[/);
    expect(cls).toContain("tap-44");
  });
});

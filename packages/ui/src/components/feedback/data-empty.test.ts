// 작업 0346 — 빈 상태 공통 부품 DataEmpty (시안 3-new) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 글은 부품이 정하지 않고 받은 것만 그림(@hav/shared 에 의존하지 않음 — 글 · 링크는 쓰는 화면이 emptyCopy · checkedAtText 로 만들어 넘김)
//
// builder 가 만들 것 — packages/ui/src/components/feedback/data-empty.tsx
//   export function DataEmpty(p: { checked: string; title: string; reason: string; links: { label: string; href: string }[]; linksTitle?: string }): JSX
//     - 루트: data-testid="data-empty" · data-surface="light" (흰 카드 — 파랑 면 위에 올려도 글자가 보이게) · 서버에서 그려도 되는 부품(훅 · 브라우저 전용 값 없음)
//     - checked("자료 없음 · 2026-11-25 10:00 확인") → 작은 이름표 · title → 제목 · reason → 이유 한 문단
//     - 링크가 있으면 linksTitle(기본 "그동안 볼 수 있는 것") 과 링크 칩(<a href>) 목록 · 링크가 없으면 그 제목도 없음
//   이 테스트는 JSX 없이 react 의 createElement 와 react-dom/server 로 그려 봄
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataEmpty } from "./data-empty";

const props = {
  checked: "자료 없음 · 2026-11-25 10:00 확인",
  title: "오늘 환율을 아직 받지 못해 계산을 잠시 멈췄습니다",
  reason: "한국수출입은행이 오늘 값을 아직 주지 않았습니다.",
  links: [
    { label: "이번 주 관세청 과세환율 (아래)", href: "#customs" },
    { label: "통화별 1년 흐름", href: "/currencies" },
    { label: "여행 물가", href: "/prices" },
  ],
};
const html = (p: Parameters<typeof DataEmpty>[0] = props) => renderToStaticMarkup(createElement(DataEmpty, p));

// 작업 0396: checked(이름표) · reason(이유 문단)은 선택 — 없으면 그리지 않음. 방문자 말 안내는 제목 + 링크만 (개발자 문단 · "자료 없음 · 확인" 제거)
describe("DataEmpty — 작업 0396 (이름표 · 이유 없이)", () => {
  const lean = { title: "베트남 환율은 아직 제공되지 않습니다", links: [{ label: "통화 둘러보기", href: "/currencies" }] };
  it("title · links 만으로 그려짐 · 이름표 · 이유 문단 없음 · 링크 제목은 남음", () => {
    const h = renderToStaticMarkup(createElement(DataEmpty, lean));
    expect(h).toContain("베트남 환율은 아직 제공되지 않습니다");
    expect(h).toContain("그동안 볼 수 있는 것");
    expect(h).toContain('href="/currencies"');
    expect(h).not.toContain("자료 없음");
    expect(h).not.toContain("undefined");
  });
});

describe("DataEmpty", () => {
  it("흰 카드 표시 · 이름표 · 제목 · 이유 · '그동안 볼 수 있는 것' 제목", () => {
    const h = html();
    expect(h).toContain('data-testid="data-empty"');
    expect(h).toContain('data-surface="light"');
    expect(h).toContain("자료 없음 · 2026-11-25 10:00 확인");
    expect(h).toContain("오늘 환율을 아직 받지 못해 계산을 잠시 멈췄습니다");
    expect(h).toContain("한국수출입은행이 오늘 값을 아직 주지 않았습니다.");
    expect(h).toContain("그동안 볼 수 있는 것");
  });

  it("링크 칩 — 받은 주소 그대로 <a href> · 글 그대로(칩 끝 화살표는 꾸밈)", () => {
    const h = html();
    for (const l of props.links) {
      expect(h, l.href).toContain(`href="${l.href}"`);
      expect(h, l.label).toContain(l.label);
    }
    expect((h.match(/<a /g) ?? []).length).toBe(3);
  });

  it("링크 제목을 바꿀 수 있음", () => {
    expect(html({ ...props, linksTitle: "이어서 볼 곳" })).toContain("이어서 볼 곳");
    expect(html({ ...props, linksTitle: "이어서 볼 곳" })).not.toContain("그동안 볼 수 있는 것");
  });

  it("링크가 없으면 링크 제목 · 칩 없음 (빈 제목을 그리지 않음)", () => {
    const h = html({ ...props, links: [] });
    expect(h).not.toContain("그동안 볼 수 있는 것");
    expect(h).not.toContain("<a ");
    expect(h).toContain(props.title);
  });

  it("글은 글자 그대로 — HTML 조각이 와도 태그가 되지 않음 (이스케이프)", () => {
    const h = html({ ...props, title: "<img src=x onerror=alert(1)>" });
    expect(h).not.toContain("<img");
    expect(h).toContain("&lt;img");
  });
});

// 작업 0344 — FAQPage 구조화 자료 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/web/src/shared/seo/seo.ts: export function faqLd(items: { q: string; a: string }[])
import { describe, expect, it } from "vitest";
import { faqLd, jsonLdText } from "./seo";

describe("FAQPage 구조화 자료", () => {
  it("schema.org FAQPage — 문항마다 Question · acceptedAnswer", () => {
    expect(faqLd([{ q: "일본 물가는 한국보다 비싼가요?", a: "네, 12% 높습니다." }, { q: "환전은 지금 해도 되나요?", a: "보통입니다." }])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "일본 물가는 한국보다 비싼가요?", acceptedAnswer: { "@type": "Answer", text: "네, 12% 높습니다." } },
        { "@type": "Question", name: "환전은 지금 해도 되나요?", acceptedAnswer: { "@type": "Answer", text: "보통입니다." } },
      ],
    });
  });

  it("문항이 없으면 null (빈 FAQPage 를 내지 않음)", () => {
    expect(faqLd([])).toBeNull();
  });

  it("글에 '<' 가 있어도 script 를 닫지 못함 (jsonLdText 가 이스케이프)", () => {
    const ld = faqLd([{ q: "a", a: "</script><script>alert(1)</script>" }]);
    expect(jsonLdText(ld as object)).not.toContain("</script>");
  });
});

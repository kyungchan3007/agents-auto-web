import type { TravelRow } from "@hav/shared/travel";
import { describe, expect, it } from "vitest";
import { type PriceBand, bandsView } from "./bands";

const row = (country: string, relative: number, region: string) => ({ country, relative, region }) as unknown as TravelRow;
const BANDS: PriceBand[] = [
  { id: "cheap", label: "싼 편", rows: [row("VNM", 0.5, "asia")] },
  { id: "pricey", label: "비싼 편", rows: [row("CHE", 4, "europe")] },
];

describe("물가 묶음 계산 (작업 0125)", () => {
  it("막대는 가장 비싼 나라가 끝 · 한국 선 위치", () => {
    const v = bandsView(BANDS, "all");
    expect(v.barWidth(4)).toBe(100);
    expect(v.koreaAt).toBe(25);
  });
  it("비싼 나라가 2 아래면 2 기준", () => {
    expect(bandsView([BANDS[0]], "all").koreaAt).toBe(50);
  });
  it("고른 지역에 나라가 없는 묶음은 뺌", () => {
    expect(bandsView(BANDS, "asia").shown.map((b) => b.id)).toEqual(["cheap"]);
  });
});

// 작업 0212 — 나라 줄 판정 알약에 "환율" 을 붙여 물가(구간 제목)와 구분
import { rateBadgeText } from "./bands";

describe("rateBadgeText — '환율 하위 3% · 낮음' (작업 0212)", () => {
  it("90일 백분위 글 앞에 '환율' · 백분위가 없으면 '환율 낮음'", () => {
    expect(rateBadgeText("cheap", 0.03)).toBe("환율 하위 3% · 낮음");
    expect(rateBadgeText("expensive", 0.9)).toBe("환율 상위 10% · 높음");
    expect(rateBadgeText("normal", null)).toBe("환율 보통");
  });
});

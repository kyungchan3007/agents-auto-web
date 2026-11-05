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

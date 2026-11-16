// 작업 0181 — /flights 그래프 순수 계산 테스트 (라벨 값 = 데이터 · 없는 선은 라벨 없음 · 범례 강조 · 눈금 · 끝 라벨 밀어 띄우기)
import { describe, expect, it } from "vitest";
import { INDEX_BASE_NOTE, UNIT_NOTE, axisTicks, endLabelText, extremeTexts, legendText, lineStyle, monthTicks, nextFocus, periodOf, seriesStats, spreadLabels } from "./flights-graph-view";

const air = [
  { period: "2025-03", value: 100.2 },
  { period: "2025-01", value: 95.5 },
  { period: "2025-02", value: 87.3 },
  { period: "2025-04", value: 103.2 },
];

describe("seriesStats — 최저 · 최고 · 최근 (받은 값으로만)", () => {
  it("최저 · 최고 · 가장 최근 달 (들어온 순서가 섞여도 같음)", () => {
    const s = seriesStats(air);
    expect(s?.min).toEqual({ period: "2025-02", value: 87.3 });
    expect(s?.max).toEqual({ period: "2025-04", value: 103.2 });
    expect(s?.last).toEqual({ period: "2025-04", value: 103.2 });
    expect(seriesStats([...air].reverse())).toEqual(s);
  });

  it("같은 값이면 앞선 달 · 값이 하나면 셋 다 그 달 · 없으면 null (라벨을 만들지 않음)", () => {
    expect(seriesStats([{ period: "2025-02", value: 90 }, { period: "2025-01", value: 90 }])?.min.period).toBe("2025-01");
    expect(seriesStats([{ period: "2025-01", value: 90 }])).toEqual({ min: { period: "2025-01", value: 90 }, max: { period: "2025-01", value: 90 }, last: { period: "2025-01", value: 90 } });
    expect(seriesStats([])).toBeNull();
  });
});

describe("라벨 글 — 데이터와 같은 값", () => {
  it("extremeTexts — '2025-02 최저 · 지수 87.3' · '2025-04 최고 · 지수 103.2'", () => {
    const s = seriesStats(air);
    if (!s) throw new Error("통계가 나와야 함");
    expect(extremeTexts(s)).toEqual({ min: "2025-02 최저 · 지수 87.3", max: "2025-04 최고 · 지수 103.2" });
  });

  it("선 끝 이름 + 최근 값 — 국제항공료 103.2 · 단체여행비 112.4 · 원/달러 1,420원", () => {
    expect(endLabelText("air", { period: "2025-04", value: 103.2 })).toBe("국제항공료 103.2");
    expect(endLabelText("tour", { period: "2025-04", value: 112.44 })).toBe("단체여행비 112.4");
    expect(endLabelText("fx", { period: "2025-04", value: 1419.6 })).toBe("원/달러 1,420원");
  });

  it("범례 칩 글 — 이름 + 최근 값", () => {
    expect(legendText("air", { period: "2025-04", value: 103.2 })).toBe("국제항공료 103.2");
    expect(legendText("tour", { period: "2025-04", value: 112.4 })).toBe("해외단체여행비 112.4");
    expect(legendText("fx", { period: "2025-04", value: 1420 })).toBe("원/달러 월평균 1,420원");
  });

  it("안내 글 — 지수 기준(2020 = 100 · 실제 요금 아님) · 선마다 단위가 달라 모양만 비교", () => {
    expect(INDEX_BASE_NOTE).toContain("2020년 = 100");
    expect(INDEX_BASE_NOTE).toContain("실제 요금이 아닙니다");
    expect(UNIT_NOTE).toBe("선마다 단위가 달라 모양만 비교합니다");
  });
});

describe("범례 강조 상태", () => {
  it("칩을 누르면 그 선 · 같은 칩을 다시 누르면 원래대로 · 다른 칩을 누르면 그 선으로", () => {
    expect(nextFocus(null, "tour")).toBe("tour");
    expect(nextFocus("tour", "tour")).toBeNull();
    expect(nextFocus("tour", "fx")).toBe("fx");
  });

  it("평소 — 국제항공료 주인공(굵기 3 · 불투명 1) · 나머지 굵기 2 · 불투명도 0.55", () => {
    expect(lineStyle(null, "air")).toEqual({ width: 3, opacity: 1 });
    expect(lineStyle(null, "tour")).toEqual({ width: 2, opacity: 0.55 });
    expect(lineStyle(null, "fx")).toEqual({ width: 2, opacity: 0.55 });
  });

  it("강조 중 — 고른 선만 진하게(3 · 1) · 나머지는 흐리게(0.25)", () => {
    expect(lineStyle("fx", "fx")).toEqual({ width: 3, opacity: 1 });
    expect(lineStyle("fx", "air").opacity).toBe(0.25);
    expect(lineStyle("fx", "tour").opacity).toBe(0.25);
  });
});

describe("가로축 눈금", () => {
  it("periodOf — 달 번호 → YYYY-MM", () => {
    expect(periodOf(2025 * 12 + 4)).toBe("2025-05");
    expect(periodOf(2025 * 12 + 11)).toBe("2025-12");
  });

  it("마지막 달에서 6개월씩 거슬러 — 오래된 것부터 · 처음 이전은 없음", () => {
    const to = 2025 * 12 + 10; // 2025-11
    const from = to - 35; // 36개월 = 2022-12 ~ 2025-11 (2022-11 은 범위 밖)
    const ticks = monthTicks(from, to);
    expect(ticks.map((t) => t.period)).toEqual(["2023-05", "2023-11", "2024-05", "2024-11", "2025-05", "2025-11"]);
    expect(ticks.every((t) => t.idx >= from && t.idx <= to)).toBe(true);
  });

  it("범위가 6개월보다 짧으면 마지막 달 하나 · step 을 줄 수 있음", () => {
    expect(monthTicks(100, 103).map((t) => t.idx)).toEqual([103]);
    expect(monthTicks(100, 112, 12).map((t) => t.idx)).toEqual([100, 112]);
  });
});

describe("axisTicks — 처음 · 끝 달은 늘 보이고 사이는 겹치면 생략", () => {
  const to = 2026 * 12 + 10; // 2026-11
  const from = to - 35; // 2023-12

  it("넓은 화면(840px) — 처음 · 끝 + 6개월 간격 사이 눈금 · 끝은 오른쪽(end) · 처음은 왼쪽(start)", () => {
    const t = axisTicks(from, to, 840);
    expect(t[0]).toMatchObject({ period: "2023-12", anchor: "start" });
    expect(t.at(-1)).toMatchObject({ period: "2026-11", anchor: "end" });
    expect(t.length).toBeGreaterThan(3);
    expect(t.slice(1, -1).every((x) => x.anchor === "middle")).toBe(true);
  });

  /** 정렬 방향을 반영한 실제 글자 칸(px) — axisTicks 와 같은 식으로 테스트에서 따로 셈 */
  const boxes = (t: ReturnType<typeof axisTicks>, widthPx: number, labelPx = 60) =>
    t.map((k) => {
      const x = (((k.idx - from) / (to - from)) * 936 + 32) / 1000 * widthPx;
      return k.anchor === "start" ? [x, x + labelPx] : k.anchor === "end" ? [x - labelPx, x] : [x - labelPx / 2, x + labelPx / 2];
    });

  it("휴대폰(343px) — 처음 · 끝은 그대로 · 사이는 겹치지 않게 줄어듦 · 이웃한 눈금의 실제 글자 칸이 12px 이상 떨어짐", () => {
    const t = axisTicks(from, to, 343);
    expect(t[0].period).toBe("2023-12");
    expect(t.at(-1)?.period).toBe("2026-11");
    const b = boxes(t, 343);
    for (let i = 1; i < b.length; i++) expect(b[i][0] - b[i - 1][1], `${t[i - 1].period} → ${t[i].period}`).toBeGreaterThanOrEqual(12 - 1e-9);
    expect(t.length).toBeLessThan(axisTicks(from, to, 840).length);
  });

  it("처음 · 둘째 눈금 — 처음이 왼쪽 정렬(글자가 오른쪽으로 펼쳐짐)이라 둘째 눈금(2025-05 처럼 5개월 뒤)이 맞닿으면 둘째를 생략 (375 폭 · 두 해 구간)", () => {
    // 2024-12 ~ 2026-11 이 아니라 사용자가 본 경우: 처음 2024-12, 사이 후보 2025-05
    const to2 = 2026 * 12 + 10;
    const from2 = 2024 * 12 + 11; // 2024-12 (24개월)
    const t = axisTicks(from2, to2, 343);
    expect(t[0].period).toBe("2024-12");
    const b = t.map((k) => {
      const x = (((k.idx - from2) / (to2 - from2)) * 936 + 32) / 1000 * 343;
      return k.anchor === "start" ? [x, x + 60] : k.anchor === "end" ? [x - 60, x] : [x - 30, x + 30];
    });
    for (let i = 1; i < b.length; i++) expect(b[i][0] - b[i - 1][1], `${t[i - 1].period} → ${t[i].period}`).toBeGreaterThanOrEqual(12 - 1e-9);
    expect(t.map((k) => k.period)).not.toContain("2025-05"); // 처음 눈금과 맞닿는 후보는 빠짐
  });

  it("끝 눈금이 마지막 달 하나뿐이어도 깨지지 않음 · 한 달 범위 · 순서는 오래된 것부터", () => {
    expect(axisTicks(to, to, 343)).toEqual([{ idx: to, period: "2026-11", anchor: "middle" }]);
    const t = axisTicks(from, to, 560);
    expect(t.map((x) => x.idx)).toEqual([...t.map((x) => x.idx)].sort((a, b) => a - b));
  });
});

describe("spreadLabels — 끝 라벨 겹치면 위아래로 밀어 띄움", () => {
  it("이미 떨어져 있으면 그대로 (입력 순서 유지)", () => {
    expect(spreadLabels([100, 20, 60], 18, 0, 200)).toEqual([100, 20, 60]);
  });

  it("가까우면 minGap 이상으로 벌림 · 결과 순서는 입력 순서", () => {
    const r = spreadLabels([50, 52, 51], 18, 0, 200);
    const sorted = [...r].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(18 - 1e-9);
    expect(r[0]).toBeLessThan(r[2]);
    expect(r[2]).toBeLessThan(r[1]); // 50 < 51 < 52 순서가 유지됨
  });

  it("영역(lo ~ hi) 안 — 아래 끝에 몰려도 위로 올려 넘치지 않음", () => {
    const r = spreadLabels([198, 199, 200], 18, 0, 200);
    expect(Math.max(...r)).toBeLessThanOrEqual(200);
    expect(Math.min(...r)).toBeGreaterThanOrEqual(0);
    const sorted = [...r].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(18 - 1e-9);
  });

  it("라벨 하나 · 없음", () => {
    expect(spreadLabels([42], 18, 0, 100)).toEqual([42]);
    expect(spreadLabels([], 18, 0, 100)).toEqual([]);
  });
});

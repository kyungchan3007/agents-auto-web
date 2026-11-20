// 작업 0234 R4 · R5 · R6 · R7 — 항공권 출발일 달력 순수 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — packages/shared/src/domain/airfare.ts (+ package.json exports "./airfare-domain")  ※ 함수 이름 · 반환 모양은 이 테스트의 가정 — 다르게 하려면 lead 에게 알리고 테스트를 맞춰 달라고 요청
//   type Day = { depart: string; return: string; price: number }
//   cheapestDay(days): Day | null                      가장 싼 날 (같은 값이면 먼저 오는 날) · 빈 배열이면 null
//   priciestDay(days): Day | null
//   weekdayAverages(days): (number | null)[]           길이 7 · 0=월 … 6=일 · 해당 요일 날이 없으면 null (출발일 요일 기준 평균)
//   cheapestWeekday(days): { weekday: number; average: number; priciest: { weekday: number; average: number } } | null
//   priceSpread(days): { lo: number; hi: number; ratio: number } | null     최저 ↔ 최고
//   priceTier(price, days): "low" | "mid" | "high"     아래 1/4 · 위 1/4 (시안: 정렬 후 q1 = sorted[floor(n*0.25)] · q3 = sorted[floor(n*0.75)] · price <= q1 low · price >= q3 high · 먼저 low 판정)
//   weekdayLabel(isoDate): "월" … "일"                 한국 날짜 달력 그대로 (시간대 영향 없음)
//   formatDay(isoDate): "12월 29일(화)"
//   headline(city, day): "도쿄는 12월 29일(화) 출발이 가장 쌉니다"   (받침 있으면 "은" · 없으면 "는")
//   bestSubline(best, worst): "12.29 → 01.05 왕복 · 가장 비싼 11월 23일(월) 출발(685,748원)보다 410,875원 쌈"
//   pickedSubline(picked, best): "고른 날 12월 30일(수) 출발 300,000원 · 가장 싼 날보다 25,127원 비쌈"
//   summaryFacts(days): { weekday: { label, big, say }, spread: { label, big, say } }   요약 두 항목 (이름표 → 큰 값 → 풀이 한 줄)
//   receivedNote(fetchedOn): "11월 19일에 받은 가격이며, 실제 결제 가격과 다를 수 있습니다."
import { describe, expect, it } from "vitest";
import { bestSubline, cheapestDay, cheapestWeekday, formatDay, headline, pickedSubline, priceSpread, priceTier, priciestDay, receivedNote, summaryFacts, weekdayAverages, weekdayLabel } from "./airfare";
import fixture from "../../../../apps/api/src/features/airfare/fixtures/calendar.json";

const NRT = fixture.cities.find((c) => c.airport === "NRT")!.days;
const KIX = fixture.cities.find((c) => c.airport === "KIX")!.days;
const WD = ["월", "화", "수", "목", "금", "토", "일"];
const wd = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

describe("가장 싼 날 · 가장 비싼 날 (R4)", () => {
  it("도쿄: 12월 29일 274,873원 · 가장 비싼 날 11월 23일 685,748원 (고정 자료)", () => {
    expect(cheapestDay(NRT)).toEqual({ depart: "2026-12-29", return: "2027-01-05", price: 274873 });
    expect(priciestDay(NRT)).toEqual({ depart: "2026-11-23", return: "2026-11-30", price: 685748 });
  });
  it("오사카: 12월 2일 227,700원", () => {
    expect(cheapestDay(KIX)?.depart).toBe("2026-12-02");
  });
  it("같은 값이면 먼저 오는 날 · 빈 배열이면 null (숫자를 만들지 않음)", () => {
    const d = (depart: string, price: number) => ({ depart, return: depart, price });
    expect(cheapestDay([d("2026-11-22", 5), d("2026-11-21", 5)].sort((a, b) => a.depart.localeCompare(b.depart)))?.depart).toBe("2026-11-21");
    expect(cheapestDay([])).toBeNull();
    expect(priciestDay([])).toBeNull();
  });
});

describe("요일 · 날짜 글 (R4 · R7)", () => {
  it("요일 계산이 시간대와 상관없이 맞음 (2026-12-29 화 · 2026-11-23 월 · 2026-11-22 일)", () => {
    expect(weekdayLabel("2026-12-29")).toBe("화");
    expect(weekdayLabel("2026-11-23")).toBe("월");
    expect(weekdayLabel("2026-11-22")).toBe("일");
  });
  it("formatDay · headline (받침 있는 도시 · 없는 도시)", () => {
    expect(formatDay("2026-12-29")).toBe("12월 29일(화)");
    expect(formatDay("2026-11-05")).toBe("11월 5일(목)");
    expect(headline("도쿄", cheapestDay(NRT)!)).toBe("도쿄는 12월 29일(화) 출발이 가장 쌉니다");
    expect(headline("방콕", { depart: "2026-11-24", return: "2026-12-01", price: 446200 })).toBe("방콕은 11월 24일(화) 출발이 가장 쌉니다");
  });
  it("receivedNote — 받은 날 한 줄 · 제공처 · 구글 · SerpApi 글자 없음", () => {
    const s = receivedNote("2026-11-19");
    expect(s).toBe("11월 19일에 받은 가격이며, 실제 결제 가격과 다를 수 있습니다.");
    expect(s).not.toMatch(/구글|google|serpapi/i);
  });
});

describe("풀이 한 줄 (R4)", () => {
  it("가장 싼 날 풀이 — 오는 날 · 가장 비싼 날 · 차이", () => {
    expect(bestSubline(cheapestDay(NRT)!, priciestDay(NRT)!)).toBe("12.29 → 01.05 왕복 · 가장 비싼 11월 23일(월) 출발(685,748원)보다 410,875원 쌈");
  });
  it("고른 날 풀이 — 가장 싼 날보다 얼마 비쌈", () => {
    expect(pickedSubline({ depart: "2026-12-30", return: "2027-01-06", price: 300000 }, cheapestDay(NRT)!)).toBe("고른 날 12월 30일(수) 출발 300,000원 · 가장 싼 날보다 25,127원 비쌈");
  });
});

describe("날짜 띠 가격 색 (R5)", () => {
  it("아래 1/4 는 low · 위 1/4 는 high · 가운데는 mid (시안 규칙)", () => {
    const prices = NRT.map((d) => d.price);
    const s = [...prices].sort((a, b) => a - b);
    const q1 = s[Math.floor(s.length * 0.25)], q3 = s[Math.floor(s.length * 0.75)];
    for (const d of NRT) expect(priceTier(d.price, NRT), String(d.price)).toBe(d.price <= q1 ? "low" : d.price >= q3 ? "high" : "mid");
    expect(priceTier(274873, NRT)).toBe("low");
    expect(priceTier(685748, NRT)).toBe("high");
    expect(NRT.filter((d) => priceTier(d.price, NRT) === "low").length).toBeGreaterThanOrEqual(10);
    expect(NRT.filter((d) => priceTier(d.price, NRT) === "high").length).toBeGreaterThanOrEqual(10);
  });
  it("값이 모두 같으면 전부 low 로 (하이 · 로우가 동시에 붙지 않음)", () => {
    const flat = NRT.map((d) => ({ ...d, price: 300000 }));
    expect(new Set(flat.map((d) => priceTier(d.price, flat)))).toEqual(new Set(["low"]));
  });
});

describe("요일별 평균 · 요약 두 항목 (R6)", () => {
  it("weekdayAverages — 길이 7 · 출발일 요일별 평균 · 날이 없는 요일은 null", () => {
    const avg = weekdayAverages(NRT);
    expect(avg).toHaveLength(7);
    for (let w = 0; w < 7; w++) {
      const xs = NRT.filter((d) => wd(d.depart) === w).map((d) => d.price);
      expect(avg[w]).toBeCloseTo(xs.reduce((a, b) => a + b, 0) / xs.length, 5);
    }
    const two = weekdayAverages([{ depart: "2026-11-23", return: "2026-11-30", price: 100000 }, { depart: "2026-11-30", return: "2026-12-07", price: 300000 }]);
    expect(two[0]).toBe(200000);
    expect(two.slice(1).every((v) => v === null)).toBe(true);
  });
  it("cheapestWeekday — 가장 싼 요일 · 가장 비싼 요일", () => {
    const avg = weekdayAverages(NRT) as number[];
    const r = cheapestWeekday(NRT)!;
    expect(r.average).toBeCloseTo(Math.min(...avg), 5);
    expect(r.weekday).toBe(avg.indexOf(Math.min(...avg)));
    expect(r.priciest.average).toBeCloseTo(Math.max(...avg), 5);
    expect(cheapestWeekday([])).toBeNull();
  });
  it("priceSpread — 최저 ↔ 최고 · 배수", () => {
    const s = priceSpread(NRT)!;
    expect(s.lo).toBe(274873);
    expect(s.hi).toBe(685748);
    expect(s.ratio).toBeCloseTo(685748 / 274873, 5);
    expect(priceSpread([])).toBeNull();
  });
  it("summaryFacts — 이름표 → 큰 값 → 풀이 (시안 문구)", () => {
    const f = summaryFacts(NRT)!;
    const w = cheapestWeekday(NRT)!;
    const man = (v: number) => (v / 10000).toFixed(1);
    expect(f.weekday.label).toBe("가장 싼 요일");
    expect(f.weekday.big).toBe(`${WD[w.weekday]}요일`);
    expect(f.weekday.say).toBe(`출발 평균 ${man(w.average)}만 원으로, 가장 비싼 ${WD[w.priciest.weekday]}요일보다 ${man(w.priciest.average - w.average)}만 원 쌉니다.`);
    expect(f.spread.label).toBe("출발일에 따른 차이");
    expect(f.spread.big).toBe("최대 2.5배");
    expect(f.spread.say).toBe("가장 싼 날 27.5만 원부터 가장 비싼 날 68.6만 원까지 벌어집니다.");
    expect(JSON.stringify(f)).not.toMatch(/구글|싼 날로 표시|serpapi/i);
    expect(summaryFacts([])).toBeNull();
  });
});

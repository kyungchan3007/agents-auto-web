// 작업 0216 그래프 2D(시안 F) — 선 그래프 공통 부품의 계산 (테스트 먼저 · 구현은 line-chart.ts)
//   기준: .tmp/redesign-1118/F/chart.js 의 monotone · lineChart (곡선 · 눈금 · 최고/최저 점 · 끝 말풍선 · 시간표)
//   부품 계약: monotonePath · valueScale · extremeIndices · stackBubbles · chartSchedule · progressAt
import { describe, expect, it } from "vitest";
import { chartSchedule, extremeIndices, monotonePath, progressAt, stackBubbles, valueScale } from "./line-chart";

type P = [number, number];

/** "M x,y C x1,y1 x2,y2 x,y C ..." 를 점 · 구간으로 풀어 읽음 */
function parse(d: string): { start: P; segs: { c1: P; c2: P; end: P }[] } {
  const m = d.match(/^M\s*(-?[\d.]+),(-?[\d.]+)/);
  if (!m) throw new Error(`M 으로 시작하지 않음: ${d}`);
  const segs = [...d.matchAll(/C\s*(-?[\d.]+),(-?[\d.]+)\s+(-?[\d.]+),(-?[\d.]+)\s+(-?[\d.]+),(-?[\d.]+)/g)].map((s) => ({
    c1: [Number(s[1]), Number(s[2])] as P,
    c2: [Number(s[3]), Number(s[4])] as P,
    end: [Number(s[5]), Number(s[6])] as P,
  }));
  return { start: [Number(m[1]), Number(m[2])], segs };
}
const bez = (a: number, b: number, c: number, e: number, t: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * e;

describe("monotonePath — 부드러운 선 (단조 3차 · 점을 넘지 않음)", () => {
  const pts: P[] = [
    [0, 100],
    [10, 40],
    [20, 70],
    [30, 70], // 평평한 구간
    [40, 20],
    [50, 90],
  ];

  it("M 으로 시작해 점 사이마다 C 한 구간 · 모든 점을 그대로 지남(소수 1자리)", () => {
    const { start, segs } = parse(monotonePath(pts));
    expect(start).toEqual(pts[0]);
    expect(segs).toHaveLength(pts.length - 1);
    segs.forEach((s, i) => expect(s.end).toEqual(pts[i + 1]));
  });

  it("빈 입력은 빈 글 · 점 하나는 M 만", () => {
    expect(monotonePath([])).toBe("");
    expect(monotonePath([[5, 6]])).toMatch(/^M\s*5(\.0)?,6(\.0)?\s*$/);
  });

  it("점 둘은 직선 한 구간 (조절점이 두 점을 잇는 선 위)", () => {
    const { segs } = parse(monotonePath([[0, 0], [30, 60]]));
    expect(segs).toHaveLength(1);
    for (const c of [segs[0].c1, segs[0].c2]) expect(Math.abs(c[1] - 2 * c[0])).toBeLessThanOrEqual(0.3);
  });

  it("각 구간의 곡선이 양 끝 점의 값 범위를 넘지 않음 (되튐 없음) · 조절점 x 가 구간 안", () => {
    const { start, segs } = parse(monotonePath(pts));
    let prev = start;
    for (const s of segs) {
      const lo = Math.min(prev[1], s.end[1]) - 0.2;
      const hi = Math.max(prev[1], s.end[1]) + 0.2;
      for (let k = 0; k <= 40; k++) {
        const y = bez(prev[1], s.c1[1], s.c2[1], s.end[1], k / 40);
        expect(y, `구간 ${prev}→${s.end} t=${k / 40}`).toBeGreaterThanOrEqual(lo);
        expect(y).toBeLessThanOrEqual(hi);
      }
      expect(s.c1[0]).toBeGreaterThanOrEqual(prev[0]);
      expect(s.c2[0]).toBeLessThanOrEqual(s.end[0]);
      expect(s.c1[0]).toBeLessThanOrEqual(s.c2[0]);
      prev = s.end;
    }
  });

  it("평평한 구간(같은 값 둘)은 완전히 평평 — 조절점 y 가 같은 값", () => {
    const { segs } = parse(monotonePath(pts));
    expect(segs[2].c1[1]).toBe(70);
    expect(segs[2].c2[1]).toBe(70);
  });

  it("x 가 고르지 않아도(달 건너뜀) 같은 성질", () => {
    const uneven: P[] = [[0, 10], [3, 50], [4, 20], [20, 60], [21, 5]];
    const { start, segs } = parse(monotonePath(uneven));
    let prev = start;
    segs.forEach((s, i) => {
      expect(s.end).toEqual(uneven[i + 1]);
      const lo = Math.min(prev[1], s.end[1]) - 0.2;
      const hi = Math.max(prev[1], s.end[1]) + 0.2;
      for (let k = 0; k <= 20; k++) {
        const y = bez(prev[1], s.c1[1], s.c2[1], s.end[1], k / 20);
        expect(y).toBeGreaterThanOrEqual(lo);
        expect(y).toBeLessThanOrEqual(hi);
      }
      prev = s.end;
    });
  });
});

describe("valueScale — 값 → 세로 위치 (최소 = 아래 · 최대 = 위)", () => {
  it("끝 · 가운데 · 비율", () => {
    const y = valueScale({ min: 110, max: 160 }, 40, 340);
    expect(y(110)).toBeCloseTo(340);
    expect(y(160)).toBeCloseTo(40);
    expect(y(135)).toBeCloseTo(190);
    expect(y(120)).toBeCloseTo(280);
  });
  it("범위 밖 값도 같은 직선 위(자르지 않음)", () => {
    const y = valueScale({ min: 0, max: 100 }, 0, 100);
    expect(y(150)).toBeCloseTo(-50);
    expect(y(-10)).toBeCloseTo(110);
  });
  it("최소 = 최대 이면 가운데 한 줄 (NaN 없음)", () => {
    const y = valueScale({ min: 5, max: 5 }, 20, 120);
    expect(y(5)).toBeCloseTo(70);
    expect(Number.isFinite(y(9))).toBe(true);
  });
});

describe("extremeIndices — 최고 · 최저 점 위치", () => {
  it("값이 가장 큰 · 작은 칸의 순서", () => {
    expect(extremeIndices([120, 118.8, 158.6, 146.8])).toEqual({ max: 2, min: 1 });
  });
  it("같은 값이 여럿이면 처음 나온 칸", () => {
    expect(extremeIndices([3, 9, 1, 9, 1])).toEqual({ max: 1, min: 2 });
  });
  it("칸이 하나면 둘 다 0 · 빈 입력은 null", () => {
    expect(extremeIndices([7])).toEqual({ max: 0, min: 0 });
    expect(extremeIndices([])).toBeNull();
  });
  it("숫자가 아닌 칸(NaN)은 건너뜀", () => {
    expect(extremeIndices([Number.NaN, 4, 2, Number.NaN, 9])).toEqual({ max: 4, min: 2 });
  });
});

describe("stackBubbles — 끝 말풍선들이 서로 겹치지 않게 세로로 벌림", () => {
  const ok = (centers: number[], heights: number[], H: number, gap: number) => {
    const order = centers.map((c, i) => ({ c, h: heights[i] })).sort((a, b) => a.c - b.c);
    for (let i = 1; i < order.length; i++) expect(order[i].c - order[i - 1].c, "겹침").toBeGreaterThanOrEqual((order[i].h + order[i - 1].h) / 2 + gap - 0.01);
    for (const o of order) {
      expect(o.c - o.h / 2, "위로 넘침").toBeGreaterThanOrEqual(4 - 0.01);
      expect(o.c + o.h / 2, "아래로 넘침").toBeLessThanOrEqual(H - 4 + 0.01);
    }
  };

  it("이미 떨어져 있으면 그대로 · 입력 순서대로 돌려줌", () => {
    expect(stackBubbles([300, 100], [50, 50], 400)).toEqual([300, 100]);
  });
  it("가까우면 간격(높이 합의 반 + 6)만큼 벌림 · 순서 유지", () => {
    const out = stackBubbles([100, 105, 110], [50, 50, 50], 400);
    ok(out, [50, 50, 50], 400, 6);
    expect(out[0]).toBeLessThan(out[1]);
    expect(out[1]).toBeLessThan(out[2]);
  });
  it("아래 끝을 넘으면 통째로 위로 올림", () => {
    const out = stackBubbles([380, 385], [50, 50], 400);
    ok(out, [50, 50], 400, 6);
  });
  it("위 끝에 붙은 것도 화면 안으로", () => {
    const out = stackBubbles([2, 6], [50, 26], 300);
    ok(out, [50, 26], 300, 6);
  });
  it("높이가 다른 말풍선 · 무작위 여러 번도 겹침 · 넘침 없음 (자리가 충분할 때)", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < 60; n++) {
      const k = 2 + Math.floor(rnd() * 3);
      const hs = Array.from({ length: k }, () => 26 + Math.floor(rnd() * 30));
      const ys = Array.from({ length: k }, () => rnd() * 320);
      ok(stackBubbles(ys, hs, 340), hs, 340, 6);
    }
  });
  it("하나뿐이면 화면 안으로만 맞춤", () => {
    expect(stackBubbles([200], [50], 400)).toEqual([200]);
    expect(stackBubbles([-30], [50], 400)[0]).toBeCloseTo(29);
  });
});

describe("chartSchedule — 순서 움직임의 시간표 (눈금 → 선 → 점 → 면 → 끝 점 · 말풍선 · 카운트업)", () => {
  const sch = chartSchedule({
    series: [
      { marks: [0.2, 0.9], area: true },
      { marks: [], area: true },
      { marks: [], area: false },
    ],
  });

  it("눈금이 맨 먼저 시작 · 날짜 글은 눈금 뒤에 시작", () => {
    for (const s of sch.series) expect(sch.grid.at).toBeLessThan(s.line.at);
    expect(sch.axis.at).toBeGreaterThanOrEqual(sch.grid.at);
    expect(sch.grid.dur).toBeGreaterThan(0);
    expect(sch.axis.dur).toBeGreaterThan(0);
  });

  it("선은 차례로(앞 선이 먼저 시작) · 각 선은 0.8~3초 동안 그려짐", () => {
    for (let i = 1; i < sch.series.length; i++) expect(sch.series[i].line.at).toBeGreaterThan(sch.series[i - 1].line.at);
    for (const s of sch.series) {
      expect(s.line.dur).toBeGreaterThanOrEqual(800);
      expect(s.line.dur).toBeLessThanOrEqual(3000);
    }
  });

  it("최고 · 최저 점은 선이 그 자리를 지날 때 — 선 그리는 동안 안이고, 뒤쪽 점이 더 늦음", () => {
    const s = sch.series[0];
    expect(s.marks).toHaveLength(2);
    for (const m of s.marks) {
      expect(m.at).toBeGreaterThanOrEqual(s.line.at);
      expect(m.at).toBeLessThanOrEqual(s.line.at + s.line.dur);
      expect(m.dur).toBeGreaterThan(0);
    }
    expect(s.marks[1].at).toBeGreaterThan(s.marks[0].at);
    expect(sch.series[1].marks).toHaveLength(0);
  });

  it("색 면은 선이 거의 그려진 뒤 아래에서 차오름 (선 후반에 시작 · 선보다 늦게 끝남) · 면 없는 선은 null", () => {
    for (const s of sch.series.slice(0, 2)) {
      expect(s.area).not.toBeNull();
      expect(s.area!.at).toBeGreaterThanOrEqual(s.line.at + s.line.dur * 0.5);
      expect(s.area!.at + s.area!.dur).toBeGreaterThanOrEqual(s.line.at + s.line.dur);
    }
    expect(sch.series[2].area).toBeNull();
  });

  it("끝 점 → 말풍선 → 카운트업 순서 · 끝 점은 선이 끝나는 즈음", () => {
    for (const s of sch.series) {
      expect(s.endDot.at).toBeGreaterThanOrEqual(s.line.at + s.line.dur - 150);
      expect(s.endDot.at).toBeLessThanOrEqual(s.line.at + s.line.dur + 300);
      expect(s.endBubble.at).toBeGreaterThanOrEqual(s.endDot.at);
      expect(s.endCount.at).toBeGreaterThanOrEqual(s.endBubble.at);
      expect(s.endCount.dur).toBeGreaterThanOrEqual(600);
    }
  });

  it("전체 길이 = 가장 늦게 끝나는 것 · 4초 이내 (너무 길지 않게)", () => {
    const ends: number[] = [sch.grid.at + sch.grid.dur, sch.axis.at + sch.axis.dur];
    for (const s of sch.series) {
      for (const sp of [s.line, s.area, s.endDot, s.endBubble, s.endCount, ...s.marks]) if (sp) ends.push(sp.at + sp.dur);
    }
    expect(sch.total).toBeCloseTo(Math.max(...ends), 0);
    expect(sch.total).toBeLessThanOrEqual(4000);
  });

  it("선 하나 · 점 없음 · 면 없음도 만들어짐 (통화 1년 흐름 모양)", () => {
    const one = chartSchedule({ series: [{ marks: [0.5, 0.8], area: true }] });
    expect(one.series).toHaveLength(1);
    expect(one.total).toBeGreaterThan(one.series[0].line.at + one.series[0].line.dur - 1);
  });

  it("durationMs · staggerMs 를 바꾸면 따라감", () => {
    const slow = chartSchedule({ series: [{ marks: [], area: false }, { marks: [], area: false }], durationMs: 2000, staggerMs: 500 });
    expect(slow.series[0].line.dur).toBe(2000);
    expect(slow.series[1].line.at - slow.series[0].line.at).toBe(500);
  });
});

describe("progressAt — 시간 → 0~1 진행", () => {
  const span = { at: 500, dur: 1000 };
  it("시작 전 0 · 끝난 뒤 1 · 가운데는 선형", () => {
    expect(progressAt(span, 0)).toBe(0);
    expect(progressAt(span, 500)).toBe(0);
    expect(progressAt(span, 1000)).toBeCloseTo(0.5);
    expect(progressAt(span, 1500)).toBe(1);
    expect(progressAt(span, 99999)).toBe(1);
  });
  it("움직임 줄이기(무한대)면 모두 최종 = 1 · 길이 0 이면 그 시각에 바로 1", () => {
    expect(progressAt(span, Number.POSITIVE_INFINITY)).toBe(1);
    expect(progressAt({ at: 300, dur: 0 }, 299)).toBe(0);
    expect(progressAt({ at: 300, dur: 0 }, 300)).toBe(1);
  });
});

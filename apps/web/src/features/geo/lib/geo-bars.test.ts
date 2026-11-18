// 작업 0214 — /geo 시안 B 막대 계산 (순수 함수) · 값은 받은 자료 그대로 · 막대마다 같은 숫자를 글로
import { describe, expect, it } from "vitest";
import { barRows, dayColumns } from "./geo-bars";

describe("barRows — 가로 막대 (작업 0214)", () => {
  it("가장 큰 값이 100% · 나머지는 비례 · 0 이 아니면 최소 2%", () => {
    const r = barRows([{ label: "GPTBot", value: 89 }, { label: "ClaudeBot", value: 34 }, { label: "OAI-SearchBot", value: 3 }]);
    expect(r.map((x) => x.pct)).toEqual([100, Math.round((34 / 89) * 100), 3]);
    expect(barRows([{ label: "a", value: 1000 }, { label: "b", value: 1 }])[1].pct).toBe(2);
  });
  it("글 숫자는 천 단위 쉼표 · 값 0 은 막대 0% · 빈 목록은 빈 배열", () => {
    expect(barRows([{ label: "a", value: 1234 }])[0].text).toBe("1,234");
    expect(barRows([{ label: "a", value: 5 }, { label: "b", value: 0 }])[1]).toMatchObject({ pct: 0, text: "0" });
    expect(barRows([])).toEqual([]);
  });
});

describe("dayColumns — 날마다 막대 (작업 0214)", () => {
  const h = [
    { day: "2026-11-08", engine: "claude" as const, total: 24, ok: 0, cited: 0 },
    { day: "2026-11-05", engine: "claude" as const, total: 24, ok: 24, cited: 0 },
    { day: "2026-11-05", engine: "openai" as const, total: 24, ok: 12, cited: 2 },
  ];
  const cols = dayColumns(h);
  it("날짜 오름차순 · 같은 날 서비스는 합침", () => {
    expect(cols.map((c) => c.day)).toEqual(["2026-11-05", "2026-11-08"]);
    expect(cols[0]).toMatchObject({ total: 48, ok: 36, cited: 2, failed: false });
  });
  it("응답이 하나도 없는 날은 실패(점선) · 막대 높이는 가장 큰 날 기준", () => {
    expect(cols[1]).toMatchObject({ failed: true, ok: 0 });
    expect(cols[0].heightPct).toBe(100);
    expect(cols[1].heightPct).toBe(100); // 점선 칸은 전체 높이로 보임
  });
  it("같은 숫자를 글로 — 응답 받은 질문 · 인용 · 실패", () => {
    expect(cols[0].text).toBe("2026-11-05 응답 받은 질문 36개 · 인용 2개");
    expect(cols[1].text).toBe("2026-11-08 측정 실패 (저장 24개 중 응답 0개)");
  });
  it("측정이 없으면 빈 배열", () => {
    expect(dayColumns([])).toEqual([]);
  });
  it("가운데 날짜가 비어도 그 날을 만들지 않음 (측정하지 않은 날은 비워 둠)", () => {
    expect(dayColumns([{ day: "2026-11-05", engine: "claude", total: 1, ok: 1, cited: 0 }, { day: "2026-11-09", engine: "claude", total: 1, ok: 1, cited: 0 }]).map((c) => c.day)).toEqual(["2026-11-05", "2026-11-09"]);
  });
});

// 작업 0214 — /geo 시안 B 막대 계산 (순수 함수) · 값은 받은 자료 그대로 · 막대마다 같은 숫자를 글로
import { describe, expect, it } from "vitest";
import { barRows, botPagesView, dayColumns } from "./geo-bars";

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

describe("botPagesView — 봇별 읽은 페이지 카드 계산 (작업 0226)", () => {
  const paths = (n: number) => Array.from({ length: n }, (_, i) => ({ path: `/p${i + 1}`, hits: 100 - i * 10 })); // 100, 90, 80 ...
  const gpt = { name: "GPTBot", kind: "training" as const, hits: 1234, paths: paths(7) };
  it("필드가 없거나(옛 응답) 비면 빈 배열 — 숫자를 만들지 않음", () => {
    expect(botPagesView(undefined)).toEqual([]);
    expect(botPagesView([])).toEqual([]);
  });
  it("경로가 하나도 없는 봇은 카드에 안 넣음", () => {
    expect(botPagesView([{ name: "ClaudeBot", kind: "training", hits: 0, paths: [] }])).toEqual([]);
  });
  it("기본은 봇마다 상위 5개 경로 막대 · 나머지는 '그 밖 N곳 · M회' (받은 순서 그대로 자름)", () => {
    const [v] = botPagesView([gpt]);
    expect(v.rows.map((r) => r.label)).toEqual(["/p1", "/p2", "/p3", "/p4", "/p5"]);
    expect(v.rest).toEqual({ places: 2, hits: 50 + 40, text: "그 밖 2곳 · 90회" });
  });
  it("막대는 그 봇 안에서 가장 큰 값이 100% · 값은 받은 그대로 · 글에도 같은 숫자", () => {
    const [v] = botPagesView([gpt]);
    expect(v.rows[0]).toMatchObject({ value: 100, pct: 100, text: "100" });
    expect(v.rows[1].pct).toBe(90);
    expect(v.rows.map((r) => r.value)).toEqual([100, 90, 80, 70, 60]);
  });
  it("봇 제목 글 — 이름 · 총 횟수(천 단위 쉼표) · 경로 수 · 봇 순서는 받은 그대로", () => {
    const out = botPagesView([gpt, { name: "Googlebot", kind: "engine", hits: 10, paths: [{ path: "/", hits: 9 }, { path: "/robots.txt", hits: 1 }] }]);
    expect(out.map((b) => b.name)).toEqual(["GPTBot", "Googlebot"]);
    expect(out[0].text).toBe("GPTBot · 총 1,234회 · 7곳");
    expect(out[1]).toMatchObject({ kind: "engine", hits: 10, text: "Googlebot · 총 10회 · 2곳", rest: null });
  });
  it("경로가 정확히 5개 이하면 '그 밖' 이 없음 · limit 을 바꾸면 따라감 · 1,000 이상 합계도 쉼표", () => {
    expect(botPagesView([{ ...gpt, paths: paths(5) }])[0].rest).toBeNull();
    expect(botPagesView([gpt], 3)[0].rows).toHaveLength(3);
    expect(botPagesView([gpt], 3)[0].rest).toEqual({ places: 4, hits: 70 + 60 + 50 + 40, text: "그 밖 4곳 · 220회" });
    const big = { name: "GPTBot", kind: "training" as const, hits: 5000, paths: [{ path: "/a", hits: 2000 }, { path: "/b", hits: 1000 }, { path: "/c", hits: 900 }] };
    expect(botPagesView([big], 1)[0].rest?.text).toBe("그 밖 2곳 · 1,900회");
  });
});

// 작업 0177 — 출발 안내판(스플릿 플랩)의 글자 칸 · 넘어가는 차례 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "출발 안내판 C안 사진에 걸치기" — 글자판은 HTML/CSS 칸(고정폭) · 처음 한 번 1~2초 넘어가며 맞춰짐 · 움직임 줄이기면 바로 최종 글자 (움직임 코드는 flap-board.test.ts)
//
// builder 가 만들 것 — packages/ui/src/lib/flap.ts
//   export const EMPTY_TEXT = "----"                     // 값이 없을 때 판에 보이는 빈 칸 글 (지어내지 않음)
//   export function toCells(text: string | null | undefined, cols: number, opts?: { align?: "left" | "right" }): string[]
//     - 길이는 항상 cols (cols ≤ 0 이면 []) · 글자(코드 포인트) 하나가 한 칸 — 한글 · 숫자 · 기호 · 공백 모두 한 칸 (Array.from 단위)
//     - 앞뒤 공백은 지우고 칸에 맞춤: 모자라면 빈 칸(" ")으로 채움 — align "left"(기본)는 오른쪽에, "right" 는 왼쪽에
//     - 칸보다 길면 줄임: 앞 cols − 1 글자 + "…" (cols 가 1 이면 첫 글자만) — 딱 맞으면 그대로(줄임 없음)
//     - null · undefined · "" · 공백뿐이면 EMPTY_TEXT("----")를 같은 규칙으로 (cols 가 4 보다 작으면 "-" 를 cols 개 · 줄임표 없음)
//   export type FlipStep = { index: number; delayMs: number; stepMs: number; frames: string[] }
//   export function flipPlan(cells: string[], opts?: { totalMs?: number; steps?: number }): FlipStep[]
//     - 칸마다 하나 · index 는 0..n-1 · delayMs 는 첫 칸 0 에서 칸마다 조금씩 늦게(n ≥ 2 면 엄격히 증가)
//     - frames = 처음 글자 → 최종 글자 단계 목록: 길이 steps(기본 6) · 마지막은 그 칸의 최종 글자 · 빈 문자열 없음 · 같은 입력이면 같은 결과(난수 없음)
//     - 빈 칸(" ")은 넘어갈 것이 없어 frames [" "]
//     - 전체 걸리는 시간(flipDurationMs)은 totalMs(기본 1500)에 맞음 — totalMs 는 1000 ~ 2000 으로 자름 (사용자 "1~2초")
//   export function flipDurationMs(plan: FlipStep[]): number     // max(delayMs + frames.length × stepMs) · 빈 plan 은 0
import { describe, expect, it } from "vitest";
import { EMPTY_TEXT, cellsAt, flipDurationMs, flipPlan, toCells } from "./flap";

const J = (cells: string[]) => cells.join("");

describe("toCells — 글자 → 칸", () => {
  it("한 글자가 한 칸 — 한글 · 영문 · 기호 · 공백 · 모자라면 오른쪽을 빈 칸으로", () => {
    const c = toCells("ICN → 도쿄", 12);
    expect(c).toHaveLength(12);
    expect(c.slice(0, 8)).toEqual(["I", "C", "N", " ", "→", " ", "도", "쿄"]);
    expect(c.slice(8).every((x) => x === " ")).toBe(true);
  });

  it("오른쪽 맞춤 — 앞을 빈 칸으로 (금액 줄)", () => {
    expect(J(toCells("833원", 8, { align: "right" }))).toBe("    833원"); // 4글자 → 앞 빈 칸 4개
  });

  it("딱 맞으면 그대로 · 줄임표 없음", () => {
    expect(J(toCells("도쿄도쿄", 4))).toBe("도쿄도쿄");
  });

  it("칸보다 길면 앞 cols−1 글자 + '…' (긴 금액 1,234.56원)", () => {
    expect(J(toCells("1,234.56원 / 100엔", 10))).toBe("1,234.56원…");
    expect(toCells("1,234.56원 / 100엔", 10)).toHaveLength(10);
  });

  it("칸이 1 개면 첫 글자만 · 0 이하는 []", () => {
    expect(toCells("도쿄", 1)).toEqual(["도"]);
    expect(toCells("도쿄", 0)).toEqual([]);
    expect(toCells("도쿄", -3)).toEqual([]);
  });

  it("앞뒤 공백은 지움 · 글자 가운데 공백은 그대로", () => {
    expect(J(toCells("  도 쿄 ", 5))).toBe("도 쿄  ");
  });

  it("코드 포인트 단위 — 두 코드 유닛 글자도 한 칸", () => {
    expect(toCells("A𝒳B", 3)).toEqual(["A", "𝒳", "B"]);
  });

  it("값이 없으면 '----' (null · undefined · 빈 글 · 공백뿐) — 칸이 4 보다 작으면 '-' 를 칸 수만큼", () => {
    expect(EMPTY_TEXT).toBe("----");
    for (const v of [null, undefined, "", "   "]) expect(J(toCells(v, 8)), String(v)).toBe("----    ");
    expect(J(toCells(null, 3))).toBe("---");
    expect(toCells(undefined, 0)).toEqual([]);
  });
});

describe("flipPlan — 넘어가는 차례", () => {
  const cells = toCells("ICN → 도쿄", 10);

  it("칸마다 하나 · index 순서 · 첫 칸 0ms · 칸마다 조금씩 늦게(엄격히 증가)", () => {
    const plan = flipPlan(cells);
    expect(plan.map((p) => p.index)).toEqual(cells.map((_, i) => i));
    expect(plan[0].delayMs).toBe(0);
    for (let i = 1; i < plan.length; i++) expect(plan[i].delayMs, `칸 ${i}`).toBeGreaterThan(plan[i - 1].delayMs);
  });

  it("처음 글자 → 최종 글자 단계 — 길이 6(기본) · 마지막은 최종 글자 · 빈 문자열 없음", () => {
    for (const p of flipPlan(cells)) {
      if (cells[p.index] === " ") continue;
      expect(p.frames, `칸 ${p.index}`).toHaveLength(6);
      expect(p.frames.at(-1)).toBe(cells[p.index]);
      expect(p.frames.every((f) => f.length > 0)).toBe(true);
    }
  });

  it("steps 옵션 · 같은 입력이면 같은 결과(난수 없음)", () => {
    expect(flipPlan(cells, { steps: 4 })[0].frames).toHaveLength(4);
    expect(flipPlan(cells)).toEqual(flipPlan(cells));
  });

  it("빈 칸(' ')은 넘어갈 것이 없음 — frames [' ']", () => {
    const blank = flipPlan(cells).find((p) => cells[p.index] === " ");
    expect(blank?.frames).toEqual([" "]);
  });

  it("전체 시간은 기본 1500ms(마지막 칸이 글자일 때) — flipDurationMs", () => {
    const full = toCells("ICN → 도쿄도쿄", 10); // 마지막 칸까지 글자
    expect(Math.abs(flipDurationMs(flipPlan(full)) - 1500)).toBeLessThanOrEqual(5);
    expect(flipDurationMs(flipPlan(cells))).toBeLessThanOrEqual(1505);
  });

  it("totalMs 는 1000 ~ 2000 으로 자름 (사용자 '1~2초')", () => {
    const full = toCells("ABCDEFGHIJ", 10);
    expect(flipDurationMs(flipPlan(full, { totalMs: 300 }))).toBeGreaterThanOrEqual(995);
    expect(flipDurationMs(flipPlan(full, { totalMs: 9000 }))).toBeLessThanOrEqual(2005);
    expect(Math.abs(flipDurationMs(flipPlan(full, { totalMs: 1800 })) - 1800)).toBeLessThanOrEqual(5);
  });

  it("빈 목록 · 한 칸", () => {
    expect(flipPlan([])).toEqual([]);
    expect(flipDurationMs([])).toBe(0);
    const one = flipPlan(["도"]);
    expect(one).toHaveLength(1);
    expect(one[0].delayMs).toBe(0);
    expect(one[0].frames.at(-1)).toBe("도");
  });
});

// ── 작업 0194: 글자가 바뀔 때 — 이미 보이는 글자에서 새 글자로 넘어가는 한 시각의 칸들 (인트로 로딩 안내판) ──
// builder 가 만들 것 — packages/ui/src/lib/flap.ts
//   export function cellsAt(from: string[], to: string[], plan: FlipStep[], elapsedMs: number): string[]
//     - 길이는 to 와 같음 · 같은 칸(from[i] === to[i])은 처음부터 끝까지 그 글자 (넘어가지 않음)
//     - 아직 차례가 안 온 칸(elapsedMs < delayMs)은 from[i] · 넘어가는 중이면 그 칸 frames 의 단계 글자 · 다 끝나면(delayMs + frames.length × stepMs 이상) to[i]
//     - 난수 없음 — 같은 입력이면 같은 결과
describe("cellsAt — 바뀐 칸만 넘어감 (작업 0194)", () => {
  const from = toCells("ICN → 탑승 준비 중", 14);
  const to = toCells("어디로 떠나시나요?", 14);
  const plan = flipPlan(to, { totalMs: 1100 });

  it("시작 직전에는 이전 글자 · 모두 끝나면 새 글자", () => {
    expect(cellsAt(from, to, plan, -1)).toEqual(from);
    expect(cellsAt(from, to, plan, flipDurationMs(plan))).toEqual(to);
    expect(cellsAt(from, to, plan, 99_999)).toEqual(to);
  });

  it("길이는 to 와 같음 · 같은 입력이면 같은 결과(난수 없음)", () => {
    const a = cellsAt(from, to, plan, 400);
    expect(a).toHaveLength(14);
    expect(cellsAt(from, to, plan, 400)).toEqual(a);
  });

  it("같은 칸은 넘어가지 않음 — 이전과 같은 글자는 어느 시각에도 그대로", () => {
    const same = toCells("게이트 배정 중", 14);
    const nextPlan = flipPlan(same, { totalMs: 1100 });
    for (const t of [0, 200, 500, 900, 1500]) expect(cellsAt(same, same, nextPlan, t)).toEqual(same);
    const changed = toCells("게이트 배정 끝", 14);
    const p2 = flipPlan(changed, { totalMs: 1100 });
    // "게이트 배정 " 까지는 같은 칸 — 마지막 글자만 바뀜
    const mid = cellsAt(same, changed, p2, 600);
    expect(mid.slice(0, 7)).toEqual(same.slice(0, 7));
  });

  it("넘어가는 중에는 이전도 최종도 아닌 단계 글자가 나올 수 있고, 마지막 칸은 가장 늦게 끝남", () => {
    const seen = new Set<string>();
    for (let t = 0; t <= 1200; t += 40) cellsAt(from, to, plan, t).forEach((c, i) => c !== from[i] && c !== to[i] && seen.add(c));
    expect(seen.size).toBeGreaterThan(0);
    const last = cellsAt(from, to, plan, flipDurationMs(plan) - 1);
    expect(last.slice(0, 10)).toEqual(to.slice(0, 10)); // 앞쪽 칸들은 이미 끝남
  });
});

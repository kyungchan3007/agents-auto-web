// 작업 0341 — 작업실 칸의 문구 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/admin/src/features/log/records/today-gate.ts (순수 함수 · 그리기는 tsx)
//   export function todayHeadline(items: { done: boolean }[]): string          // "6개 중 4개 끝남"
//   export function durationText(sec: number): string                          // 60초 미만 "45초" · 이상 "1.9분"(소수 한 자리)
//   export function gateLines(g: GateRuns): { count: string; time: string; failed: { label: string; href: string }[] }
//       // count "최근 20번 · 통과 20 · 실패 0" · time "걸린 시간 가운데 값 1.9분 · 최근 1.6분" (값이 null 이면 그 부분만 "자료 없음")
//       // failed: label = "PR #381 · 브랜치" (PR 을 모르면 브랜치만) · href = PR 주소 있으면 PR · 없으면 실행 주소
import type { GateRuns } from "@hav/shared/tasks";
import { describe, expect, it } from "vitest";
import { durationText, gateLines, todayHeadline } from "./today-gate";

const U = "https://github.com/kyungchan3007/agents-auto-web";

describe("오늘 팀이 한 일 맨 위 한 줄", () => {
  it("'N개 중 M개 끝남'", () => {
    expect(todayHeadline([{ done: true }, { done: true }, { done: false }, { done: true }, { done: false }, { done: false }])).toBe("6개 중 3개 끝남");
    expect(todayHeadline([{ done: false }, { done: false }])).toBe("2개 중 0개 끝남");
    expect(todayHeadline([{ done: true }])).toBe("1개 중 1개 끝남");
  });
});

describe("걸린 시간 문구", () => {
  it("60초 미만은 초 · 이상은 분(소수 한 자리)", () => {
    expect(durationText(45)).toBe("45초");
    expect(durationText(98)).toBe("1.6분");
    expect(durationText(113.5)).toBe("1.9분");
    expect(durationText(600)).toBe("10.0분");
  });
});

describe("최근 자동 검사 줄", () => {
  const base: GateRuns = { total: 20, pass: 20, fail: 0, medianSec: 113.5, latestSec: 98, failed: [] };

  it("개수 · 시간 · 실패 없음 (시안 after-1280 의 숫자)", () => {
    expect(gateLines(base)).toEqual({ count: "최근 20번 · 통과 20 · 실패 0", time: "걸린 시간 가운데 값 1.9분 · 최근 1.6분", failed: [] });
  });

  it("실패 줄 — PR 을 알면 PR 주소 · 모르면 실행 주소 (시안 after-fail-1280)", () => {
    const g: GateRuns = {
      ...base,
      total: 30,
      pass: 29,
      fail: 1,
      failed: [
        { branch: "task/0331-readme-refresh", runUrl: `${U}/actions/runs/9`, prNumber: 381, prUrl: `${U}/pull/381` },
        { branch: "task/0340-x", runUrl: `${U}/actions/runs/10`, prNumber: null, prUrl: null },
      ],
    };
    const l = gateLines(g);
    expect(l.count).toBe("최근 30번 · 통과 29 · 실패 1");
    expect(l.failed).toEqual([
      { label: "PR #381 · task/0331-readme-refresh", href: `${U}/pull/381` },
      { label: "task/0340-x", href: `${U}/actions/runs/10` },
    ]);
  });

  it("시간 값을 모르면 그 부분만 '자료 없음' (지어내지 않음)", () => {
    expect(gateLines({ ...base, medianSec: null, latestSec: null }).time).toBe("걸린 시간 가운데 값 자료 없음 · 최근 자료 없음");
    expect(gateLines({ ...base, latestSec: null }).time).toBe("걸린 시간 가운데 값 1.9분 · 최근 자료 없음");
  });
});

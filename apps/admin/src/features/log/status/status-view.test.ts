// 사이트 상태 숫자 칸 (작업 0179 · 0303 · 0312 — status-board.tsx 에 있던 계산을 순수 함수로)
import type { SiteStatus } from "@hav/shared/status";
import { describe, expect, it } from "vitest";
import { statusBoardView, statusLinks } from "./status-view";

const base: SiteStatus = { today: "2026-10-30", now: "2026-10-30T05:40:00Z", latestDate: "2026-10-30", lastRun: null, todayRuns: [], schedule: [] };

describe("사이트 상태 숫자 칸", () => {
  it("'자동 검사 (main)' 카드는 main 의 검사 기록만 연결 (작업 0179)", () => {
    const l = statusLinks("https://github.com/o/r");
    expect(l.checks).toBe("https://github.com/o/r/actions/workflows/checks.yml?query=branch%3Amain");
    expect(l.issues).toBe("https://github.com/o/r/issues");
  });

  it("정상 — 붉은 글자 없음 · 사이트 빌드는 한국 시간 숫자 칸", () => {
    const v = statusBoardView({ ...base, lastRun: { at: "2026-10-30T03:00:30Z", source: "koreaexim", status: "ok", rows: 22, reason: null } }, "2026-10-30T11:31:00Z");
    expect(v.failed).toBe(false);
    expect(v.built).toBe("10-30 20:31");
  });

  it("마지막 수집이 실패면 붉은 글자", () => {
    const v = statusBoardView({ ...base, latestDate: "2026-10-29", lastRun: { at: "2026-10-30T06:00:10Z", source: "koreaexim", status: "error", rows: 0, reason: "http-500" } }, "2026-10-30T11:31:00Z");
    expect(v.failed).toBe(true);
  });
});

// 작업 0218 사용자 지적 — 여행 타이밍 표 모양 (소스 검사) · 테스트 먼저
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, "..");

// 작업 0218 사용자 지적 "시안처럼 해줘 표디자인처럼" — 표 뒤 구간 옅은 면 · 홈 색 = 뒤 구간 색(파인 홈) · 가장 싼 달 글자판은 작은 칸 셋만 단독으로
describe("표 모양 — 홈 없음 · 작은 글자판 (작업 0218 지적)", () => {
  const page = readFileSync(join(WEB_SRC, "features/flights/flights-page.tsx"), "utf8");
  const mini = readFileSync(join(WEB_SRC, "features/flights/mini-board.tsx"), "utf8");

  it("표 뒤 구간(flights-back)은 옅은 면(bg-surface-2) · 절취선 끝 동그라미(홈)는 없음 — NOTCH · flights-ticket-hole 없음 (작업 0218 사용자 지적) @design", () => {
    expect(/<div[^>]*data-testid="flights-back"[^>]*>/.exec(page)?.[0] ?? "").toMatch(/bg-surface-2/);
    expect(page).not.toMatch(/NOTCH|flights-ticket-hole/);
    expect(page).toMatch(/border-dashed/); // 점선 절취선은 그대로
  });

  it("작은 글자판은 큰 판 틀(bg-pin-ink · 안쪽 여백 · 둥근 틀) 없이 칸만 @design", () => {
    const frame = /<div[^>]*data-testid="flap-board"[^>]*>/.exec(mini)?.[0] ?? "";
    expect(frame).not.toBe("");
    expect(frame).not.toMatch(/bg-pin-ink|\bp-\d|rounded-lg/);
  });
});

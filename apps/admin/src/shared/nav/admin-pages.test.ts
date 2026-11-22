// 어드민 메뉴 경로 = 두 Worker 가 보는 어드민 경로 목록 (작업 0312 — 한 곳이 바뀌면 다른 곳도)
import { ADMIN_PATHS } from "@hav/shared/site";
import { describe, expect, it } from "vitest";
import { ADMIN_NAV } from "./admin-pages";

describe("어드민 메뉴", () => {
  it("메뉴 경로가 ADMIN_PATHS 와 같은 순서 · 같은 목록", () => {
    expect(ADMIN_NAV.map((p) => p.href)).toEqual([...ADMIN_PATHS]);
  });
  it("단축키는 겹치지 않는 숫자 한 글자", () => {
    const keys = ADMIN_NAV.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^\d$/);
  });
});

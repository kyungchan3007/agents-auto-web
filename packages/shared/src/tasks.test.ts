import { describe, expect, it } from "vitest";
import { patchesOf } from "./tasks";

const done = (number: number, name: string) => ({ number, task: "0113", name, url: `https://github.com/x/pull/${number}`, mergedAt: "2026-11-05T22:10:00Z" });

describe("패치 내역 (작업 0113)", () => {
  it("보안 · 버그 패치만 고르고 요약을 뗌", () => {
    const r = patchesOf([done(3, "패치(보안) — hono 4.13.15 로 올림"), done(2, "그래프 글자 크기"), done(1, "패치(버그): 공유 단추 오류")]);
    expect(r.map((p) => [p.number, p.kind, p.summary])).toEqual([
      [3, "security", "hono 4.13.15 로 올림"],
      [1, "bug", "공유 단추 오류"],
    ]);
  });

  it("제목 중간의 패치 · 구분이 다른 것은 패치가 아님", () => {
    expect(patchesOf([done(1, "일일 패치(보안) — 안내 글"), done(2, "패치(기능) — 새 화면"), done(3, "패치(보안)")])).toEqual([]);
  });
});

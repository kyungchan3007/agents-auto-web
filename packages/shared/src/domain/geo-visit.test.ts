import { describe, expect, it } from "vitest";
import { classifyVisit, visitPath } from "./geo-visit";

const v = (pathname: string, userAgent: string | null, referer: string | null = null) => classifyVisit({ pathname, userAgent, referer });

describe("GEO 방문 분류 (작업 0129)", () => {
  it("봇 이름으로 종류 구분", () => {
    expect(v("/", "Mozilla/5.0 AppleWebKit/537.36; compatible; GPTBot/1.3; +https://openai.com/gptbot")).toEqual({ kind: "training", name: "GPTBot", path: "/" });
    expect(v("/", "Mozilla/5.0; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot")?.kind).toBe("search");
    expect(v("/", "Mozilla/5.0; compatible; ChatGPT-User/1.0")?.kind).toBe("user");
    expect(v("/", "Mozilla/5.0; compatible; ClaudeBot/1.0")?.name).toBe("ClaudeBot");
    expect(v("/", "Mozilla/5.0 Claude-SearchBot/1.0")?.kind).toBe("search");
    expect(v("/", "Mozilla/5.0 Perplexity-User/1.0")?.kind).toBe("user");
    expect(v("/", "Mozilla/5.0 (compatible; Googlebot/2.1)")?.kind).toBe("engine");
  });
  it("AI 서비스 유입은 서비스 이름만 · 쿼리를 남기지 않음", () => {
    const r = v("/calc", "Mozilla/5.0 Chrome", "https://chatgpt.com/c/abc?q=secret");
    expect(r).toEqual({ kind: "referral", name: "ChatGPT", path: "/calc" });
    expect(JSON.stringify(r)).not.toContain("secret");
  });
  it("일반 방문 · 다른 사이트 유입은 저장하지 않음", () => {
    expect(v("/", "Mozilla/5.0 Chrome")).toBeNull();
    expect(v("/", null)).toBeNull();
    expect(v("/", "Mozilla/5.0", "https://google.com/")).toBeNull();
    expect(v("/", "Mozilla/5.0", "https://evilchatgpt.com/")).toBeNull();
    expect(v("/", "Mozilla/5.0", "잘못된 주소")).toBeNull();
  });
  it("페이지는 고정 목록 — 위조 요청이 행을 늘리지 못함", () => {
    expect(visitPath("/currencies/USD")).toBe("/currencies/*");
    expect(visitPath("/about/")).toBe("/about");
    expect(visitPath("/flights")).toBe("/flights");
    expect(visitPath("/flights/")).toBe("/flights");
    expect(visitPath("/wp-admin")).toBeNull();
    expect(visitPath("/bff/status")).toBeNull();
    expect(v("/없는곳", "GPTBot")).toBeNull();
  });
  it("운영 확인용 이름은 test 로", () => {
    expect(v("/geo", "Tripfx-Verify/1.0")?.kind).toBe("test");
  });
});

// 작업 0172 · 0303 — 작업실 요약 구간 (소스 검사 · 작업 0312 에 apps/web/src/shared/site-story.test.ts 에서 옮김)
//   화면 · 훅 · 로직이 하위 폴더로 나뉘어도 작업실 기능 전체(테스트 제외)에서 찾음
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../.."); // apps/admin/src
const read = (p: string) => readFileSync(p, "utf8");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}

const LOG = [...sources(join(SRC, "features/log")), join(SRC, "app/log/page.tsx")];
const LOG_TEXT = LOG.map((f) => codeOf(read(f))).join("\n");

describe("작업실 — 맨 위 요약 구간", () => {
  it("구간 표시 · 제목 · 단계 · 글 상수(STORY_STEPS) 사용", () => {
    expect(LOG_TEXT).toMatch(/(data-testid|testId)="site-story"/); // 작업 0303: 어드민 판(Panel)은 testId 로 받아 붙임
    expect(LOG_TEXT).toMatch(/data-testid="story-step"/);
    expect(LOG_TEXT).toContain("이 사이트를 어떻게 만들었나");
    expect(LOG_TEXT).toMatch(/\bSTORY_STEPS\b/);
  });

  it("글은 상수에만 — 화면 코드에 단계 제목을 직접 박지 않음 (문제 정의 · 외부 공공 API 연결 · 사고 대응 · 결과 측정)", () => {
    const tsx = LOG.filter((f) => f.endsWith(".tsx")).map((f) => codeOf(read(f))).join("\n");
    for (const t of ["문제 정의", "외부 공공 API 연결", "사고 대응", "결과 측정"]) expect(tsx, t).not.toContain(t);
  });

  // 작업 0303 (어드민): 운영자가 매일 볼 상태 · 기록을 위로 — 요약 구간은 맨 아래 (사용자 "이대로 진행" · 시안 Version 6)
  it("상태판(StatusBoard) → 실시간 기록 → 작업 흐름 → 요약 구간(맨 아래)", () => {
    const page = codeOf(read(join(SRC, "features/log/log-page.tsx")));
    const title = page.indexOf("AI 에이전트 팀이 이 사이트를 만듭니다");
    const board = page.indexOf("<StatusBoard");
    const record = page.indexOf("<RecordCard");
    const flow = page.indexOf("<WorkFlow");
    const story = page.search(/<\w*Story\w*\b/);
    expect(title, "큰 제목").toBeGreaterThanOrEqual(0);
    expect(board, "상태판").toBeGreaterThan(title);
    expect(record, "실시간 기록").toBeGreaterThan(board);
    expect(flow, "작업 흐름").toBeGreaterThan(record);
    expect(story, "요약 구간").toBeGreaterThan(flow);
  });

  it("어드민 판 하나 — 바다 띠 · 그림자 없음 · 단계는 판(Panel) 안 목록 (작업 0303)", () => {
    const story = LOG.filter((f) => /story/i.test(f)).map((f) => codeOf(read(f))).join("\n");
    expect(story.length, "요약 구간 컴포넌트 파일").toBeGreaterThan(0);
    expect(story).not.toMatch(/data-surface="(dark|elevated)"/);
    expect(story).not.toMatch(/\bshadow(-[\w\[\]\/.-]+)?\b/);
    expect(story).toMatch(/<Panel\b/);
    expect(story).toMatch(/\badm-story\b/);
  });
});

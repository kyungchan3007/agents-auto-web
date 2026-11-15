// 작업 0172 — 사이트 소개 강화: 작업실 맨 위 요약 구간 · README (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것
//   작업실(/log) 맨 위에 요약 구간 — 큰 제목(AI 에이전트 팀이 이 사이트를 만듭니다) 바로 아래, 상태판보다 위:
//     <section data-testid="site-story"> 제목 "이 사이트를 어떻게 만들었나" · STORY_STEPS(lib/story.ts)의 단계마다 data-testid="story-step"(다섯 개) · 번호 · 단계 제목 · 불릿 · 출처
//     디자인은 0168~0170 새 디자인 그대로(하늘 종이 · font-display 큰 제목 · 단계 번호 · 테두리 상자 · 울트라마린 전면 없음)
//   README.md 다시 쓰기 — 필수 항목: 무엇을 · 왜 · 어떻게(제목) · 사이트 https://tripfx.pages.dev · Figma https://www.figma.com/design/ssKUqcVolukUjz3paXjxg2 ·
//     작업실(/log) · GEO 측정(/geo) 주소 · 표(| --- |) 없음 · 개인 사정 단어(포트폴리오 · FDE · 채용 · 지원) 없음 · "확인 필요" 없음 ·
//     글의 숫자는 모두 docs/project-facts.md 에 있는 것 (배지 · 링크 · 코드 블록은 제외)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const ROOT = resolve(WEB_SRC, "../../..");
const read = (p: string) => readFileSync(p, "utf8");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}

const LOG = [...sources(join(WEB_SRC, "features/log/components")), join(WEB_SRC, "app/log/page.tsx")];
const LOG_TEXT = LOG.map((f) => codeOf(read(f))).join("\n");

describe("작업실 — 맨 위 요약 구간", () => {
  it("구간 표시 · 제목 · 단계 · 글 상수(STORY_STEPS) 사용", () => {
    expect(LOG_TEXT).toMatch(/data-testid="site-story"/);
    expect(LOG_TEXT).toMatch(/data-testid="story-step"/);
    expect(LOG_TEXT).toContain("이 사이트를 어떻게 만들었나");
    expect(LOG_TEXT).toMatch(/\bSTORY_STEPS\b/);
  });

  it("글은 상수에만 — 화면 코드에 단계 제목을 직접 박지 않음 (문제 정의 · 외부 공공 API 연결 · 사고 대응 · 결과 측정)", () => {
    const tsx = LOG.filter((f) => f.endsWith(".tsx")).map((f) => codeOf(read(f))).join("\n");
    for (const t of ["문제 정의", "외부 공공 API 연결", "사고 대응", "결과 측정"]) expect(tsx, t).not.toContain(t);
  });

  it("큰 제목 바로 아래 · 상태판(StatusBoard)보다 위", () => {
    const page = codeOf(read(join(WEB_SRC, "features/log/components/log-page.tsx")));
    const title = page.indexOf("AI 에이전트 팀이 이 사이트를 만듭니다");
    const story = page.search(/<\w*Story\w*\b/);
    const board = page.indexOf("<StatusBoard");
    expect(title, "큰 제목").toBeGreaterThanOrEqual(0);
    expect(story, "요약 구간 컴포넌트").toBeGreaterThan(title);
    expect(board, "상태판").toBeGreaterThan(story);
  });

  it("새 디자인 그대로 — 바다 띠 · 테두리 상자 · 그림자 없음", () => {
    const story = LOG.filter((f) => /story/i.test(f)).map((f) => codeOf(read(f))).join("\n");
    expect(story.length, "요약 구간 컴포넌트 파일").toBeGreaterThan(0);
    expect(story).not.toMatch(/data-surface="(dark|elevated)"/);
    expect(story).not.toMatch(/\bshadow(-[\w\[\]\/.-]+)?\b|\brounded-card\b|\bborder\s|\bborder-(?!t-2\b)/);
  });
});

describe("README.md", () => {
  const readme = read(join(ROOT, "README.md"));
  const facts = read(join(ROOT, "docs/project-facts.md")).replace(/(?<=\d),(?=\d)/g, "");

  it("필수 항목 — 무엇을 · 왜 · 어떻게 (제목)", () => {
    for (const h of ["무엇", "왜", "어떻게"]) expect(readme, h).toMatch(new RegExp(`^#{1,3}\\s*[^\\n]*${h}`, "m"));
  });

  it("사이트 · Figma · 작업실 · GEO 측정 주소", () => {
    expect(readme).toContain("https://tripfx.pages.dev");
    expect(readme).toContain("https://www.figma.com/design/ssKUqcVolukUjz3paXjxg2");
    expect(readme).toMatch(/tripfx\.pages\.dev\/log/);
    expect(readme).toMatch(/tripfx\.pages\.dev\/geo/);
  });

  it("표(| --- |) 없음", () => {
    expect(readme).not.toMatch(/^\s*\|.*\|\s*$/m);
    expect(readme).not.toMatch(/\|\s*:?-{3,}/);
  });

  it("개인 사정을 드러내는 말 없음 — 포트폴리오 · FDE · 채용 · 지원", () => {
    expect(readme).not.toMatch(/포트폴리오|FDE|채용|지원/);
  });

  it("'확인 필요' 항목 · 한계 · 자기 평가를 쓰지 않음", () => {
    expect(readme).not.toMatch(/확인 필요|한계|아쉬|완벽|뛰어난|훌륭/);
  });

  it("글의 숫자는 모두 사실 기록표(docs/project-facts.md)에 있음 — 배지 · 링크 · 그림 · 코드 블록은 제외", () => {
    const prose = readme
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 그림 · 배지
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크는 글자만
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/(?<=\d),(?=\d)/g, "");
    const missing: string[] = [];
    for (const n of prose.match(/\d+(?:\.\d+)?/g) ?? []) {
      if (!new RegExp(`(?<![\\d.])${n.replace(/\./g, "\\.")}(?![\\d])`).test(facts)) missing.push(n);
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  it("README 가 가리키는 그림 파일이 있음 (깨진 이미지 없음)", () => {
    for (const m of readme.matchAll(/!\[[^\]]*\]\((?!https?:)([^)\s]+)\)/g)) expect(existsSync(join(ROOT, m[1])), m[1]).toBe(true);
    for (const m of readme.matchAll(/<img[^>]*\ssrc="(?!https?:)([^"]+)"/g)) expect(existsSync(join(ROOT, m[1])), m[1]).toBe(true);
  });
});

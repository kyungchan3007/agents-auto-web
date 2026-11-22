// 어드민 화면 소스 검사 — 작업실 /log (P5 · SR-LOG-01) · GEO 측정 /geo (P6 · SR-GEO-01) (작업 0312 에 apps/web/src/checks/pages-redesign.test.ts 에서 옮김)
//   화면 · 훅 · 로직이 하위 폴더로 나뉘어도 같은 기능의 소스 전체(테스트 제외)에서 찾음
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname);
const read = (p: string) => readFileSync(p, "utf8");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function sources(dir: string): string[] {
  const abs = join(SRC, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((d) => {
    const rel = join(dir, d.name);
    if (d.isDirectory()) return sources(rel);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [rel] : [];
  });
}
const text = (files: string[]) => files.map((f) => codeOf(read(join(SRC, f)))).join("\n");
const LOG = text([...sources("features/log"), ...sources("app/log")]);
const GEO = text([...sources("features/geo"), ...sources("app/geo")]);

describe("작업실 /log (P5 · SR-LOG-01)", () => {
  it("큰 제목 · 팀 책상(TEAM_DESKS) · 작업 흐름(WORK_FLOW)", () => {
    expect(LOG).toContain("AI 에이전트 팀이 이 사이트를 만듭니다");
    expect(LOG).toMatch(/\bTEAM_DESKS\b/);
    expect(LOG).toMatch(/\bWORK_FLOW\b/);
    for (const id of ["status-board", "team-desks", "work-flow"]) expect(LOG, id).toMatch(new RegExp(`data-testid="${id}"`));
  });

  it("상태판 칸 이름 · 실패는 붉은 글자(어드민 bad · 작업 0303)", () => {
    for (const s of ["오늘 환율 수집", "사이트 빌드", "자동 검사 (main)", "열린 작업"]) expect(LOG, s).toContain(s);
    expect(LOG).toMatch(/\bbad\b/);
  });

  it("지금 맡은 일(\"지금:\")을 상수에 박아 두지 않음 — 실제 기록에서만", () => {
    expect(codeOf(read(join(SRC, "features/log/team/team.ts")))).not.toMatch(/지금:/);
  });
});

describe("GEO 측정 /geo (P6 · SR-GEO-01)", () => {
  it("자세한 기록을 되살림(작업 0180) — 시안에 없어도 표 · 측정 방법 · 한계가 화면에 있음", () => {
    expect(GEO).toMatch(/\bgeoDetail\b/);
    for (const id of ["geo-answers", "geo-search", "geo-bots", "geo-method", "geo-questions"]) expect(GEO, id).toMatch(new RegExp(`(data-testid=|id=)"${id}"`));
    for (const word of ["질문별 결과", "측정한 날마다 기록", "상위 검색어", "AI 봇별 방문", "측정의 한계", "아직 연결하지 않은 자료"]) expect(GEO, word).toContain(word);
    expect(GEO).toMatch(/<details/);
    expect(GEO).toMatch(/<table\b/);
  });

  it("큰 제목 · 측정 수치 카드(geoCards) · 읽는 법(geoReading)", () => {
    expect(GEO).toContain("AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다");
    expect(GEO).toContain("이 수치를 읽는 법");
    for (const fn of ["geoCards", "geoReading"]) expect(GEO, fn).toMatch(new RegExp(`\\b${fn}\\b`));
    for (const id of ["geo-cards", "geo-reading"]) expect(GEO, id).toMatch(new RegExp(`data-testid="${id}"`));
  });
});

describe("어드민 화면에는 바다 띠(data-surface=\"dark\" · \"elevated\")가 없음 (P10)", () => {
  it("작업실 · GEO · 만드는 방식 · 알리기", () => {
    const files = [...sources("features"), ...sources("app")].filter((f) => /data-surface="(dark|elevated)"/.test(codeOf(read(join(SRC, f)))));
    expect(files).toEqual([]);
  });
});

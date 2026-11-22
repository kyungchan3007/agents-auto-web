// 디자인 시스템 역할 분담 검사 (작업 0312) — 두 앱(apps/web · apps/admin)의 role-boundary.test.ts 와 같은 규칙을 범용 부품에
//   1) 부품(.tsx)은 상태 · 효과 훅을 직접 가져오지 않음 — hooks/<묶음>/use-*.ts 로
//   2) 부품(.tsx)은 계산을 하지 않음 — lib/<묶음>/*.ts 로 (아래 SVG 그래프 두 개는 그리기 안 좌표가 남아 다음 작업 · sdd "남은 일")
//   3) 훅 · lib 는 묶음 폴더에 · 한 폴더에 훅 4개까지 · lib 는 React 를 가져오지 않음
//   4) 이 사이트 도메인(여행지 · 통화 · 판정)을 아는 부품은 두지 않음 — 운영만 쓰면 apps/web/src/shared/<도메인>
//   보관(three/** · motion/lazy-near): 3D 비행기 부품은 "부품 파일은 그대로 둔다"는 예전 결정으로 남김 — 쓰는 곳이 없어 검사에서 뺌
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname);
const rel = (f: string) => relative(SRC, f);
const KEPT = (f: string) => rel(f).startsWith("three/") || rel(f) === "components/motion/lazy-near.tsx";
/** 그리기 안에 좌표 계산(말풍선 · 꼬리표 비킴 · 막대 튐)이 남은 SVG 그래프 — 배치 묶음은 lib/chart 로 옮겼고 나머지는 다음 작업 */
const LOGIC_LATER = new Set(["components/data/line-chart.tsx", "components/data/month-bars.tsx"]);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}
const all = walk(SRC).filter((f) => !KEPT(f));
const sources = all.filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));
const tsx = sources.filter((f) => f.endsWith(".tsx"));
const read = (f: string) => readFileSync(f, "utf8");
const code = (f: string) =>
  read(f)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1")
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
const LOGIC = [
  [/\.(filter|sort|reduce|replace|replaceAll|slice|substring|padStart|padEnd|split|toFixed|toLocaleString|findIndex|flatMap)\(/, "배열 · 글 계산"],
  [/\bMath\.\w+/, "Math 계산"],
  [/\bnew Intl\.|\bDate\.(now|parse)\b|\bnew Date\(/, "날짜 · 서식"],
] as const;

describe("디자인 시스템 역할 분담", () => {
  it("부품(.tsx)은 상태 · 효과 훅을 직접 가져오지 않음 (hooks/<묶음>/use-*.ts 로)", () => {
    const bad = tsx.flatMap((f) =>
      [...read(f).matchAll(/import\s*\{([^}]*)\}\s*from\s*"(react|motion\/react)"/g)]
        .filter((m) => !/^import\s+type/.test(m[0]))
        .flatMap((m) => m[1]!.split(",").map((s) => s.trim().replace(/^type\s+/, "")).filter((s) => /^use[A-Z]/.test(s)))
        .map((h) => `${rel(f)} ${h}`),
    );
    expect(bad).toEqual([]);
  });

  it("부품(.tsx)은 계산을 하지 않음 (lib/<묶음>/*.ts 로)", () => {
    const bad = tsx.filter((f) => !LOGIC_LATER.has(rel(f))).flatMap((f) => LOGIC.filter(([re]) => re.test(code(f))).map(([, w]) => `${rel(f)} ${w}`));
    expect(bad).toEqual([]);
  });

  it("부품(.tsx)은 로직 함수 · 값을 내보내지 않음 (컴포넌트 · 대문자 상수 · 타입만)", () => {
    const bad = tsx.flatMap((f) => [...read(f).matchAll(/^export\s+(?:function|const|let)\s+([a-z]\w*)/gm)].map((m) => `${rel(f)} ${m[1]}`));
    expect(bad).toEqual([]);
  });

  it("훅 · lib 는 묶음 폴더 안 · 한 폴더에 훅 4개까지", () => {
    const loose = sources.filter((f) => /^(hooks|lib)\/[^/]+$/.test(rel(f))).map(rel);
    expect(loose).toEqual([]);
    const dirs = [...new Set(all.map((f) => dirname(f)))];
    const crowded = dirs.map((d) => ({ d, n: all.filter((f) => dirname(f) === d && /\/use-[^/]+\.ts$/.test(f)).length })).filter((x) => x.n > 4).map((x) => `${rel(x.d)} ${x.n}`);
    expect(crowded).toEqual([]);
  });

  it("lib 는 React 를 가져오지 않음", () => {
    const bad = sources.filter((f) => rel(f).startsWith("lib/") && /from\s*"(react|motion\/react)"/.test(read(f).replace(/import type[^\n]*\n/g, ""))).map(rel);
    expect(bad).toEqual([]);
  });

  it("이 사이트 도메인(여행지 고르기 · 판정 · 통화 화면 계약)을 아는 모듈이 없음 — 운영만 쓰면 apps/web/src/shared/<도메인>", () => {
    const bad = sources.filter((f) => /from\s*"@hav\/shared\/(travel|destination-search|freshness|signal)"/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });
});

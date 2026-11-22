// 코드 역할 분담 검사 (작업 0125 · 0137 · 0312) — 운영 apps/web/src/role-boundary.test.ts 와 같은 규칙
//   기준: 사용자 저장소 frontend-architecture (sdd "기준") · 0312 요청 원문
//   1) .tsx 는 그리기만 — 상태 · 효과 훅을 직접 가져오지 않고(커스텀 훅 use-*.ts 로) · 계산(거르기 · 정렬 · 자르기 · 바꾸기 · 날짜 · 숫자 서식)을 하지 않음
//   2) .tsx 는 로직 함수를 내보내지 않음 (Next 라우트가 정한 이름만)
//   3) 기능 폴더 안은 종류별(components · hooks · lib)이 아니라 하위 도메인 폴더로 · 한 폴더에 훅을 몰아 두지 않음
//   4) 순수 로직(.ts)은 React 를 가져오지 않음 · 저장소 · 파일 읽기는 *.server.ts 에만
//   5) 기능 폴더끼리 직접 가져오지 않음 — 함께 쓰면 src/shared(앱 도메인 공통) 또는 packages(두 앱 공통)
//   고치는 법: 계산은 같은 하위 폴더의 *.ts 순수 함수(테스트 옆에) · 상태 · 효과는 use-*.ts · 두 기능이 함께 쓰면 src/shared
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname);
const rel = (f: string) => relative(SRC, f);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}
const all = walk(SRC);
const sources = all.filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !/\.d\.ts$/.test(f));
const tsx = sources.filter((f) => f.endsWith(".tsx"));
const read = (f: string) => readFileSync(f, "utf8");
/** 주석 · 문자열 안 글을 빼고 코드만 */
const code = (f: string) =>
  read(f)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1")
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
const dirs = [...new Set(all.map((f) => dirname(f)))];

/** Next 라우트 파일이 내보내는 정해진 이름 */
const NEXT_EXPORTS = new Set(["metadata", "viewport", "generateMetadata", "generateStaticParams", "dynamic", "dynamicParams", "revalidate", "alt", "size", "contentType", "runtime"]);
/** .tsx 에서 하지 않을 계산 — 같은 하위 폴더의 *.ts 로 */
const LOGIC = [
  [/\.(filter|sort|reduce|replace|replaceAll|slice|substring|padStart|padEnd|split|toFixed|toLocaleString|toLocaleDateString|findIndex|flatMap)\(/, "배열 · 글 계산"],
  [/\bMath\.\w+/, "Math 계산"],
  [/\bnew RegExp\b|\/[^/\n*]+\/[gimsuy]*\.test\(/, "정규식"],
  [/\bDate\.(now|parse)\b|\bnew Date\(/, "날짜 계산"],
  [/\bnew Intl\./, "Intl 서식"],
  [/\b(localStorage|sessionStorage)\b/, "저장소 직접 사용"],
] as const;

describe("코드 역할 분담 — .tsx 는 그리기만", () => {
  it("상태 · 효과 훅을 직접 가져오지 않음 (커스텀 훅 use-*.ts 로)", () => {
    const bad = tsx.flatMap((f) => {
      const src = read(f);
      const named = [...src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"(react|motion\/react|next\/navigation)"/g)].filter((m) => !/^import\s+type/.test(m[0])).flatMap((m) => m[1]!.split(",").map((s) => s.trim().replace(/^type\s+/, "")).filter((s) => /^use[A-Z]/.test(s)).map((s) => `${m[2]}:${s}`));
      const ns = [...src.matchAll(/\bReact\.(use[A-Z]\w*)/g)].map((m) => `React.${m[1]}`);
      return [...named, ...ns].map((h) => `${rel(f)} ${h}`);
    });
    expect(bad).toEqual([]);
  });

  it("계산(거르기 · 정렬 · 자르기 · 바꾸기 · Math · 정규식 · 날짜 · 서식)을 하지 않음", () => {
    const bad = tsx.flatMap((f) => {
      const c = code(f);
      return LOGIC.filter(([re]) => re.test(c)).map(([, what]) => `${rel(f)} ${what}`);
    });
    expect(bad).toEqual([]);
  });

  it("로직 함수 · 값을 내보내지 않음 (컴포넌트 · 상수 · Next 라우트 이름만)", () => {
    const bad = tsx.flatMap((f) => [...read(f).matchAll(/^export\s+(?:async\s+)?(?:function|const|let)\s+([a-z]\w*)/gm)].map((m) => m[1]!).filter((n) => !NEXT_EXPORTS.has(n)).map((n) => `${rel(f)} ${n}`));
    expect(bad).toEqual([]);
  });

  it("라우트(app/) 화면은 파일을 직접 읽지 않음 — 빌드 때 읽기는 *.server.ts", () => {
    const bad = tsx.filter((f) => rel(f).startsWith("app/") && /from\s*"node:/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });
});

describe("코드 역할 분담 — 폴더", () => {
  it("종류별 폴더(components · hooks · lib)가 없음 — 하위 도메인 폴더에 화면 · 훅 · 로직을 함께", () => {
    const bad = dirs.filter((d) => /^(components|hooks|lib)$/.test(d.split("/").at(-1) ?? "")).map(rel);
    expect(bad).toEqual([]);
  });

  it("한 폴더에 훅(use-*.ts)을 4개보다 많이 두지 않음 — 관련 로직끼리 폴더로 나눔", () => {
    const bad = dirs.map((d) => ({ d, n: all.filter((f) => dirname(f) === d && /\/use-[^/]+\.ts$/.test(f)).length })).filter((x) => x.n > 4).map((x) => `${rel(x.d)} ${x.n}개`);
    expect(bad).toEqual([]);
  });
});

describe("코드 역할 분담 — 로직 · 경계", () => {
  const logic = sources.filter((f) => f.endsWith(".ts") && !/\/use-[^/]+\.ts$/.test(f));

  it("순수 로직(use-* 가 아닌 .ts)은 React 를 가져오지 않음", () => {
    const bad = logic.filter((f) => /from\s*"(react|motion\/react)"/.test(read(f).replace(/import type[^\n]*\n/g, ""))).map(rel);
    expect(bad).toEqual([]);
  });

  it("파일 읽기(node:fs)는 *.server.ts 에만 · *.server.ts 는 라우트나 다른 *.server.ts 만 가져옴", () => {
    const fsUsers = sources.filter((f) => /from\s*"node:fs"/.test(read(f)) && !f.endsWith(".server.ts")).map(rel);
    expect(fsUsers).toEqual([]);
    const importers = sources.filter((f) => /\.server"/.test(read(f)) && !rel(f).startsWith("app/") && !f.endsWith(".server.ts")).map(rel);
    expect(importers).toEqual([]);
  });

  it("기능 폴더끼리 직접 가져오지 않음 — 함께 쓰면 src/shared 로", () => {
    const bad = sources.flatMap((f) => {
      const r = rel(f);
      if (!r.startsWith("features/")) return [];
      const mine = r.split("/")[1];
      return [...read(f).matchAll(/from\s*"([^"]+)"/g)]
        .map((m) => m[1]!)
        .map((s) => (s.startsWith("@/features/") ? s.slice(11).split("/")[0] : s.startsWith(".") ? relative(join(SRC, "features"), resolve(dirname(f), s)).split("/")[0] : null))
        .filter((t): t is string => !!t && t !== mine && !t.startsWith(".."))
        .map((t) => `${r} → features/${t}`);
    });
    expect(bad).toEqual([]);
  });

  it("앱 공통(src/shared)은 기능 폴더를 가져오지 않음", () => {
    const bad = sources.filter((f) => rel(f).startsWith("shared/") && /from\s*"(@\/features\/|(\.\.\/)+features\/)/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });
});

// 작업 0194 — 인트로 로딩 화면(시안 A) 구성 검사 (소스 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   빈 화면의 "공항으로 가는 중…" 글자 대신 출발 안내판(홈 안내판과 같은 글자 넘김 · 정해진 글자 · 난수 없음) · 진행률 % 없음 · 건너뛰기는 로딩 위에서도 보임
//   로딩 부품은 열린 뒤 내려감(done 이면 그리지 않음 · 작업 0186 교훈) · 움직임 줄이기면 넘김 · 열림 없이 페이드만
//
// builder 가 만들 것
//   packages/ui/src/hooks/use-flap-rows.ts · packages/ui/src/components/data/flap-rows.tsx   (@hav/ui/data/flap-rows · 줄 글이 바뀌면 바뀐 칸만 넘어감 — flap.ts 의 cellsAt · flipPlan · toCells)
//   apps/web/src/features/intro/hooks/use-intro-loading.ts · components/intro-loading.tsx · lib/loading.ts
//   intro.tsx 가 <IntroLoading> 을 그림 (data-testid="intro-loading" · 안내판 data-testid="intro-loading-board" · 줄 글은 data-text)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WEB = join(__dirname, "..");
const ROOT = join(WEB, "../../..");
const INTRO = join(WEB, "features/intro");
const read = (p: string) => readFileSync(p, "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("파일 구성", () => {
  for (const f of ["packages/ui/src/hooks/use-flap-rows.ts", "packages/ui/src/components/data/flap-rows.tsx", "apps/web/src/features/intro/hooks/use-intro-loading.ts", "apps/web/src/features/intro/components/intro-loading.tsx", "apps/web/src/features/intro/lib/loading.ts"]) {
    it(`${f} 가 있음`, () => expect(existsSync(join(ROOT, f)), f).toBe(true));
  }
});

describe("인트로 화면 — 로딩 부품", () => {
  const intro = () => code(read(join(INTRO, "components/intro.tsx")));
  it("옛 글자(공항으로 가는 중…)가 없고 IntroLoading 을 그림", () => {
    expect(intro()).not.toMatch(/공항으로 가는 중/);
    expect(intro()).toMatch(/<IntroLoading\b/);
  });
  it("건너뛰기는 로딩 위에서도 보임 — 위 띠가 로딩보다 위(z)에 있거나 로딩이 위 띠 아래", () => {
    const loading = code(read(join(INTRO, "components/intro-loading.tsx")));
    expect(loading).toMatch(/data-testid="intro-loading"/);
    expect(loading).toMatch(/data-testid="intro-loading-board"|intro-loading-board/);
  });
  it("열린 뒤(done)에는 로딩 부품을 그리지 않음 — 안 내려가면 홈을 가림", () => {
    expect(code(read(join(INTRO, "components/intro-loading.tsx")))).toMatch(/stage === "done"[\s\S]{0,40}return null|return null[\s\S]{0,60}done/);
  });
});

describe("로딩 부품 — 진행률 없음 · 난수 없음 · 움직임 줄이기", () => {
  const files = () => ["components/intro-loading.tsx", "hooks/use-intro-loading.ts", "lib/loading.ts"].map((f) => code(read(join(INTRO, f))));
  it("진행률(%)을 그리지 않음 — 화면 글자에 숫자 + % 가 없고 진행 막대(progress)가 없음 (CSS 의 translateY(-101%) 같은 값은 해당 없음)", () => {
    for (const s of files()) {
      expect(s).not.toMatch(/>\s*\d+\s*%|\d+\s*%\s*<|\d+\s*%["`]|퍼센트|<progress|role="progressbar"|aria-valuenow/);
    }
  });
  it("난수 없음 (Math.random 을 쓰지 않음)", () => {
    for (const s of [...files(), code(read(join(ROOT, "packages/ui/src/hooks/use-flap-rows.ts")))]) expect(s).not.toMatch(/Math\.random/);
  });
  it("글자 넘김은 flap.ts 의 순수 함수를 씀 (cellsAt · flipPlan · toCells)", () => {
    const hook = code(read(join(ROOT, "packages/ui/src/hooks/use-flap-rows.ts")));
    for (const fn of ["cellsAt", "flipPlan", "toCells"]) expect(hook, fn).toMatch(new RegExp(`\\b${fn}\\b`));
  });
  it("움직임 줄이기(still)면 넘김 · 열림 없이 페이드 — 훅이 still 을 받음", () => {
    expect(code(read(join(INTRO, "hooks/use-intro-loading.ts")))).toMatch(/\bstill\b/);
    expect(code(read(join(ROOT, "packages/ui/src/hooks/use-flap-rows.ts")))).toMatch(/\bskip\b|\bstill\b/);
  });
});

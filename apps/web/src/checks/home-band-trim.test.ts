// 작업 0174 — 홈 "오늘 환율" 바다 띠 문구 정리 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "· 예측이 아닙니다 · 수출입은행 환율을 평일 12시에 받습니다 / 주말에는 고시가 없어 11월 13일 값입니다 — 이 글자 지우자 홈에 필요 없는 내용인 것 같아"
//
// builder 가 할 것 (plan.md)
//   홈 바다 띠(features/home/components/today-band.tsx · lib/destinations.ts 의 cheapestCopy evidence): 판정 한 줄("최근 90일 중 …")만 남기고 "예측이 아닙니다" · "평일 12시" 문구를 뺌 (destinations.test.ts 가 값 검사)
//   홈 바다 띠에서 FreshnessNote(주말 · 기준일 이유 줄)를 뺌 — 통화 상세 등 다른 화면의 기준일 · 출처 · 예측 아님 안내는 그대로
//   홈에 남는 것: 도착지별 환전 타이밍 설명 줄의 "예측이 아니며 투자 · 금융 조언이 아닙니다"(SIG-01 · SIG-04) · 바닥 띠의 "자료: 한국수출입은행 …" 출처
//   docs/domain/fx.md FX-08: "기준일이 오늘이 아니면 이유 한 줄"을 환율을 자세히 보여 주는 화면(통화 상세 등)에서 안내 · 홈은 생략 · 출처는 홈 바닥 띠 — 로 고침
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const ROOT = resolve(WEB_SRC, "../../..");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => codeOf(readFileSync(p, "utf8"));
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
const HOME = sources(join(WEB_SRC, "features/home"));
const homeText = HOME.map(read).join("\n");

describe("홈 바다 띠 — 지울 문구 (작업 0174)", () => {
  it("'예측이 아닙니다' · '평일 12시' 가 근거 문장 코드에 없음", () => {
    const evidence = read(join(WEB_SRC, "features/home/common/destinations.ts"));
    expect(evidence).not.toMatch(/예측이 아닙니다/);
    expect(evidence).not.toMatch(/평일 12시/);
  });

  it("홈에 FreshnessNote(기준일 이유 줄 — '주말에는 고시가 없어 …')가 없음", () => {
    expect(homeText).not.toMatch(/주말에는 고시가 없어/);
  });
});

describe("홈 바다 띠 — 남기는 것", () => {
  it("도착지별 환전 타이밍 설명 줄에 '예측이 아니며 투자 · 금융 조언이 아닙니다' 가 남음 (SIG-01 · SIG-04)", () => {
    expect(read(join(WEB_SRC, "features/home/destinations/destinations-section.tsx"))).toContain("예측이 아니며 투자 · 금융 조언이 아닙니다");
  });

  it("출처는 홈 바닥 띠에 — '자료: {RATE_SOURCE_LABEL}'(한국수출입은행 · Frankfurter · 작업 0299 공용 상수)이 홈 코드에 있음", () => {
    expect(homeText).toMatch(/자료:[^<\n]*(\{RATE_SOURCE_LABEL\}|한국수출입은행)/);
  });
});

describe("다른 화면은 그대로 — 통화 상세의 기준일 · 출처 · 예측 아님 안내 (유지 검사)", () => {
  it("통화 상세가 FreshnessNote 를 쓰고 · 기준일 · 출처는 '실제로 바꿀 때' 카드 아래 줄에 늘 남음(작업 0298: 판정 설명 두 줄은 지움)", () => {
    const detail = read(join(WEB_SRC, "features/currencies/detail/currency-detail.tsx"));
    expect(detail).toMatch(/\bFreshnessNote\b/);
    expect(detail, "판정 설명 두 줄(verdictLines)은 화면에서 안 씀").not.toMatch(/\bverdictLines\(/);
    const conv = read(join(WEB_SRC, "features/currencies/converter/converter.tsx"));
    expect(conv, "카드 아래 줄: 매매기준율 · 날짜 · 출처").toMatch(/매매기준율 · \{rate\.date\} · \{SOURCE_NAME\[rate\.source\]\}/);
    expect(conv, "금액이 틀려도 그 줄은 늘 남김(오류 글은 따로 한 줄 · role=alert)").toMatch(/role="alert"/);
  });

  it("통화 화면의 '예측하지 않으며 · 예측이 아닙니다' 안내가 남음 (꼬리말 · 요약 글)", () => {
    expect(read(join(WEB_SRC, "features/currencies/browse/browse-layout.tsx"))).toContain("앞으로를 예측하지 않으며");
    // 요약 글(summary.ts)은 어디서도 그리지 않아 작업 0312 에 지움 — 화면에 보이는 안내는 위 꼬리말
  });

  it("FreshnessNote 부품 · freshness 규칙 함수는 그대로 있음 (통화 상세가 씀)", () => {
    expect(readFileSync(resolve(WEB_SRC, "../../../apps/web/src/shared/rate/freshness-note.tsx"), "utf8")).toContain("FreshnessNote");
    expect(readFileSync(resolve(WEB_SRC, "../../../packages/shared/src/domain/freshness.ts"), "utf8")).toContain("export function freshness");
  });
});

describe("문서 — docs/domain/fx.md FX-08 (홈은 생략)", () => {
  const fx = readFileSync(join(ROOT, "docs/domain/fx.md"), "utf8");
  const row = fx.split("\n").find((l) => /^\|\s*FX-08\b/.test(l)) ?? "";

  it("FX-08 규칙이 있음", () => {
    expect(row, "FX-08 줄").not.toBe("");
  });

  it("FX-08 이 '환율을 자세히 보여 주는 화면(통화 상세 등)에서 안내 · 홈은 생략 · 출처는 홈 바닥 띠' 를 말함", () => {
    expect(row).toMatch(/통화 상세/);
    expect(row).toMatch(/홈은 생략|홈에서는 생략|홈 생략/);
    expect(row).toMatch(/바닥 띠/);
  });

  it("예전 문구(모든 화면에 이유 한 줄)는 남지 않음 — 이유(고시 전 · 늦음 · 주말)는 유지", () => {
    expect(row).not.toMatch(/\|\s*FX-08\s*\|\s*화면의 기준일이/);
    for (const w of ["고시 전", "늦음", "주말"]) expect(row, w).toContain(w);
  });
});

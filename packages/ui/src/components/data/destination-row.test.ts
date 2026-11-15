// 작업 0170 추가 요청 — 도착지 줄 배치 · 핀 근거 숫자 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "시안이랑 다르다": Figma 컴포넌트 "도착지 줄"(1200×90) · 홈 01 · 01-M — 실제 높이 · 한 줄 배치는 e2e/home.spec.ts(실행은 lead)
//
// builder 가 할 것
//   signal-pin.tsx: pinBasis(signal, percentile) 추가(signal-pin.test.ts) · SignalPin 이 percentile prop 을 받아 pinBasis 글을 보임
//   destination-row.tsx
//     - 데스크톱(sm 이상)은 한 줄 세 칸: ① 도시(큰 글자) + 통화(작은 글) ② 오늘 환율(오른쪽 정렬 · 굵은 숫자) ③ 쌈~비쌈 눈금 + 판정 핀 — 도시 아래에 눈금이 따로 한 줄 더 있던 옛 배치(mt-4 hidden sm:block) 없음
//     - 끝 라벨(쌈 · 중간 · 비쌈)은 작게(text-xs 또는 text-[10~12px]) 눈금 바로 아래
//     - 모바일(sm 아래)은 눈금 숨김 + 핀을 오른쪽 · 왼쪽에 도시 + "통화 · 환율" 한 칸
//     - props: pct 대신 percentile (0~1 · 없으면 핀 글자만) — position(눈금 위치)은 그대로
//     - e2e 가 찾는 표시: data-testid="dest-row"(줄 전체) · "dest-city" · "dest-rate" · "dest-scale"(눈금 칸 · 모바일에선 숨김) · "dest-pin"(보이는 핀) · "dest-mobile-meta"(모바일 전용 "통화 · 환율")
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const pin = code(read("signal-pin.tsx"));
const row = code(read("destination-row.tsx"));

describe("SignalPin — 근거 숫자(percentile)", () => {
  it("pinBasis 를 export 하고 SignalPin 이 percentile prop 으로 그 글을 보임 · text 가 있으면 text 가 먼저", () => {
    expect(pin).toMatch(/export function pinBasis\(/);
    expect(pin).toMatch(/percentile\??:\s*number\s*\|\s*null/);
    expect(pin).toMatch(/pinBasis\(\s*signal\s*,\s*percentile\s*\)/);
    expect(pin).toMatch(/text\s*\?\?/);
  });

  it("기존 pinLabel · signalLabel · PIN_STYLE · PIN_SIZE 는 그대로 export (작년 대비 카드 등이 씀)", () => {
    for (const name of ["pinLabel", "signalLabel", "PIN_STYLE", "PIN_SIZE"]) expect(pin, name).toMatch(new RegExp(`export (function|const) ${name}\\b`));
  });
});

describe("도착지 줄 배치", () => {
  it("e2e 가 찾는 표시 여섯 개", () => {
    for (const id of ["dest-row", "dest-city", "dest-rate", "dest-scale", "dest-pin", "dest-mobile-meta"]) expect(row, id).toMatch(new RegExp(`data-testid="${id}"`));
  });

  it("옛 배치 없음 — 도시 아래에 눈금이 따로 한 줄 더 쌓이던 블록(mt-4 hidden sm:block)", () => {
    expect(row).not.toMatch(/mt-4 hidden sm:block|hidden sm:block mt-4/);
  });

  it("데스크톱은 한 줄 — 줄 컨테이너가 sm 이상에서 가로 배치(sm:flex)이고 세 칸이 모두 그 안에 (눈금 칸 sm:flex · sm:block)", () => {
    expect(row).toMatch(/sm:flex\b/);
    const scale = /<[^>]*data-testid="dest-scale"[^>]*>/.exec(row)?.[0] ?? "";
    expect(scale, "눈금 칸").toMatch(/\bhidden\b/); // 모바일에서 숨김
    expect(scale, "눈금 칸").toMatch(/sm:(flex|block)/); // 데스크톱에서 보임
  });

  it("끝 라벨(쌈 · 중간 · 비쌈)은 작게 · 눈금 바로 아래 (눈금 칸 안에서 눈금 뒤)", () => {
    const i = row.indexOf('data-testid="dest-scale"');
    const rest = row.slice(i);
    const labels = rest.search(/>\s*쌈\s*</);
    expect(labels, "끝 라벨").toBeGreaterThan(0);
    expect(row).toMatch(/text-xs|text-\[1[0-2]px\]/);
    expect(rest.indexOf("bg-line"), "눈금 선").toBeLessThan(labels);
  });

  it("모바일 — 핀은 오른쪽(sm:hidden 인 SignalPin 이 따로) · 왼쪽 칸에 '통화 · 환율'(dest-mobile-meta · sm:hidden)", () => {
    expect(row).toMatch(/<SignalPin[^>]*sm:hidden/);
    const meta = /<[^>]*data-testid="dest-mobile-meta"[^>]*>/.exec(row)?.[0] ?? "";
    expect(meta, "dest-mobile-meta").toMatch(/sm:hidden/);
  });

  it("핀 근거 숫자 — props 가 percentile (pct 는 없어짐) · SignalPin 에 percentile 로 넘김", () => {
    expect(row).toMatch(/percentile\??:\s*number\s*\|\s*null/);
    expect(row).not.toMatch(/\bpct\b/);
    expect(row).toMatch(/<SignalPin[^>]*percentile=\{/);
  });

  it("scalePosition(눈금 위치 계산) 은 그대로 export", () => {
    expect(row).toMatch(/export function scalePosition\(/);
  });
});

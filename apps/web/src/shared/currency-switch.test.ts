// 작업 0231 — 통화 바꾸기 전환 · 고른 칩 소스 검사 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const F = "../features/currencies";
const chips = () => code(read(`${F}/components/currency-chips.tsx`));

describe("고른 통화 칩", () => {
  it("저장은 즐겨찾기와 같은 방식(useSyncExternalStore + localStorage + storage 이벤트) · 새 키", () => {
    const h = code(read(`${F}/hooks/use-recent-currencies.ts`));
    expect(h).toMatch(/useSyncExternalStore/);
    expect(h).toMatch(/localStorage/);
    expect(h).toMatch(/"storage"/);
    expect(h).toMatch(/RECENT_KEY|recent-currencies/);
  });
  it("칩 부품이 계산 함수를 쓰고 · 더보기 상자 · 쪽 넘김 · 밀림 testid 를 가짐", () => {
    // 계산 함수는 칩 부품이나 그 훅(hooks/use-chip-row.ts) 어디서 불러도 됨 — 칩 줄 부품 묶음 전체에서 확인
    const s = chips() + code(read(`${F}/components/chip-more-box.tsx`)) + code(read(`${F}/hooks/use-chip-row.ts`));
    for (const f of ["chipRow", "visibleChips", "moreLabel", "boxPage", "pushRecent"]) expect(s, f).toMatch(new RegExp(`\\b${f}\\b`));
    for (const id of ["currency-chips", "chip", "chip-more", "chip-box", "chip-box-item", "chip-box-prev", "chip-box-next", "chip-box-page"]) expect(s, id).toContain(id);
    for (const a of ["data-code", "data-leaving", "aria-expanded"]) expect(s, a).toContain(a);
  });
  it("더보기 상자는 문서 흐름 밖에 떠 있음(absolute) · 옆 검색칸 · 아래 내용을 밀지 않음", () => {
    expect(code(read(`${F}/components/chip-more-box.tsx`))).toMatch(/absolute/);
  });
  it("움직임 줄이기를 확인함 · 타이머로 값을 바꾸지 않음", () => {
    const s = chips() + code(read(`${F}/components/chip-more-box.tsx`));
    expect(s).toMatch(/useReducedMotion|prefers-reduced-motion/);
    expect(s).not.toMatch(/setInterval/);
  });
  it("처음 칩 줄은 지금 운영 그대로 — chipCodes(redesign.ts)는 그대로 있음", () => {
    expect(code(read(`${F}/lib/redesign.ts`))).toMatch(/export function chipCodes\(/);
  });
});

describe("통화 바꾸기 전환", () => {
  it("전환 계산은 lib 에서 · 환율 자리까지 올라가는 스크롤 · 국기 날아감(flag-fly) · 비행기 기수", () => {
    const files = ["components/currency-detail.tsx", "components/range-card.tsx", "components/currency-chips.tsx", "components/currency-list.tsx"].map((f) => code(read(`${F}/${f}`))).join("\n") + code(read(`${F}/lib/switch-motion.ts`));
    for (const f of ["scrollTarget", "needsScroll", "arcPoint", "planeHeading"]) expect(files, f).toMatch(new RegExp(`\\b${f}\\b`));
    for (const id of ["flag-fly", "currency-kicker"]) expect(files, id).toContain(id);
    expect(files).toContain("data-heading");
  });
  it("전환 기억(switch-memory)을 읽고 쓰는 곳이 있음", () => {
    const s = ["components/currency-detail.tsx", "components/range-card.tsx", "components/converter.tsx", "hooks/use-converter.ts"].map((f) => code(read(`${F}/${f}`))).join("\n");
    expect(s).toMatch(/takeSwitchFrom|rememberSwitch/);
  });
  it("글자판은 0227 굴러가는 숫자 부품(RollingNumber)을 씀", () => {
    expect(code(read(`${F}/components/result-board.tsx`))).toMatch(/@hav\/ui\/motion\/rolling-number/);
  });
  it("실행 중 API · 새 요청 없음 — 클라이언트 이동(next/link · router)만, fetch · /bff 호출 없음", () => {
    const s = ["components/currency-chips.tsx", "components/currency-list.tsx", "components/chip-more-box.tsx"].map((f) => code(read(`${F}/${f}`))).join("\n");
    expect(s).not.toMatch(/\bfetch\(/);
    expect(s).not.toMatch(/\/bff\//);
  });
  it("지금 화면 요소 그대로 — 칩 · 목록 · 큰 환율 · 비행 경로 카드 · 변환기 · 1년 흐름 · 물가 링크", () => {
    const d = code(read(`${F}/components/currency-detail.tsx`));
    for (const t of ["big-rate", "RangeCard", "Converter", "PeriodChart", "이 통화 쓰는 나라 물가 보기"]) expect(d, t).toContain(t);
  });
});

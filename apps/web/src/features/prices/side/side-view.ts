// 여행 물가 목록 → 나라 사이드바 · 시트의 계산 (작업 0361 2단계) — 순수 함수 · tsx 는 그리기만
//   1024px 이상 = 사이드바(오른쪽 420px · 막 없음 · 스크롤 안 잠금 · 본문을 밀어냄) · 미만 = 아래 78% 시트(막 · 잠금)
//   내용은 0344 나라 페이지 계산(countryView) 값 그대로 — 받지 못한 값은 지어내지 않음(한 줄 답 자리에 이유)
import { TRAVEL_COUNTRIES, countryPath } from "@hav/shared/travel";
import { budgetWon, wonDigits } from "../common/price-text";
import type { CountryView } from "../country/country-model";
import { nextCards } from "../country/next-card-view";

/** 이 폭 이상이 사이드바 */
export const SIDE_BREAKPOINT = 1024;
/** 여행 물가 사이드바 폭(px) — 공통 부품(통화 상세는 440)에 선택 값으로 넘김 */
export const SIDE_WIDTH = 420;
/** 좁은 화면 시트 높이(화면 높이의 %) — 공통 부품(통화 상세는 85)에 선택 값으로 넘김 */
export const SHEET_HEIGHT_PCT = 78;

export function panelModeOf(innerWidth: number): { kind: "side" | "sheet"; backdrop: boolean; lock: boolean } {
  return innerWidth >= SIDE_BREAKPOINT ? { kind: "side", backdrop: false, lock: false } : { kind: "sheet", backdrop: true, lock: true };
}

/** 지금 목록 순서(나라 코드)에서 앞 · 뒤 나라 — 없으면 index -1 · 처음 · 끝은 null(단추를 막음) */
export function neighbors(order: string[], code: string): { index: number; prev: string | null; next: string | null } {
  const index = order.indexOf(code);
  if (index < 0) return { index: -1, prev: null, next: null };
  return { index, prev: order[index - 1] ?? null, next: order[index + 1] ?? null };
}

/** "3 / 39" — 순서에 없으면 "" */
export function posText(order: string[], code: string): string {
  const { index } = neighbors(order, code);
  return index < 0 ? "" : `${index + 1} / ${order.length}`;
}

/** 내용이 옆으로 바뀌는 방향 — 순서가 더 뒤로 = 1 · 앞으로 = -1 · 같거나 모르면 1 */
export function swapDir(order: string[], from: string, to: string): 1 | -1 {
  const [a, b] = [order.indexOf(from), order.indexOf(to)];
  return a >= 0 && b >= 0 && b < a ? -1 : 1;
}

const NONE_LABEL = "오늘 기준 한 줄 답";

/** 오늘 통화 한 줄 답 — 받는 통화는 나라 페이지의 그 글 그대로 · 없으면 이유(통화 이름이 있으면 괄호로) */
export function rateLine(p: { oneLine: { label: string; text: string } | null; currency: string | null }): { label: string; text: string; none: boolean } {
  if (p.oneLine) return { ...p.oneLine, none: false };
  return { label: NONE_LABEL, text: `이 나라 통화${p.currency ? `(${p.currency})` : ""}는 아직 환율을 받지 않아 물가만 보여 드립니다`, none: true };
}

/** "여행 물가 › 일본" */
export const crumbText = (name: string): string => `여행 물가 › ${name}`;

/** "일본 물가 자세히 보기" — 끝 › 는 부품이 꾸밈으로 붙임 */
export const detailLinkText = (name: string): string => `${name} 물가 자세히 보기`;

/** 사이드바 한 나라의 내용 — 직렬화 가능한 글 · 값만 (서버가 만들어 넘김) */
export type SideEntry = {
  code: string;
  name: string;
  crumb: string;
  title: string;
  answer: { label: string; text: string; none: boolean };
  /** 물가 값(한국 = 100) — 목록의 "물가 N" 과 같음 */
  value: number;
  /** "약 134,000원" 하루 예산 예시 */
  budget: string;
  cards: { track: string; kicker: string; title: string; say: string; href: string; link: string }[];
  detailHref: string;
  detailText: string;
};

/** 나라 페이지 값 → 사이드바 내용 · 환전 카드는 오늘 환율을 받는 통화가 있을 때만 · 예산 카드는 그 나라 페이지의 예산 칸으로 */
export function sideEntry(v: CountryView): SideEntry {
  return {
    code: v.code,
    name: v.name,
    crumb: crumbText(v.name),
    title: v.title,
    answer: rateLine({ oneLine: v.oneLine ? { label: v.oneLine.label, text: v.oneLine.text } : null, currency: v.currency }),
    value: v.index,
    budget: `약 ${wonDigits(budgetWon(v.index))}원`,
    cards: nextCards(v, { fxOnlyIfRate: true }).map((c) => ({ track: c.track, kicker: c.kicker, title: c.title, say: c.say, href: c.href.startsWith("#") ? `${countryPath(v.code)}${c.href}` : c.href, link: c.link })),
    detailHref: countryPath(v.code),
    detailText: detailLinkText(v.name),
  };
}

/** 나라 이름 표(TRAVEL_COUNTRIES)에 있는 나라만 사이드바를 엶 — 없으면 링크 그대로 나라 페이지로 */
export const hasSide = (entries: Record<string, SideEntry>, code: string): boolean => code in entries && code in TRAVEL_COUNTRIES;

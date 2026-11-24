// 나라별 여행 물가 페이지 /prices/[code] 의 계산 (작업 0344) — 순수 함수 · tsx 는 그리기만
// 받은 값으로만 문장을 만들고, 값이 없으면 상자 · 문항을 통째로 뺌 (가격을 지어내지 않음 · AGENTS 규칙 7)
import type { AirfareCalendar } from "@hav/shared/airfare";
import { numberText } from "@hav/shared/format";
import type { PriceLevels } from "@hav/shared/prices";
import { BAND_EDGE, TRAVEL_CITIES, TRAVEL_COUNTRIES } from "@hav/shared/travel";

/** 주소 — alpha-3 대문자 (통화 상세 /currencies/USD 와 같은 모양) */
export const countryPath = (code: string) => `/prices/${code}`;

const DEFAULT_COUNTRY = "JPN";

/** 정적 페이지를 만들 나라 — 빌드 때 받은 물가에 값이 있는 TRAVEL_COUNTRIES 키(기준 나라 제외) · 못 받았거나 비면 일본 하나 */
export function countryTargets(levels: PriceLevels | null): string[] {
  const has = new Set((levels?.rows ?? []).map((r) => r.country));
  const codes = Object.keys(TRAVEL_COUNTRIES).filter((c) => c !== levels?.base && has.has(c));
  return codes.length > 0 ? codes : [DEFAULT_COUNTRY];
}

const hasBatchim = (s: string) => {
  const c = s.charCodeAt(s.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};
/** 은 · 는 */
export const eunNeun = (s: string) => (hasBatchim(s) ? "은" : "는");
export const gwaWa = (s: string) => (hasBatchim(s) ? "과" : "와");

const money = (v: number) => numberText(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 오늘 기준 한 줄 답 (시안 1-new) — 통화가 없는 나라 · 오늘 값이 없으면 null (상자 없음) · 1년 평균을 못 받았으면 평균 비교만 뺌 */
export function oneLineAnswer(p: { currency: string | null; unitLabel: string; baseRate: number | null; avg1y: number | null; date: string | null }): { label: string; text: string } | null {
  if (!p.currency || p.baseRate === null || p.date === null) return null;
  const label = `오늘 기준 한 줄 답 · ${p.date}`;
  const head = `오늘 ${p.unitLabel}${eunNeun(p.unitLabel)} ${money(p.baseRate)}원`;
  if (p.avg1y === null || !(p.avg1y > 0)) return { label, text: `${head}입니다` };
  const pct = Math.round((p.baseRate / p.avg1y - 1) * 100);
  const avg = `1년 평균(${money(p.avg1y)}원)`;
  if (pct === 0) return { label, text: `${head}으로, ${avg}과 거의 같습니다` };
  return { label, text: `${head}으로, ${avg}보다 ${Math.abs(pct)}% ${pct > 0 ? "비쌉니다" : "쌉니다"}` };
}

export type CompareItem = { country: string; name: string; index: number; diffText: string };

/** 견줘 볼 나라 — 같은 지역에서 물가 차이가 작은 순 · 모자라면 다른 지역에서 차이가 작은 순으로 채움 · % 는 그 나라 물가 기준으로 다시 계산 */
export function compareCountries(base: string, rows: { country: string; relative: number }[], limit = 4): CompareItem[] {
  const me = rows.find((r) => r.country === base);
  const meta = TRAVEL_COUNTRIES[base];
  if (!me || !meta) return [];
  const diff = (r: { relative: number }) => Math.abs(r.relative - me.relative);
  const others = rows.filter((r) => r.country !== base && TRAVEL_COUNTRIES[r.country]).sort((a, b) => diff(a) - diff(b));
  const same = others.filter((r) => TRAVEL_COUNTRIES[r.country].region === meta.region);
  const rest = others.filter((r) => TRAVEL_COUNTRIES[r.country].region !== meta.region);
  return [...same, ...rest].slice(0, limit).map((r) => {
    const pct = Math.round((r.relative / me.relative - 1) * 100);
    const diffText = pct === 0 ? `${meta.name}${gwaWa(meta.name)} 거의 같음` : `${meta.name}보다 ${Math.abs(pct)}% ${pct > 0 ? "비쌈" : "쌈"}`;
    return { country: r.country, name: TRAVEL_COUNTRIES[r.country].name, index: Math.round(r.relative * 100), diffText };
  });
}

export type FlightCard =
  | { kind: "fare"; city: string; big: string; say: string; depart: string; fetchedOn: string }
  | { kind: "timing"; month: number; big: string; say: string }
  | { kind: "none"; say: string };

const md = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;

/** 항공권 카드 — 출발일 달력 도시가 있는 나라는 1주 왕복 최저가 · 없으면 국제항공료 지수의 떠나기 싼 달(가격을 지어내지 않음) · 둘 다 없으면 자료 없음 */
export function flightCard(p: { code: string; calendar: AirfareCalendar | null; timing: { cheapest: number; complete: boolean } | null }): FlightCard {
  for (const name of TRAVEL_CITIES[p.code] ?? []) {
    const c = p.calendar?.cities.find((x) => x.city === name && x.days.length > 0);
    if (!c) continue;
    const best = c.days.reduce((a, b) => (b.price < a.price ? b : a));
    return { kind: "fare", city: c.city, big: `${numberText(best.price)}원부터`, say: `${md(best.depart)} 출발 1주 왕복 · ${md(c.fetchedOn)} 받은 가격`, depart: best.depart, fetchedOn: c.fetchedOn };
  }
  if (!p.timing) return { kind: "none", say: "자료 없음" };
  const span = p.timing.complete ? "1년 중" : "받은 달 중";
  return { kind: "timing", month: p.timing.cheapest, big: `${p.timing.cheapest}월`, say: `통계청 국제항공료 지수로 보면 ${span} 가장 낮은 달` };
}

export type FaqItem = { q: string; a: string; open: boolean };

const won = (v: number) => `${numberText(v)}원`;

/** 자주 묻는 질문 — 답은 페이지에 있는 값으로만 · 값이 없는 문항은 통째로 뺌 · 처음 두 개 펼침 */
export function countryFaq(p: { name: string; relative: number; year: number; budget: { dailyWon: number; days: number; totalWon: number } | null; exchange: { text: string } | null; flight: FlightCard }): FaqItem[] {
  const pct = Math.round(Math.abs(p.relative - 1) * 100);
  const level = p.relative > BAND_EDGE.pricey ? `한국보다 ${pct}% 높습니다` : p.relative < BAND_EDGE.cheap ? `한국보다 ${pct}% 낮습니다` : "한국과 비슷한 수준입니다";
  const items: { q: string; a: string }[] = [{ q: `${p.name} 물가는 한국보다 비싼가요?`, a: `세계은행 ${p.year}년 자료로 ${p.name}의 물가는 ${level}.` }];
  if (p.budget) items.push({ q: `${p.name} 여행 하루 예산은 얼마인가요?`, a: `한국에서 쓰던 만큼 ${p.name}에서 쓰려면 물가 차이를 반영해 하루 약 ${won(p.budget.dailyWon)}, ${p.budget.days}일이면 약 ${won(p.budget.totalWon)}입니다.` });
  if (p.exchange) items.push({ q: "환전은 지금 해도 되나요?", a: p.exchange.text });
  if (p.flight.kind === "fare") items.push({ q: "언제 떠나면 항공권이 싼가요?", a: `${p.flight.city} 1주 왕복 최저가는 ${p.flight.big}입니다 (${p.flight.say}).` });
  else if (p.flight.kind === "timing") items.push({ q: "언제 떠나면 항공권이 싼가요?", a: `${p.flight.say}은 ${p.flight.big}입니다.` });
  return items.map((it, i) => ({ ...it, open: i < 2 }));
}

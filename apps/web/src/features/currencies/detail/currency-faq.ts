// 통화 상세 한 줄 답 · 자주 묻는 질문의 문장 (작업 0345 · 시안 5-new · 6-new) — 순수 함수 · tsx 는 그리기만
// 페이지에 이미 있는 값(오늘 값 · 1년 평균 · 1년 최저 · 90일 신호 · 물가)으로만 · 받지 못한 값은 "자료 없음" (지어내지 않음 · AGENTS 규칙 7)
import { currencyListName, rateMaxDigits } from "@hav/shared/currency";
import { numberText } from "@hav/shared/format";
import { TRAVEL_COUNTRIES, countriesOf, countryPath, priceGapSentence } from "@hav/shared/travel";

type Rate = { baseRate: number; unit: number; date: string };
type Stats = { min: number; avg: number };

/** 단위 이름 — "엔" · "달러" · "유로" (통화 상세 목록 이름의 마지막 낱말 · 표에 없으면 통화 이름) */
export const unitName = (code: string): string => currencyListName(code).split(" ").at(-1) ?? code;

const hasBatchim = (s: string) => {
  const c = s.charCodeAt(s.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};
const eunNeun = (s: string) => (hasBatchim(s) ? "은" : "는");

/** 원 값 글 — 1,000원 이상은 소수 첫째 자리까지 · 미만은 둘째 자리까지 · 끝자리 0 은 생략 (통화 상세 전부가 쓰는 같은 규칙) */
const won = (v: number) => `${numberText(v, { minimumFractionDigits: 0, maximumFractionDigits: rateMaxDigits(v) })}원`;

/** 오늘 값을 1년 평균 · 1년 최저와 견준 말 — 평균은 반올림한 % (0 이면 거의 같음) · 최저는 소수 첫째 자리 차이(0.0 이면 같은 값) */
function compare(rate: Rate, stats: Stats) {
  const pct = Math.round((rate.baseRate / stats.avg - 1) * 100);
  const gap = Math.round(((rate.baseRate - stats.min) / stats.min) * 1000) / 10;
  return {
    avgText: `1년 평균(${won(stats.avg)})`,
    avgGap: pct === 0 ? null : `${Math.abs(pct)}% ${pct < 0 ? "낮" : "높"}`,
    minText: `1년 최저(${won(stats.min)})`,
    minGap: gap === 0 ? null : `${gap.toFixed(1)}%`,
  };
}

const unitText = (code: string, rate: Rate) => `${rate.unit}${unitName(code)}`;

/** 한 줄 답 (시안 5-new) — 오늘 값 · 1년 평균 대비 · 1년 최저와의 차이 · 오늘 값이 없으면 null (상자 없음) · 1년 기록이 없으면 오늘 값만 */
export function answerLine(p: { code: string; rate: Rate | null; stats: Stats | null }): { label: string; text: string } | null {
  if (!p.rate) return null;
  const label = `한 줄 답 · ${p.rate.date} 기준`;
  const head = `${unitText(p.code, p.rate)}${eunNeun(unitText(p.code, p.rate))} ${won(p.rate.baseRate)}`;
  if (!p.stats) return { label, text: `${head}입니다.` };
  const c = compare(p.rate, p.stats);
  const avg = c.avgGap ? `${c.avgText}보다 ${c.avgGap}고` : `${c.avgText}과 거의 같고`;
  const min = c.minGap ? `${c.minText}와 ${c.minGap} 차이입니다.` : `${c.minText}와 같은 값입니다.`;
  return { label, text: `${head}으로, ${avg} ${min}` };
}

const BIG: Record<string, { amount: number; text: string }> = {
  JPY: { amount: 100000, text: "10만 엔" },
  USD: { amount: 1000, text: "1,000달러" },
  EUR: { amount: 1000, text: "1,000유로" },
  CNY: { amount: 10000, text: "1만 위안" },
  CNH: { amount: 10000, text: "1만 위안" },
  THB: { amount: 10000, text: "1만 바트" },
  VND: { amount: 1000000, text: "100만 동" },
};

/** 흔히 바꾸는 큰 금액(표 하나) — 표에 없는 통화는 1,000 단위 (가정) */
export const bigAmount = (code: string): { amount: number; text: string } => BIG[code] ?? { amount: 1000, text: `1,000${unitName(code)}` };

export type FaqCountry = { country: string; name: string; relative: number | null; year: number | null };

/** 그 통화를 쓰는 첫 나라(TRAVEL_COUNTRIES 순서) — 물가 줄이 없으면 relative · year 는 null · 여행지 표에 쓰는 나라가 없으면 null */
export function faqCountry(code: string, rows: { country: string; relative: number; year: number }[] | null): FaqCountry | null {
  const country = countriesOf(code)[0];
  if (!country) return null;
  const row = rows?.find((r) => r.country === country);
  return { country, name: TRAVEL_COUNTRIES[country].name, relative: row?.relative ?? null, year: row?.year ?? null };
}

export type CurrencyFaqItem = { q: string; a: string; open: boolean; href: string | null };

const NONE = "자료 없음";
const SCHEDULE = "평일 한국 시간 12시 이후 한국수출입은행 값을 받습니다. 받지 못하면 12:10 ~ 17:40 에 30분마다 다시 시도하고, 주말 · 공휴일은 직전 영업일 값을 그대로 보여 줍니다.";

/** 자주 묻는 질문 — 지금 싼 편인가 · 큰 금액은 원화로 얼마 · 쓰는 나라 물가 · 환율은 언제 바뀌나 · 처음 두 개 펼침 · 쓰는 나라가 여행지 표에 없으면 물가 질문만 뺌 */
export function currencyFaq(p: { code: string; name: string; rate: Rate | null; stats: Stats | null; signalText: string; country: FaqCountry | null }): CurrencyFaqItem[] {
  const big = bigAmount(p.code);
  const r = p.rate;
  const cheap = (() => {
    if (!r) return NONE;
    const head = `${unitText(p.code, r)} ${won(r.baseRate)}입니다. 신호 기준: ${p.signalText}.`;
    if (!p.stats) return head;
    const c = compare(r, p.stats);
    const avg = c.avgGap ? `${c.avgText}보다 ${c.avgGap}고` : `${c.avgText}과 거의 같고`;
    return `${head} ${avg}, ${c.minText}와는 ${c.minGap ? `${c.minGap} 차이입니다.` : "같은 값입니다."}`;
  })();
  const exchange = r ? `${big.text}${eunNeun(big.text)} ${r.date} 매매기준율 기준 약 ${numberText(Math.round((big.amount * r.baseRate) / r.unit))}원입니다. 송금이나 현찰로 바꾸면 은행 수수료(우대율)에 따라 달라집니다.` : NONE;
  const c = p.country;
  const items: Omit<CurrencyFaqItem, "open">[] = [
    { q: `${p.name} 지금 싼 편인가요?`, a: cheap, href: null },
    { q: `${big.text}${eunNeun(big.text)} 원화로 얼마인가요?`, a: exchange, href: null },
    ...(c ? [{ q: `${c.name} 물가는 한국보다 비싼가요?`, a: c.relative !== null && c.year !== null ? priceGapSentence(c.name, c.relative, c.year) : NONE, href: c.relative !== null && c.year !== null ? countryPath(c.country) : null }] : []),
    { q: "오늘 환율은 언제 바뀌나요?", a: SCHEDULE, href: null },
  ];
  return items.map((it, i) => ({ ...it, open: i < 2 }));
}

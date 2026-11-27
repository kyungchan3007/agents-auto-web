// 값을 못 받은 날의 빈 상태 문장 · 링크 (작업 0346 · 0396) — 세 화면(/calc · 여행 물가 · 통화 상세)이 같은 부품(DataEmpty)에 넘김 · 순수 함수
// 방문자 말로 두 갈래: 수출입은행이 주지 않는 통화("제공 안 함") · 주는데 오늘 값이 아직 없음("늦음") · 수집 일정 같은 개발자 설명은 쓰지 않음
// 수집 일정은 실제대로 (.github/workflows/ensure-fx.yml): 평일 한국 시간 12시 이후 수출입은행 값 · 못 받으면 12:10 ~ 17:40 30분마다 다시 · 받으면 사이트를 새로 만듦

/** 실제 수집 일정 한 문단 */
export const FX_SCHEDULE_TEXT =
  "평일 한국 시간 12시 이후 한국수출입은행 값을 받습니다. 받지 못하면 12:10 ~ 17:40 에 30분마다 다시 받고, 받으면 사이트를 새로 만들어 반영합니다. 주말 · 공휴일은 직전 영업일 값을 그대로 보여 줍니다.";

export type EmptyScreen = "calc" | "prices" | "currency";
export type EmptyLink = { label: string; href: string };

/**
 * 한국수출입은행이 환율을 주는 통화 (작업 0396) — 목록 한 곳
 * 출처: 한국수출입은행 현재환율 API 가 고시하는 통화 22개(docs/domain/fx.md FX-09 의 "22개") · 새 통화가 생기면 이 목록만 고침
 * 여기 없는 통화(동 VND · 대만 달러 TWD 등)는 "제공 안 함" · 있는데 오늘 값이 없으면 "늦음"
 */
const FX_GIVEN = new Set(["AED", "AUD", "BHD", "BND", "CAD", "CHF", "CNH", "DKK", "EUR", "GBP", "HKD", "IDR", "JPY", "KWD", "MYR", "NOK", "NZD", "SAR", "SEK", "SGD", "THB", "USD"]);
/** 수출입은행이 주는 통화인가 — 통화가 없으면(null · 빈 글) false */
export const fxGiven = (currency: string | null): boolean => !!currency && FX_GIVEN.has(currency);

/** 화면별 제목 · 그동안 볼 수 있는 곳 — 제목만 두 갈래(직구 계산은 계산을 멈췄다는 뜻을 유지) */
export function emptyCopy(p: { screen: EmptyScreen; name?: string; /** 수출입은행이 주는 통화인가 — 기본 true(늦음) */ given?: boolean }): { title: string; links: EmptyLink[] } {
  const name = p.name ?? "";
  if (p.screen === "calc")
    return {
      title: "오늘 환율을 아직 받지 못해 계산을 잠시 멈췄습니다",
      links: [
        { label: "이번 주 관세청 과세환율 (아래)", href: "#customs" },
        { label: "통화별 1년 흐름", href: "/currencies" },
        { label: "여행 물가", href: "/prices" },
      ],
    };
  const title = p.given === false ? `${name} 환율은 아직 제공되지 않습니다` : p.screen === "prices" ? "오늘 환율을 아직 받지 못했습니다" : `${name} 오늘 환율을 아직 받지 못했습니다`;
  if (p.screen === "prices")
    return {
      title,
      links: [
        { label: "통화 둘러보기", href: "/currencies" },
        { label: "직구 계산", href: "/calc" },
      ],
    };
  return {
    title,
    links: [
      { label: "통화 둘러보기", href: "/currencies" },
      { label: "여행 물가", href: "/prices" },
      { label: "직구 계산", href: "/calc" },
    ],
  };
}

/** 빈 상태 부품(DataEmpty)에 넘길 값 한 묶음 */
export const emptyProps = emptyCopy;

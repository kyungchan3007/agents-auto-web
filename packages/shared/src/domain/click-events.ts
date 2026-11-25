// 버튼 클릭 이벤트 표 (작업 0359) — 운영 사이트(보내기) · 수집(거르기) · 어드민(표)이 같이 쓰는 한 곳
//   이름은 버튼마다 따로: GA4 맞춤 측정기준 등록 없이 Data API 의 eventName 만으로 셈 · GA4 이벤트 이름 규칙(소문자 · 숫자 · 밑줄 · 40자 이내)
export type ClickEvent = { name: string; label: string; page: string };

export const CLICK_EVENTS = [
  { name: "home_search_pick", label: "홈 검색에서 나라 고르기", page: "/" },
  { name: "home_country_link", label: "홈 카드의 나라 페이지 링크", page: "/" },
  { name: "country_next_fx", label: "다음으로 볼 것: 환전", page: "/prices/[나라]" },
  { name: "country_next_flight", label: "다음으로 볼 것: 항공권", page: "/prices/[나라]" },
  { name: "country_next_budget", label: "다음으로 볼 것: 예산", page: "/prices/[나라]" },
  { name: "country_compare", label: "견줘 볼 나라", page: "/prices/[나라]" },
  { name: "country_all_prices", label: "다른 나라 물가도 보기", page: "/prices/[나라]" },
  { name: "fx_other_open", label: "다른 나라 통화 보기 열기", page: "/currencies/[통화]" },
  { name: "fx_other_pick", label: "사이드바에서 통화 고르기", page: "/currencies/[통화]" },
  { name: "faq_open_prices", label: "자주 묻는 질문 펼치기 (여행 물가)", page: "/prices/[나라]" },
  { name: "faq_open_currency", label: "자주 묻는 질문 펼치기 (통화 상세)", page: "/currencies/[통화]" },
  { name: "empty_next", label: "막다른 화면의 '그동안 볼 수 있는 것' 링크", page: "/currencies/[통화] · /calc" },
] as const satisfies readonly ClickEvent[];

export type ClickEventName = (typeof CLICK_EVENTS)[number]["name"];

export const CLICK_EVENT_NAMES: readonly ClickEventName[] = CLICK_EVENTS.map((e) => e.name);

export const isClickEvent = (name: unknown): name is ClickEventName => typeof name === "string" && (CLICK_EVENT_NAMES as readonly string[]).includes(name);

/** 한국어 이름 · 표 밖은 null */
export const clickLabel = (name: string): string | null => CLICK_EVENTS.find((e) => e.name === name)?.label ?? null;

/** 이벤트를 보내기 시작한 날(운영 반영 날) — 그 전 날짜는 0 이 아니라 "기록 전" */
export const CLICK_EVENTS_SINCE = "2026-11-25";

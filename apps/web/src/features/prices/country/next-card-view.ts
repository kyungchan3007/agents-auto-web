// 다음으로 볼 것 카드 셋의 글 (작업 0344 · 시안 2-new · 0361 에서 나라 페이지 · 여행 물가 사이드바가 같이 쓰도록 tsx 에서 꺼냄) — 순수 함수
import type { CountryView } from "./country-model";

export type NextCard = { track: string; kicker: string; title: string; big: string; say: string; href: string; link: string };

/** 카드의 글 — 순서 고정 (환전 · 항공권 · 예산) · 보이는 카드만 1 부터 번호를 매김 · fxOnlyIfRate = 오늘 환율이 있을 때만 환전 카드(여행 물가 사이드바) — 나라 페이지는 환율이 없어도 "자료 없음" 카드로 보임 */
export function nextCards(v: CountryView, o: { fxOnlyIfRate?: boolean } = {}): NextCard[] {
  const fx: NextCard = v.exchange
    ? { track: "country_next_fx", kicker: "1 · 환전", title: v.exchange.title, big: `${v.exchange.value} / ${v.exchange.unit}`, say: v.exchange.note, href: `/currencies/${v.currency}`, link: "환율 1년 흐름 보기" }
    : { track: "country_next_fx", kicker: "1 · 환전", title: "환전은 지금 해도 될까", big: "자료 없음", say: "이 나라 통화의 오늘 환율을 받지 못했습니다", href: v.currency ? `/currencies/${v.currency}` : "/currencies", link: "통화 둘러보기" };
  const f = v.flight;
  const air: NextCard =
    f.kind === "fare"
      ? { track: "country_next_flight", kicker: "2 · 항공권", title: `${f.city}, 언제 떠나면 쌀까`, big: f.big, say: f.say, href: "/flights", link: `${f.city} 출발일 달력 보기` }
      : f.kind === "timing"
        ? { track: "country_next_flight", kicker: "2 · 항공권", title: `${v.name}, 언제 떠나면 쌀까`, big: f.big, say: `떠나기 싼 달 · ${f.say}`, href: "/flights", link: "항공권 달 보기" }
        : { track: "country_next_flight", kicker: "2 · 항공권", title: `${v.name}, 언제 떠나면 쌀까`, big: f.say, say: "항공권 자료를 받지 못했습니다", href: "/flights", link: "항공권 보기" };
  const budget: NextCard = { track: "country_next_budget", kicker: "3 · 예산", title: `${v.budget.days}일이면 얼마나 들까`, big: v.budget.text, say: `한국에서 하루 10만 원 쓰는 만큼 · 물가 비율 ${v.index}`, href: "#budget", link: "예산 다시 짜기" };
  const shown = o.fxOnlyIfRate && v.exchange === null ? [air, budget] : [fx, air, budget];
  return shown.map((c, i) => ({ ...c, kicker: `${i + 1} · ${c.kicker.replace(/^\d+ · /, "")}` }));
}

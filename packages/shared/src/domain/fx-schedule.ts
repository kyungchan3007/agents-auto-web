// 값을 못 받은 날의 빈 상태 문장 · 링크 (작업 0346 · 0396) — 세 화면(/calc · 여행 물가 · 통화 상세)이 같은 부품(DataEmpty)에 넘김 · 순수 함수
// 방문자 말로 두 갈래: 수출입은행이 주지 않는 통화("제공 안 함") · 주는데 오늘 값이 아직 없음("늦음") · 수집 일정 같은 개발자 설명은 쓰지 않음
// 수집 일정은 실제대로 (.github/workflows/ensure-fx.yml): 평일 한국 시간 12시 이후 수출입은행 값 · 못 받으면 12:10 ~ 17:40 30분마다 다시 · 받으면 사이트를 새로 만듦

/** 실제 수집 일정 한 문단 */
export const FX_SCHEDULE_TEXT =
  "평일 한국 시간 12시 이후 한국수출입은행 값을 받습니다. 받지 못하면 12:10 ~ 17:40 에 30분마다 다시 받고, 받으면 사이트를 새로 만들어 반영합니다. 주말 · 공휴일은 직전 영업일 값을 그대로 보여 줍니다.";

export type EmptyScreen = "calc" | "prices" | "currency";
export type EmptyLink = { label: string; href: string };

/** 빈 이유 — "none" 수출입은행이 주지 않는 통화 · "late" 주는 통화인데 오늘 값이 아직 없음 */
export type EmptyKind = "none" | "late";

/** 화면별 제목 · 그동안 볼 수 있는 곳 — 제목만 두 갈래(직구 계산은 계산을 멈췄다는 뜻을 유지) */
export function emptyCopy(p: { screen: EmptyScreen; name?: string; kind?: EmptyKind }): { title: string; links: EmptyLink[] } {
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
  const title = p.kind === "none" ? `${name} 환율은 아직 제공되지 않습니다` : `${name} 오늘 환율을 아직 받지 못했습니다`.trim();
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

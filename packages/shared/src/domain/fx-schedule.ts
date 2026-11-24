// 값을 못 받은 날의 빈 상태 문장 · 링크 (작업 0346 · 시안 3-new) — 세 화면(/calc · 여행 물가 · 통화 상세)이 같은 부품(DataEmpty)에 넘김 · 순수 함수
// 수집 일정은 실제대로 (.github/workflows/ensure-fx.yml): 평일 한국 시간 12시 이후 수출입은행 값 · 못 받으면 12:10 ~ 17:40 30분마다 다시 · 받으면 사이트를 새로 만듦
const KST_OFFSET_MS = 9 * 3600_000;

/** 실제 수집 일정 한 문단 */
export const FX_SCHEDULE_TEXT =
  "평일 한국 시간 12시 이후 한국수출입은행 값을 받습니다. 받지 못하면 12:10 ~ 17:40 에 30분마다 다시 받고, 받으면 사이트를 새로 만들어 반영합니다. 주말 · 공휴일은 직전 영업일 값을 그대로 보여 줍니다.";

/** 이름표 "자료 없음 · 2026-11-25 10:00 확인" (한국 시간) — 시각을 모르거나 날짜가 아니면 "자료 없음" 만 (지어내지 않음) */
export function checkedAtText(iso: string | null): string {
  const t = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(t)) return "자료 없음";
  const kst = new Date(t + KST_OFFSET_MS).toISOString();
  return `자료 없음 · ${kst.slice(0, 10)} ${kst.slice(11, 16)} 확인`;
}

export type EmptyScreen = "calc" | "prices" | "currency";
export type EmptyLink = { label: string; href: string };

const NOT_GIVEN = "한국수출입은행이 오늘 값을 아직 주지 않았습니다. 평일 낮 12시부터 30분마다 다시 받고, 받으면 사이트를 새로 만들어";

/** 화면별 제목 · 이유(다시 받는 시각 포함) · 그동안 볼 수 있는 곳 */
export function emptyCopy(p: { screen: EmptyScreen; name?: string }): { title: string; reason: string; links: EmptyLink[] } {
  const name = p.name ?? "";
  if (p.screen === "calc")
    return {
      title: "오늘 환율을 아직 받지 못해 계산을 잠시 멈췄습니다",
      reason: `${NOT_GIVEN} 계산이 다시 열립니다.`,
      links: [
        { label: "이번 주 관세청 과세환율 (아래)", href: "#customs" },
        { label: "통화별 1년 흐름", href: "/currencies" },
        { label: "여행 물가", href: "/prices" },
      ],
    };
  if (p.screen === "prices")
    return {
      title: `${name} 오늘 환율을 아직 받지 못했습니다`,
      reason: `${NOT_GIVEN} 하루 예산에 환율을 함께 보여 드립니다.`,
      links: [
        { label: "통화 둘러보기", href: "/currencies" },
        { label: "직구 계산", href: "/calc" },
      ],
    };
  return {
    title: `${name} 환율을 아직 받지 못했습니다`,
    reason: `${NOT_GIVEN} 환율 · 신호 · 1년 흐름이 다시 보입니다.`,
    links: [
      { label: "통화 둘러보기", href: "/currencies" },
      { label: "여행 물가", href: "/prices" },
      { label: "직구 계산", href: "/calc" },
    ],
  };
}

/** 빈 상태 부품(DataEmpty)에 넘길 값 한 묶음 — 이름표 시각은 빌드 시각(at · 모르면 시각 없이 "자료 없음") */
export function emptyProps(p: { screen: EmptyScreen; name?: string; at: string | null }) {
  return { checked: checkedAtText(p.at), ...emptyCopy(p) };
}

/** 지금 시각(ISO) — 정적 페이지가 만들어지는 때가 곧 "확인한 시각"이라 서버 페이지가 빈 상태 이름표에 넘김 (tsx 에는 날짜 계산을 두지 않음 · 작업 0346) */
export const buildTimeIso = (): string => new Date().toISOString();

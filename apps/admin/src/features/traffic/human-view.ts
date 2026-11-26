// 유입 화면 사람 판별 글 (작업 0374) — 날짜별 표의 참여 칸 · 인스타 유입 두 줄 · 순수 함수 · 받지 못한 값(null)은 빈 글 (0 · 대시로 채우지 않음) · 0 으로 나누면 빈 글
import type { Ga4Report, HumanReport } from "@hav/shared/ga4";
import { countText } from "@/shared/format/count-text";

export type HumanCells = {
  engagedText: string;
  engagedRateText: string;
  secondsPerUserText: string;
};
const EMPTY: HumanCells = {
  engagedText: "",
  engagedRateText: "",
  secondsPerUserText: "",
};

/** 날짜 하루의 참여 세션 · 참여율(참여 세션 ÷ 세션) · 사용자당 참여 시간(초) — 자료가 없거나 그 날 줄이 없으면 모두 빈 글 */
export function humanCells(human: HumanReport | null, day: string): HumanCells {
  const d = human?.days.find((x) => x.day === day);
  if (!d) return EMPTY;
  return {
    engagedText: countText(d.engagedSessions),
    engagedRateText:
      d.engagedSessions === null || d.sessions === 0
        ? ""
        : `${((d.engagedSessions / d.sessions) * 100).toFixed(1)}%`,
    secondsPerUserText:
      d.engagementSeconds === null || d.users === 0
        ? ""
        : (d.engagementSeconds / d.users).toFixed(1),
  };
}

export type InstagramView = {
  kind: "link" | "utm";
  label: string;
  sessionsText: string;
  usersText: string;
};

/** 인스타 유입 두 줄(링크 · utm) · 받지 못했으면(null) null — 표를 그리지 않음 */
export function instagramViews(
  instagram: Ga4Report["instagram"],
): InstagramView[] | null {
  if (instagram === null) return null;
  return [
    {
      kind: "link",
      label: "인스타(링크)",
      sessionsText: countText(instagram.link.sessions),
      usersText: countText(instagram.link.users),
    },
    {
      kind: "utm",
      label: "인스타(utm)",
      sessionsText: countText(instagram.utm.sessions),
      usersText: countText(instagram.utm.users),
    },
  ];
}

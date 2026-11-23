// 인스타 성과 화면 글 (작업 0323 · 0324 에 알리기 탭에서 인스타 성과 화면으로) — 쉼표 숫자는 shared/format/count-text — 순수 함수 · 받지 못한 값(null)은 빈 칸 (0 · 대시로 채우지 않음)
import type { IgReport } from "@hav/shared/ig";

type Account = IgReport["account"][number];
type Media = IgReport["media"][number];

/** 게시 시각 → 게시 날짜(YYYY-MM-DD) — API 가 준 글의 앞 열 글자 */
export const postedDay = (postedAt: string): string => postedAt.slice(0, 10);

/** 계정 칸 — 지표 순서 · 이름 */
export const ACCOUNT_CELLS: { key: "reach" | "views" | "profileViews" | "websiteClicks" | "accountsEngaged"; label: string }[] = [
  { key: "reach", label: "도달" },
  { key: "views", label: "조회" },
  { key: "profileViews", label: "프로필 방문" },
  { key: "websiteClicks", label: "웹사이트 클릭" },
  { key: "accountsEngaged", label: "반응한 계정" },
];

/** 게시물 표 칸 — 숫자 칸 순서 · 이름 */
export const MEDIA_COLS: { col: "reach" | "likes" | "saved" | "shares" | "views"; label: string }[] = [
  { col: "reach", label: "도달" },
  { col: "likes", label: "좋아요" },
  { col: "saved", label: "저장" },
  { col: "shares", label: "공유" },
  { col: "views", label: "조회" },
];

/** 계정 칸에 보일 가장 최근 날(응답은 최근 날부터) · 없으면 null */
export const latestAccount = (r: IgReport): Account | null => r.account[0] ?? null;

/** 계정 · 게시물이 모두 없는가 */
export const isEmptyReport = (r: IgReport): boolean => r.account.length === 0 && r.media.length === 0;

export type { Account as IgAccountDay, Media as IgMediaLine };

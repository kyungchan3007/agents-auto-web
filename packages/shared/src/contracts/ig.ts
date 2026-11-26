// 인스타 성과 API 계약 — GET /ig (작업 0323) · 받지 못한 값은 null(0 아님) · 받은 0 은 0
import { z } from "zod";
import { IsoDate } from "../utils/date";

const Count = z.number().int().nonnegative().nullable();

/** 계정 — 날짜별 한 줄 · 최근 날부터 */
const IgAccountDay = z.object({ day: IsoDate, reach: Count, views: Count, profileViews: Count, websiteClicks: Count, accountsEngaged: Count, followers: Count });

/** 게시물 — 게시 최근 순 · 지표마다 가장 최근 날 값 · day = 그 게시물에서 값을 받은 가장 최근 날(없으면 null) */
const IgMediaLine = z.object({
  mediaId: z.string(),
  postedAt: z.string(),
  permalink: z.string(),
  kind: z.string(),
  day: IsoDate.nullable(),
  reach: Count,
  likes: Count,
  saved: Count,
  shares: Count,
  views: Count,
});

export const IgReport = z.object({ account: z.array(IgAccountDay), media: z.array(IgMediaLine) });
export type IgReport = z.infer<typeof IgReport>;

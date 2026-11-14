// 공용 시계열 API 계약 (작업 0163) — GET /indicators/:series?limit=
import { z } from "zod";

/** `<소문자·숫자·하이픈>:<영문·숫자·하이픈>` (예 kcs-import:USD · kosis-cpi:air-fare) */
export const SeriesId = z.string().regex(/^[a-z0-9-]+:[A-Za-z0-9-]+$/, "series 는 '이름:구분' 모양 (예 kcs-import:USD)");

export const IndicatorParam = z.object({ series: SeriesId });
export const IndicatorQuery = z.object({ limit: z.coerce.number().int().min(1).max(520).default(52) });

/** period: 주간은 적용 시작일 YYYY-MM-DD · 월간은 YYYY-MM — 오래된 것부터 · 자료가 없으면 points 는 빈 배열 */
export const IndicatorSeries = z.object({
  series: z.string(),
  points: z.array(z.object({ period: z.string(), value: z.number() })),
});
export type IndicatorSeries = z.infer<typeof IndicatorSeries>;

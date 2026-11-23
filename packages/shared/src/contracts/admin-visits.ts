// 어드민 접속 기록 API 계약 — GET /admin-visits (작업 0326) · 토큰 이름별 처음 · 마지막 접속 시각만 (IP · 기기 · 경로 없음)
import { z } from "zod";

export const AdminVisits = z.object({
  /** 마지막 접속이 최근인 이름부터 · owner(본인)는 없음 */
  visits: z.array(z.object({ name: z.string(), firstAt: z.string(), lastAt: z.string() })),
});
export type AdminVisits = z.infer<typeof AdminVisits>;

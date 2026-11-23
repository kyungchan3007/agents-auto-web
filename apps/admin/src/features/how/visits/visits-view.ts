// 만드는 방식 — 접속 기록 표 보이기 (작업 0326 · 순수 함수) · 시각은 한국 시간 'YYYY-MM-DD HH:mm'
import type { AdminVisits } from "@hav/shared/admin-visits";

const KST_MS = 9 * 3600_000;

export function kstMinute(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t + KST_MS).toISOString().slice(0, 16).replace("T", " ");
}

export type VisitRowView = { name: string; firstAt: string; lastAt: string };

/** 응답 순서 그대로(마지막 접속 최근 순) */
export const visitRows = (report: AdminVisits): VisitRowView[] => report.visits.map((v) => ({ name: v.name, firstAt: kstMinute(v.firstAt), lastAt: kstMinute(v.lastAt) }));

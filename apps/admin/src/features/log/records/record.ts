// 작업실 "실시간 기록" 카드의 줄 — 머지된 PR 기록 (실제 기록만 · 작업 0170 · Figma 06)
//   "11-15 02:07  작업 0165 머지 · 한국은행 수입물가지수" — 시각은 한국 시간 · PR 제목의 "작업 NNNN:" 머리와 끝의 "(#N)" 은 떼어 냄
import type { DoneTask } from "@hav/shared/tasks";

/** 한국 시간 "11-15 02:07" */
export function kstStamp(iso: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return `${p.month}-${p.day} ${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

export function recordLine(d: DoneTask): string {
  const title = d.name.replace(/^작업\s*\d+\s*:\s*/, "").replace(/\s*\(#\d+\)\s*$/, "").trim();
  return `${kstStamp(d.mergedAt)}  ${d.task ? `작업 ${d.task}` : `PR #${d.number}`} 머지 · ${title}`;
}

/** 실시간 기록 한 줄을 시각 · 글로 나눔 (작업 0303 · 어드민 줄 목록) */
export function recordParts(d: DoneTask): { time: string; text: string; at: string } {
  const [time, ...rest] = recordLine(d).split("  ");
  return { time: time ?? "", text: rest.join("  "), at: d.mergedAt };
}

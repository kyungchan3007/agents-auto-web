"use client";

// 장애 안내 줄 — 2026-10-29 D1 하루 읽기 한도 초과로 API 가 500 (작업 0080 · 사용자 요청: "내일 09:00 시까지 한도 문제로 데이터 못불러 온다고 표시를 하자")
//   빌드 때 이미 끝난 시각이면 HTML 에 안 넣음(show) · 페이지를 연 채로 시각이 지나면 브라우저가 숨김
//   다음 장애 때 다시 쓰려면 OUTAGE 를 바꿈 · 끝나면 null
import { OUTAGE } from "./outage";
import { useOutageVisible } from "./use-outage-visible";

export function OutageNotice({ show }: { show: boolean }) {
  const on = useOutageVisible(show);
  if (!on || !OUTAGE) return null;
  return (
    <div role="status" data-surface="dark" className="border-b border-expensive/40 bg-surface px-4 py-2.5 text-center text-xs leading-relaxed text-fg sm:px-8 sm:text-sm">
      <span aria-hidden className="mr-1.5">⚠️</span>
      {OUTAGE.text}
    </div>
  );
}

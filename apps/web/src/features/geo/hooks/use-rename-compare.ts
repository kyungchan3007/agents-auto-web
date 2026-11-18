"use client";

// 이름 바꾼 날 전후 비교 자료 (작업 0205) — "오늘" 은 브라우저에서 한국 날짜로 · 서버가 만든 화면에서는 빈 값(응답의 마지막 기록일까지만 셈)이라 날짜가 달라도 어긋나지 않음
import { kstDate } from "@hav/shared/date";
import type { GeoReport } from "@hav/shared/geo";
import { useMemo, useSyncExternalStore } from "react";
import { renameCompare } from "../lib/rename-compare";

const noSubscribe = () => () => {};

export function useRenameCompare(report: GeoReport) {
  const today = useSyncExternalStore(noSubscribe, () => kstDate(new Date()), () => "");
  return useMemo(() => renameCompare(report, today), [report, today]);
}

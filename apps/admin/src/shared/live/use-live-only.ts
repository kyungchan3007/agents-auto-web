"use client";

// 브라우저에서 한 번 받기 — 빌드 때 값 없이 (매일 바뀌는 측정 값을 빌드에 굳히지 않음) · null = 받는 중 (작업 0324 · 인스타 성과 · 유입 화면)
//   load 는 바뀌지 않는 함수로 넘김 (모듈 함수)
import type { Fetched } from "@hav/shared/fetched";
import { useEffect, useState } from "react";

export function useLiveOnly<T>(load: () => Promise<Fetched<T>>): Fetched<T> | null {
  const [report, setReport] = useState<Fetched<T> | null>(null);
  useEffect(() => {
    let stopped = false;
    void load().then((r) => {
      if (!stopped) setReport(r);
    });
    return () => {
      stopped = true;
    };
  }, [load]);
  return report;
}

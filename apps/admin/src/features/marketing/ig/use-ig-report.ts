"use client";

// 인스타 성과 받기 — 빌드 때 값 없이 브라우저에서 /bff/ig 로 한 번 (매일 바뀌는 값이라 빌드에 굳히지 않음) · null = 받는 중 (작업 0323)
import { type Fetched, LIVE, api } from "@hav/shared/api";
import type { IgReport } from "@hav/shared/ig";
import { useEffect, useState } from "react";

export function useIgReport(): Fetched<IgReport> | null {
  const [report, setReport] = useState<Fetched<IgReport> | null>(null);
  useEffect(() => {
    let stopped = false;
    void api.ig(LIVE).then((r) => {
      if (!stopped) setReport(r);
    });
    return () => {
      stopped = true;
    };
  }, []);
  return report;
}

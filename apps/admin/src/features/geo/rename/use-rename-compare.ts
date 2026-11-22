"use client";

// 이름 바꾼 날 전후 비교 자료 (작업 0205) — 끝 날짜 asOf 는 자료를 받은 날(빌드 때 한국 날짜) · 브라우저 날짜는 쓰지 않음
import type { GeoReport } from "@hav/shared/geo";
import { useMemo } from "react";
import { renameCompare } from "./rename-model";

export const useRenameCompare = (report: GeoReport, asOf: string) => useMemo(() => renameCompare(report, asOf), [report, asOf]);

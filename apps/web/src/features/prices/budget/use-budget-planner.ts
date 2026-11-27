"use client";

// 여행 예산 계산 상태 (작업 0088) — 입력은 이 화면 상태에만 (보내지 않음) · 계산은 budget.ts
import type { SignalList } from "@hav/shared/signal";
import { PICK_EVENT, type PickedTrip, type TravelRow, TRAVEL_CITIES, TRAVEL_COUNTRIES, readPicked, writePicked } from "@hav/shared/travel";
import { useState } from "react";
import { usePickedTrip } from "@/shared/trip/use-picked-trip";
import { useQueryParam } from "@hav/ui/hooks/browser/use-query-param";
import { emptyProps } from "@hav/shared/fx-schedule";
import { budgetCountry, budgetOf, parseDaily, parseDays } from "./budget";

export type Latest = SignalList["signals"][number]["latest"];

export function useBudgetPlanner(rows: TravelRow[], latestOf: Record<string, Latest>, initial: string | null = null) {
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  // /prices?country=THA#budget (홈 여행지 · 통화 상세에서 옴 · 작업 0100)
  const fromUrl = useQueryParam("country");
  const [picked, setCountry] = useState<string | null>(null);
  // 여행지(홈 · 시트 · 인트로)로 고른 나라가 있으면 그 나라로 시작 — 마운트 뒤에 읽어 서버 HTML 은 지금 그대로 (작업 0212)
  const pickedTrip = usePickedTrip();
  const country = budgetCountry({ rows: sorted, chosen: picked, fromUrl, pickedTrip: pickedTrip?.country ?? null, initial });
  const [daily, setDaily] = useState("100,000");
  const [days, setDays] = useState("4");
  const row = rows.find((r) => r.country === country);
  const d = parseDaily(daily);
  const n = parseDays(days);
  const latest = row?.currency ? (latestOf[row.currency] ?? null) : null;
  /** 예산 카드에서 나라를 고르면 홈 검색 칸 · 인트로와 같은 내 여행지로도 저장 (노선이 따라옴 · 작업 0360) — 예산 금액은 이어 씀 */
  const chooseCountry = (code: string) => {
    setCountry(code);
    let store: Storage | null = null;
    try {
      store = window.localStorage;
    } catch {
      store = null;
    }
    const trip: PickedTrip = { v: 1, country: code, city: TRAVEL_CITIES[code]?.[0] ?? TRAVEL_COUNTRIES[code]?.name ?? code, budget: readPicked(store)?.budget ?? 0 };
    writePicked(store, trip);
    window.dispatchEvent(new CustomEvent<PickedTrip>(PICK_EVENT, { detail: trip }));
  };
  return {
    sorted,
    country,
    setCountry: chooseCountry,
    daily,
    setDaily,
    days,
    setDays,
    row,
    d,
    n,
    latest,
    /** 환율을 못 받은 나라(통화가 있는데 오늘 환율이 없음)면 금액 대신 빈 상태 (작업 0346) · 통화가 원래 없는 나라는 null */
    empty: row?.currency && !latest ? emptyProps({ screen: "prices", name: row.name, kind: "late" }) : null,
    budget: row && d != null && n != null ? budgetOf(d, n, row.relative, latest?.value ?? null) : null,
  };
}

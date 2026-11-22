"use client";

// 항공권 출발일 달력 상태 — 고른 도시 · 고른 날 · 요일 막대 자람 · 날짜 띠 범위 · 움직임 만들기 (작업 0234)
//   움직임(고른 날 표시 · 비행기 · 띠 흘러가기 · 글자판)은 lib/airfare-motion.ts 가 하고 여기서는 만들고 · 부르고 · 지움
//   칸이 그려진 뒤(layout) 한 번 만들어 처음 그림(움직임 없는 최종 상태)을 잡고, 화면에 처음 들어오면 움직임이 한 번 일어남 · 도시가 바뀌면 새 칸이 그려진 뒤 움직임
import type { AirfareCalendar } from "@hav/shared/airfare";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type AirfareMotion, createAirfareMotion } from "./airfare-motion";
import { type CityView, rangeText } from "./airfare-view";

export type AirfareItem = { city: AirfareCalendar["cities"][number]; view: CityView };

export function useAirfareCalendar(items: AirfareItem[]) {
  const [airport, setAirport] = useState(items[0].city.airport);
  const item = items.find((i) => i.city.airport === airport) ?? items[0];
  const [sel, setSel] = useState(item.view.bestIndex);
  const [grown, setGrown] = useState(false);
  const [range, setRange] = useState({ text: "", atStart: true, atEnd: false });
  const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  const motion = useRef<AirfareMotion | null>(null);
  const prevSel = useRef<number | null>(null);
  const firstCity = useRef(true);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const m = createAirfareMotion(root, {
      onRange: (text, atStart, atEnd) => setRange({ text, atStart, atEnd }),
      onGrow: () => setGrown(true),
      formatRange: rangeText,
    });
    motion.current = m;
    m.show({ animate: false, first: true, prev: null });
    return () => {
      m.destroy();
      motion.current = null;
    };
  }, []);

  useEffect(() => {
    if (firstCity.current) {
      firstCity.current = false;
      return;
    }
    motion.current?.show({ animate: true, first: false, prev: prevSel.current });
  }, [airport]);

  const chooseCity = useCallback(
    (a: string) => {
      if (a === airport) return;
      const next = items.find((i) => i.city.airport === a);
      if (!next) return;
      prevSel.current = sel;
      setAirport(a);
      setSel(next.view.bestIndex);
    },
    [airport, items, sel],
  );
  const chooseDay = useCallback((i: number) => {
    setSel(i);
    motion.current?.pick(i);
  }, []);
  /** ‹ › — 한 번에 최대 7칸 · 칸 경계에 맞춰 */
  const page = useCallback((dir: -1 | 1) => {
    const sc = rootRef.current?.querySelector<HTMLElement>('[data-testid="airfare-scroll"]');
    const first = rootRef.current?.querySelector<HTMLElement>('[data-testid="airfare-day"]');
    if (!sc || !first) return;
    const w = first.getBoundingClientRect().width;
    const per = Math.max(1, Math.round(sc.clientWidth / w));
    const max = sc.scrollWidth - sc.clientWidth;
    const x = Math.max(0, Math.min(max, Math.round((sc.scrollLeft + dir * w * Math.min(7, per)) / w) * w));
    sc.scrollTo({ left: x, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  return { airport, item, sel, grown, range, rootRef, chooseCity, chooseDay, page };
}

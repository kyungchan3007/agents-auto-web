"use client";

// 여행 물가 휴대폰 세로 노선 상태 — 펼친 줄(하나만 · 다시 누르면 접힘) · 비행기가 있는 줄 · 비행기 세로 위치 (작업 0283 · 시안 64 A안)
//   처음에는 첫 정거장이 펼쳐져 있고 비행기도 거기 · 접어도 비행기는 마지막으로 고른 줄에 그대로
//   비행기 위치 = 그 줄의 윗선 + 12px 를 재서 transform 으로 옮김(CSS 전환) · 줄 높이가 바뀌거나(펼침 · 접힘 · 글자 줄바꿈) 폭이 바뀌면 다시 재서 따라감 · 움직임 줄이기는 전환 없이 바로(CSS)
//   서버 첫 그림 · 자바스크립트 꺼짐: 첫 줄 펼침 · 비행기는 첫 줄 위(12px)
import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from "react";

/** 비행기 높이 32px 의 반 = 줄 가운데(56px 의 반 28px) − 16px */
const PLANE_TOP = 12;

export function useRouteList(): { list: RefObject<HTMLOListElement | null>; open: number | null; plane: number; planeY: number; toggle: (i: number) => void } {
  const list = useRef<HTMLOListElement>(null);
  const [open, setOpen] = useState<number | null>(0);
  const [plane, setPlane] = useState(0);
  const [planeY, setPlaneY] = useState(PLANE_TOP);

  const toggle = useCallback((i: number) => {
    setOpen((o) => (o === i ? null : i));
    setPlane(i);
  }, []);

  useLayoutEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const place = () => {
      const li = ol.children[plane] as HTMLElement | undefined;
      if (li) setPlaneY(li.offsetTop + PLANE_TOP);
    };
    place();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(place);
    ro.observe(ol);
    return () => ro.disconnect();
  }, [plane, open]);

  return { list, open, plane, planeY, toggle };
}

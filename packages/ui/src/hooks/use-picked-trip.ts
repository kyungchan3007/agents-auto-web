"use client";

// 고른 여행지 읽기 — 마운트 뒤에 브라우저 저장소에서 읽고 · 시트 · 인트로가 보내는 PICK_EVENT 도 들음 (작업 0201)
// 서버 HTML 은 지금 그대로(처음 값 null) · 값 모양은 @hav/shared/travel 만 · 망가진 값은 무시
// 홈의 use-picked-destination(작업 0185 · 구조 검사가 고정)과 같은 방식 — 홈 · 여행 물가 · 시트가 함께 쓰려고 shared 에 따로 둠
import { PICK_EVENT, type PickedTrip, parsePicked, readPicked } from "@hav/shared/travel";
import { useEffect, useState } from "react";

export function usePickedTrip(): PickedTrip | null {
  const [picked, setPicked] = useState<PickedTrip | null>(null);
  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    // 마운트 직후(서버 HTML 과 첫 그림은 같게) 저장된 값을 읽음
    const first = window.setTimeout(() => setPicked(readPicked(storage)), 0);
    const onPick = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail;
      setPicked(parsePicked(JSON.stringify(detail ?? null)) ?? readPicked(storage));
    };
    window.addEventListener(PICK_EVENT, onPick);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener(PICK_EVENT, onPick);
    };
  }, []);
  return picked;
}

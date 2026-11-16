"use client";

// 인트로에서 고른 여행지 — 마운트 뒤에 브라우저 저장소에서 읽고 · 인트로가 끝날 때 보내는 이벤트(PICK_EVENT)도 들음 (작업 0185)
// 서버 HTML 은 지금 그대로 (처음 값 null) · 값 모양은 @hav/shared/travel 만 — 인트로 폴더를 가져오지 않음 · 망가진 값은 무시
import { PICK_EVENT, type PickedTrip, parsePicked, readPicked } from "@hav/shared/travel";
import { useEffect, useState } from "react";

export function usePickedDestination() {
  const [picked, setPicked] = useState<PickedTrip | null>(null);
  const [passOpen, setPassOpen] = useState(false);
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
  return { picked, passOpen, togglePass: () => setPassOpen((v) => !v) };
}

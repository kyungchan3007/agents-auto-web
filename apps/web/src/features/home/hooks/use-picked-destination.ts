"use client";

// 인트로에서 고른 여행지 — 마운트 뒤에 브라우저 저장소에서 읽고 · 인트로가 끝날 때 보내는 이벤트(PICK_EVENT)도 들음 (작업 0185)
// 서버 HTML 은 지금 그대로 (처음 값 null) · 값 모양은 @hav/shared/travel 만 — 인트로 폴더를 가져오지 않음 · 망가진 값은 무시
import { PICK_EVENT, type PickedTrip, parsePicked, readPicked } from "@hav/shared/travel";
import { useEffect, useState } from "react";

/** 탑승권 상자가 뜬 채 머무는 시간 · 사라지는 데 걸리는 시간 (작업 0253) */
const PASS_STAY_MS = 3000;
const PASS_FADE_MS = 500;

export function usePickedDestination() {
  const [picked, setPicked] = useState<PickedTrip | null>(null);
  // 탑승권 상자: closed → open(3초) → leaving(0.5초 · 흐려지며 내려감) → closed · 올려 두는 동안(held) 멈추고 떼면 3초를 다시 셈 · 여행지가 바뀌어도 다시 셈 (작업 0253)
  const [phase, setPhase] = useState<"closed" | "open" | "leaving">("closed");
  const [held, setHeld] = useState(false);
  const pickKey = picked ? `${picked.country}-${picked.city}` : "";
  const [seenKey, setSeenKey] = useState(pickKey);
  if (seenKey !== pickKey) {
    setSeenKey(pickKey);
    if (phase === "leaving") setPhase("open");
  }
  useEffect(() => {
    if (phase === "closed" || held) return;
    const t = window.setTimeout(() => setPhase(phase === "open" ? "leaving" : "closed"), phase === "open" ? PASS_STAY_MS : PASS_FADE_MS);
    return () => window.clearTimeout(t);
  }, [phase, held, pickKey]);
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
  return {
    picked,
    passOpen: phase !== "closed",
    passLeaving: phase === "leaving",
    togglePass: () => {
      setHeld(false);
      setPhase((p) => (p === "closed" ? "open" : "closed"));
    },
    /** 상자 위에 마우스 · 손가락이 있는 동안 true — 사라지지 않고, 떼면 3초를 다시 셈 */
    holdPass: (on: boolean) => {
      setHeld(on);
      if (on) setPhase((p) => (p === "leaving" ? "open" : p));
    },
  };
}

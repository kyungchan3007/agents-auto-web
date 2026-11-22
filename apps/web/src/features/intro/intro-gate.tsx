"use client";

// 인트로 문 — 서버 HTML 에는 아무것도 그리지 않고, 마운트 뒤 폭 700 초과 · 끄기 스위치가 꺼져 있을 때만 인트로를 띄움 (작업 0185)
// 홈 HTML(검색 · AI 답변 측정이 읽는 내용)은 인트로 없이도 지금과 같음
import { useIntroEnabled } from "./state/use-intro-enabled";
import type { IntroData } from "./state/use-intro";
import { Intro } from "./intro";

export function IntroGate({ data }: { data: IntroData }) {
  const enabled = useIntroEnabled();
  return enabled ? <Intro data={data} /> : null;
}

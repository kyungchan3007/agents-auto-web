"use client";

// 지금 열린 주소가 운영인지 — 정적으로 내보내 미리보기와 운영이 같은 빌드라, 브라우저 hostname 으로 판정 (작업 0322)
//   서버 첫 그림 · 하이드레이션 첫 그림 · 자바스크립트 없음은 false(아무것도 안 그림) · 주소는 페이지 안에서 안 바뀌어 구독할 것 없음
import { useSyncExternalStore } from "react";
import { analyticsEnabled } from "./analytics";

const subscribe = () => () => {};
const client = () => analyticsEnabled(window.location.hostname);
const server = () => false;

export const useAnalyticsEnabled = (): boolean => useSyncExternalStore(subscribe, client, server);

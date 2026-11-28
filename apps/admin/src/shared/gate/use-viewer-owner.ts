"use client";

// 보는 사람이 owner 인가 — Worker 가 owner 응답의 <html data-viewer="owner"> 로 알림 (작업 0403 · /session 을 기다리지 않아 첫 그림부터 정해짐)
//   서버(빌드) 그림은 owner 아님 · 브라우저에서 읽은 값으로 바뀌는 것은 찾기 · 단축키 · 로고 주소뿐(눈에 보이는 자리는 CSS 가 정함)
import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const read = () => document.documentElement.dataset.viewer === "owner";

export const useViewerOwner = (): boolean => useSyncExternalStore(subscribe, read, () => false);

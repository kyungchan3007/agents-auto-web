"use client";

// 바닥 고정 환율 띠를 그릴 화면인가 (작업 0399) — 홈("/")은 hero 아래 띠가 따로 있어 그리지 않음 (정적 사이트라 서버 첫 그림부터 같은 답)
import { usePathname } from "next/navigation";

export const useFixedTicker = (): boolean => usePathname() !== "/";

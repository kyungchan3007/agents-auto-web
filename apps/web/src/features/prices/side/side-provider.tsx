"use client";

// 여행 물가 목록 나라 사이드바 · 시트 제공자 (작업 0361 2단계) — 본문을 감싸 "열림이면 본문을 오른쪽 여백만큼 밀어냄"(data-push · 목록 칸이 좁아지면 한 줄로 쌓임) · 패널은 화면 맨 위에 그림
import type { ReactNode } from "react";
import { CountrySide } from "./country-side";
import type { SideEntry } from "./side-view";
import { SideContext } from "./use-side-context";
import { useCountrySide } from "./use-country-side";

export function SideProvider({ entries, children }: { entries: SideEntry[]; children: ReactNode }) {
  const s = useCountrySide(entries);
  return (
    <SideContext.Provider value={{ onLink: s.onLink }}>
      <div className="group/prices" data-push={s.pushed ? "true" : "false"}>
        {children}
      </div>
      {s.mounted && s.entry && <CountrySide s={s} entry={s.entry} />}
    </SideContext.Provider>
  );
}

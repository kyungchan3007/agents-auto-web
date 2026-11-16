"use client";

// 3D 장면을 인트로가 열릴 때만 불러와 붙임 — three · 모델은 여기서 동적으로 (홈 첫 로딩 무게 그대로 · 작업 0185)
// 장면이 안 떠도(WebGL 없음 · 모델 못 받음 · 불러오기 실패) 흐름은 계속 — 실패하면 장면 없이 준비됨으로 알림
import { type RefObject, useEffect } from "react";
import type { SceneApi } from "../lib/scene-types";

export function useIntroScene(el: RefObject<HTMLElement | null>, api: SceneApi): void {
  useEffect(() => {
    let dead = false;
    let dispose: () => void = () => {};
    void (async () => {
      try {
        const { mountIntroScene } = await import("../lib/scene");
        if (dead || !el.current) return;
        dispose = mountIntroScene(el.current, api);
      } catch {
        if (!dead) api.onReady?.();
      }
    })();
    return () => {
      dead = true;
      dispose();
    };
    // api 는 한 번 만든 같은 객체 — 마운트 때 한 번만 붙임
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el]);
}

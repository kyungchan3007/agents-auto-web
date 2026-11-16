"use client";

// 3D 장면을 인트로가 열릴 때만 불러와 붙임 — three · 모델은 여기서 동적으로 (홈 첫 로딩 무게 그대로 · 작업 0185)
// 장면이 안 떠도(WebGL 없음 · 모델 못 받음 · 불러오기 실패) 흐름은 계속 — 실패하면 장면 없이 준비됨으로 알림
import { useEffect } from "react";
import type { SceneApi } from "../lib/scene-types";

export function useIntroScene(find: () => HTMLElement | null, makeApi: () => SceneApi): void {
  useEffect(() => {
    const api = makeApi();
    let dead = false;
    let dispose: () => void = () => {};
    void (async () => {
      try {
        const { mountIntroScene } = await import("../lib/scene");
        const el = find();
        if (dead || !el) return;
        dispose = mountIntroScene(el, api);
      } catch {
        if (!dead) api.onReady?.();
      }
    })();
    return () => {
      dead = true;
      dispose();
    };
    // 장면은 마운트 때 한 번만 붙임 (find · makeApi 는 마운트 때의 같은 공유 값을 가리킴)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

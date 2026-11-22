"use client";

// 3D 장면을 인트로가 열릴 때만 불러와 붙임 — three · 모델은 여기서 동적으로 (홈 첫 로딩 무게 그대로 · 작업 0185)
// 장면이 안 떠도(WebGL 없음 · 모델 못 받음 · 불러오기 실패) 흐름은 계속 — 실패하면 장면 없이 준비됨으로 알림
import { useEffect } from "react";
import { isSoftwareRenderer } from "./gpu";
import type { SceneApi } from "./scene-types";

/** 3D 를 그릴 수 없는 환경인가 — WebGL 이 없거나 소프트웨어 렌더(그래픽 가속 없음)면 참 · 판별이 안 되면(브라우저가 이름을 숨김) 3D 를 시도 */
function noAcceleration(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : null;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return isSoftwareRenderer(name);
  } catch {
    return true;
  }
}

export function useIntroScene(find: () => HTMLElement | null, makeApi: () => SceneApi): void {
  useEffect(() => {
    const api = makeApi();
    let dead = false;
    // 그래픽 가속이 없으면 three · 모델을 불러오지 않고 가벼운 배경으로 흐름만 (소프트웨어 렌더가 메인 스레드를 막아 인트로가 멈추는 것을 피함)
    if (noAcceleration()) {
      api.onLite?.();
      api.onReady?.();
      return () => {
        dead = true;
      };
    }
    let dispose: () => void = () => {};
    void (async () => {
      try {
        const { mountIntroScene } = await import("./scene");
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

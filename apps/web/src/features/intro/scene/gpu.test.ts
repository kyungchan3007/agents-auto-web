// 작업 0185 — 그래픽 가속이 없는 환경 판별 (CI Linux · GPU 없음에서 3D 가 메인 스레드를 막아 인트로 e2e 가 느려진 문제)
import { describe, expect, it } from "vitest";
import { isSoftwareRenderer } from "./gpu";

describe("isSoftwareRenderer", () => {
  it("소프트웨어 렌더러 이름 — SwiftShader · llvmpipe · Software · Basic Render · Mesa Offscreen", () => {
    for (const n of [
      "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
      "llvmpipe (LLVM 15.0.7, 256 bits)",
      "Google SwiftShader",
      "Microsoft Basic Render Driver",
      "Mesa OffScreen",
      "ANGLE (Software Renderer)",
    ]) expect(isSoftwareRenderer(n), n).toBe(true);
  });

  it("실제 GPU 이름은 소프트웨어가 아님", () => {
    for (const n of ["ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)", "NVIDIA GeForce RTX 4070", "ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.1)", "AMD Radeon Pro 5500M"]) expect(isSoftwareRenderer(n), n).toBe(false);
  });

  it("이름을 알 수 없으면(브라우저가 숨김 · 빈 값) 소프트웨어로 보지 않음 — 3D 를 시도", () => {
    expect(isSoftwareRenderer(null)).toBe(false);
    expect(isSoftwareRenderer(undefined)).toBe(false);
    expect(isSoftwareRenderer("")).toBe(false);
  });
});

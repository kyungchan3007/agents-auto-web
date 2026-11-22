import type { NextConfig } from "next";

// 어드민(admin.flapfx.com) — 정적 내보내기 → out/ 를 어드민 Worker(flapfx-admin) 정적 자산으로 (작업 0312 · docs/architecture.md)
const nextConfig: NextConfig = {
  output: "export",
  // next dev 가 AGENTS.md(보호 파일)를 자동으로 쓰지 않게 — 안내 블록은 루트 AGENTS.md 에서 손으로 관리
  agentRules: false,
  // 디자인 시스템은 TS 소스 그대로 쓰는 내부 패키지 → Next 가 변환
  transpilePackages: ["@hav/ui"],
};

export default nextConfig;

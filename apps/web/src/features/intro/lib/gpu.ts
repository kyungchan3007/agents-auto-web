// 그래픽 가속이 없는 환경 판별 — 순수 함수 (작업 0185 · 테스트 gpu.test.ts)
// WebGL 이 없거나 소프트웨어 렌더(SwiftShader · llvmpipe …)면 3D 장면을 띄우지 않고 가벼운 배경으로 인트로 흐름만 진행 — GPU 없는 사용자 · CI 가 느려지지 않게

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen|lavapipe/i;

/** WebGL 렌더러 이름이 소프트웨어 렌더인지 — 이름을 알 수 없으면(브라우저가 숨김) 소프트웨어로 보지 않음 */
export const isSoftwareRenderer = (name: string | null | undefined): boolean => !!name && SOFTWARE.test(name);

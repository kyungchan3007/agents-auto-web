// 로고가 인트로 자리에서 메뉴 자리로 날아가는 시작 값 (작업 0223 · 0312 에 window-transition.tsx 에서 옮김) · 순수 함수
type Box = { left: number; top: number; width: number };

export const logoFrom = (logo: { from: Box; to: Box } | null) =>
  logo ? { x: logo.from.left - logo.to.left, y: logo.from.top - logo.to.top, scale: logo.from.width / Math.max(1, logo.to.width) } : null;

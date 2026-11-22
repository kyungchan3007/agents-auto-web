// 값이 최저 ~ 최고 사이 어디쯤인지 0(쌈) ~ 1(비쌈) (작업 0312 에 도착지 줄(scalePosition) · 통화 범위 카드(routePosition)의 같은 계산을 모음) · 순수 함수
//   범위가 없거나 숫자가 유한하지 않으면 null (눈금을 그리지 않음)
export function scalePosition(value: number, min: number, max: number): number | null {
  if (![value, min, max].every(Number.isFinite) || !(max > min)) return null;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

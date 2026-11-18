// 넓은 화면 통화 목록 높이 — 줄 높이의 배수로 맞춰 맨 아래 줄이 중간에서 잘리지 않게 (순수 함수 · 작업 0212)
/** 쓸 수 있는 높이(px) 안에 들어가는 줄 수만큼의 높이 — 줄 높이를 모르면(0 이하) null · 한 줄도 안 들어가도 한 줄은 보임 */
export function fitRows(available: number, rowHeight: number): number | null {
  if (!(rowHeight > 0) || !Number.isFinite(available)) return null;
  return Math.max(1, Math.floor(available / rowHeight)) * rowHeight;
}

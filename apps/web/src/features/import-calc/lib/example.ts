// 처음 들어오면 넣어 주는 예시 값 — 순수 함수 (작업 0200 · #235)
//   값을 넣으면 칸이 커지는 대신 처음부터 결과가 보이게 · 달러가 아니거나 환율이 없으면 예시 없음 (지금처럼 빈 칸)
import type { Route } from "./rules";

export const EXAMPLE = { currency: "USD", price: "180", route: "us-list" } as const satisfies { currency: string; price: string; route: Route };

export function exampleFor(currency: string, hasRate: boolean): typeof EXAMPLE | null {
  return hasRate && currency === EXAMPLE.currency ? EXAMPLE : null;
}

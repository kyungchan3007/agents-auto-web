// 어드민 입구 — /session 응답 읽기 · 안내 창 글 (작업 0326 · 순수 함수)
export const OWNER_NAME = "owner";

/** 응답이 { name: 글 } 이면 그 이름 · 아니면 null (알 수 없는 모양은 아무것도 안 띄움) */
export function parseSessionName(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const name = (data as { name?: unknown }).name;
  return typeof name === "string" && name !== "" ? name : null;
}

/** 본인(owner) 이름인가 — 접속 기록처럼 본인만 볼 것 (작업 0339) */
export const isOwnerName = (name: string | null): boolean => name === OWNER_NAME;

/** 안내 창을 띄울 이름인가 — 본인(owner)은 띄우지 않음 */
export const shouldWelcome = (name: string | null): name is string => name !== null && name !== OWNER_NAME;

/** apply-<회사>-<날짜 숫자> 모양이면 "<회사> 회사 님, 반갑습니다" · 아니면 null (회사 이름에 하이픈이 있어도 됨) */
export function hello(name: string): string | null {
  const m = /^apply-(.+)-\d+$/.exec(name);
  return m ? `${m[1]} 회사 님, 반갑습니다` : null;
}

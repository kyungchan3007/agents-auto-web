// 어드민 입구 — /session 응답 읽기 (작업 0326 · 순수 함수 · 0403 에 안내 창 글 삭제)
export const OWNER_NAME = "owner";

/** 응답이 { name: 글 } 이면 그 이름 · 아니면 null (알 수 없는 모양은 아무것도 안 띄움) */
export function parseSessionName(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const name = (data as { name?: unknown }).name;
  return typeof name === "string" && name !== "" ? name : null;
}

/** 본인(owner) 이름인가 — 접속 기록처럼 본인만 볼 것 (작업 0339) */
export const isOwnerName = (name: string | null): boolean => name === OWNER_NAME;

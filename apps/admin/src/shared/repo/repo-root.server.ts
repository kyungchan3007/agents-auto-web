// 저장소 읽기 — 빌드 때만 (서버 · 정적 내보내기) · 만드는 방식 · 알리기가 같이 씀 (작업 0303 · 0307 · 0312 에 두 page.tsx 의 같은 함수를 모음)
//   못 읽으면 던지지 않고 null · 빈 값 — 화면은 그 칸을 빼거나 빈 상태로 (숫자를 지어내지 않음)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

/** 저장소 맨 위 (.agents 가 있는 곳) — 빌드 위치(process.cwd())에서 다섯 단계까지 올라가 찾음 · 못 찾으면 null */
export function repoRoot(start: string = process.cwd()): string | null {
  let d = start;
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(d, ".agents"))) return d;
    d = dirname(d);
  }
  return null;
}

/** 읽다 실패하면 null */
export function safe<T>(f: () => T): T | null {
  try {
    return f();
  } catch {
    return null;
  }
}

/** 저장소 기준 경로의 글 — 없거나 못 읽으면 null */
export const readRepoText = (root: string, rel: string): string | null => safe(() => readFileSync(join(root, rel), "utf8"));
/** 저장소 기준 폴더의 이름 목록 — 없거나 못 읽으면 null */
export const listRepoDir = (root: string, rel: string): string[] | null => safe(() => readdirSync(join(root, rel)));
export const repoHas = (root: string, rel: string): boolean => existsSync(join(root, rel));

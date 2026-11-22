// 만드는 방식 숫자 — 저장소에서 센 값 (작업 0303 · 0312 에 app/how/page.tsx 에서 옮김) · 순수 함수
//   못 세면 null — 화면은 그 칸을 뺌 (지어내지 않음)
export type HowCounts = { tasks: number | null; protectedRules: number | null; hooks: number | null };

export const NO_COUNTS: HowCounts = { tasks: null, protectedRules: null, hooks: null };

/** 작업 폴더 수 — .agents/specs 안 "NNNN-이름" 폴더만 */
export const countSpecs = (names: string[]): number => names.filter((n) => /^\d{4}-/.test(n)).length;

/** 보호 규칙 수 — protected.txt 의 빈 줄 · 주석(#)을 뺀 줄 */
export const countRules = (text: string): number => text.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length;

type Settings = { hooks?: Record<string, { hooks: { command: string }[] }[]> };

/** 훅 수 — .claude/settings.json 의 훅 명령이 부르는 scripts/<이름>.mjs 를 이름으로 겹침 없이 셈 (스크립트가 아니면 명령 그대로) */
export function countHookScripts(json: string): number {
  const s = JSON.parse(json) as Settings;
  const names = Object.values(s.hooks ?? {}).flatMap((list) => list.flatMap((m) => m.hooks.map((h) => /scripts\/([\w-]+)\.mjs/.exec(h.command)?.[1] ?? h.command)));
  return new Set(names).size;
}

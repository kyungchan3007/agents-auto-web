import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Metadata } from "next";
import { type HowCounts, HowPage } from "@/features/how/components/how-page";
import { ADMIN_URL } from "@/shared/site";

// 만드는 방식 (작업 0303) — 어드민 · 검색에 막음 · 숫자는 빌드 때 저장소에서 셈(못 세면 그 칸을 뺌 · 지어내지 않음)
export const metadata: Metadata = {
  title: "만드는 방식 · Flapfx",
  description: "사람 한 명과 AI 에이전트 팀이 이 사이트를 만드는 방식 — 역할 · 도구 · 규칙",
  alternates: { canonical: `${ADMIN_URL}/how` },
  robots: { index: false, follow: false },
};

/** 저장소 맨 위 (.agents 가 있는 곳) — 못 찾으면 null */
function repoRoot(): string | null {
  let d = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(d, ".agents"))) return d;
    d = dirname(d);
  }
  return null;
}

function safe<T>(f: () => T): T | null {
  try {
    return f();
  } catch {
    return null;
  }
}

function countRepo(): HowCounts {
  const root = repoRoot();
  if (!root) return { tasks: null, protectedRules: null, hooks: null };
  return {
    tasks: safe(() => readdirSync(join(root, ".agents/specs")).filter((n) => /^\d{4}-/.test(n)).length),
    protectedRules: safe(() => readFileSync(join(root, ".agents/protected.txt"), "utf8").split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length),
    hooks: safe(() => {
      const s = JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8")) as { hooks?: Record<string, { hooks: { command: string }[] }[]> };
      const scripts = new Set(Object.values(s.hooks ?? {}).flatMap((list) => list.flatMap((m) => m.hooks.map((h) => /scripts\/([\w-]+)\.mjs/.exec(h.command)?.[1] ?? h.command))));
      return scripts.size;
    }),
  };
}

export default function Page() {
  return <HowPage counts={countRepo()} />;
}

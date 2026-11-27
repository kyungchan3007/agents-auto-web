// 점검 화면 켜기 · 끄기 계산 (작업 0387) — 명령 만들기 · 지금 배포 버전 고르기 · 기록 파일 읽고 쓰기 글 · 실제 실행은 maintenance.mjs
export const PROD_WORKER = "agents-auto-web";
export const COMPAT_DATE = "2026-10-01";
export const PREV_FILE = ".tmp/maintenance-prev.txt";
export const DEPLOY_DIR = ".tmp/maintenance-deploy";

export type Args = { mode: "on" | "off"; name: string; yes: boolean; force: boolean; prod: boolean };

/** 명령줄 · 환경 변수 읽기 — 대상 이름은 --name 또는 MAINTENANCE_WORKER · 없으면 운영(agents-auto-web) */
export function parseArgs(argv: string[], env: Record<string, string | undefined> = {}): Args | { error: string } {
  const [mode, ...rest] = argv;
  if (mode !== "on" && mode !== "off") return { error: "사용법: maintenance.mjs on|off [--name <Worker 이름>] [--yes] [--force]" };
  let name = env.MAINTENANCE_WORKER || PROD_WORKER;
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === "--name") {
      const v = rest[i + 1];
      if (!v || v.startsWith("--")) return { error: "--name 뒤에 Worker 이름이 필요합니다" };
      name = v;
      i += 1;
    } else if (rest[i].startsWith("--name=")) name = rest[i].slice(7);
  }
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) return { error: `Worker 이름이 올바르지 않습니다: ${name}` };
  return { mode, name, yes: rest.includes("--yes") || rest.includes("-y"), force: rest.includes("--force"), prod: name === PROD_WORKER };
}

type Deployment = { id?: string; created_on?: string; versions?: { version_id?: string; percentage?: number }[] };

/** `wrangler deployments list --json` 에서 지금 배포된 버전 ID — 가장 늦게 만든 배포 · 여러 버전이 나눠 받으면 비율이 가장 큰 것 */
export function activeVersionId(deployments: unknown): string | null {
  if (!Array.isArray(deployments) || deployments.length === 0) return null;
  const latest = [...(deployments as Deployment[])].sort((a, b) => String(a.created_on ?? "").localeCompare(String(b.created_on ?? ""))).at(-1);
  const top = [...(latest?.versions ?? [])].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))[0];
  return top?.version_id ?? null;
}

export const listArgs = (name: string): string[] => ["deployments", "list", "--name", name, "--json"];

/** 설정 파일 없이 인자만으로 배포 — routes 를 주지 않아 붙은 도메인은 그대로 · 사이트 wrangler.jsonc 는 쓰지 않음 */
export const deployArgs = (name: string): string[] => ["deploy", "worker.ts", "--cwd", DEPLOY_DIR, "--name", name, "--compatibility-date", COMPAT_DATE];

export const rollbackArgs = (name: string, versionId: string | null): string[] => ["rollback", ...(versionId ? [versionId] : []), "--name", name, "--message", "점검 끝", "--yes"];

/** 기록 파일 — 첫 줄 버전 ID · 둘째 줄 Worker 이름 */
export const prevText = (versionId: string, name: string): string => `${versionId}\nworker=${name}\n`;

export function parsePrev(text: string): { versionId: string; name: string | null } | null {
  const [first, second] = text.split("\n").map((l) => l.trim());
  if (!first || !/^[0-9a-zA-Z-]+$/.test(first)) return null;
  return { versionId: first, name: second?.startsWith("worker=") ? second.slice(7) : null };
}

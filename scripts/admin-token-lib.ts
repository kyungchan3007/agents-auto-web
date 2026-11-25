// 관리 명령(scripts/admin-token.mjs)의 순수 부분 — 토큰 만들기 · 해시 · 목록 고치기 (작업 0326)
//   node: 가져오기 없이 Web Crypto 만 · 토큰 원문은 새 링크로 한 번 출력할 뿐 — 목록(로컬 · 비밀값)에는 해시만
//   Worker(apps/admin/worker/gate/token.ts)의 parseTokens · matchToken 이 그대로 읽는 모양

export const OWNER = "owner";
export type TokenEntry = { hash: string; exp?: string };
export type TokenList = Record<string, TokenEntry>;

const NAME = /^[a-z0-9][a-z0-9-]{0,62}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 32바이트 무작위 → base64url 43자 */
export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 소문자 16진수 64자 — Worker 의 sha256Hex 와 같은 값 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function realDate(text: string): boolean {
  if (!DATE.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

/** 리뷰어 링크 기본 기한(작업 0330) — 발급일 + 7일 (안내 창 "유효 기간은 발급일로부터 7일입니다" 와 맞춤) */
export const DEFAULT_EXP_DAYS = 7;

/** add 에 넣을 기한 — --exp 를 주면 그대로 · 안 주면 today + 7일 · owner 는 기한 없음 */
export function expFor(name: string, exp: string | undefined, today: string): string | undefined {
  if (exp !== undefined || name === OWNER) return exp;
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + DEFAULT_EXP_DAYS);
  return d.toISOString().slice(0, 10);
}

/** 새 목록 — 이미 있는 리뷰어 이름은 던짐(다른 토큰을 조용히 무효로 만들지 않음) · owner 는 다시 만들 수 있음(해시가 바뀌어 예전 링크 · 쿠키 무효) · owner 에 기한은 못 줌 */
export function addEntry(list: TokenList, name: string, hash: string, exp?: string): TokenList {
  if (!NAME.test(name)) throw new Error("이름은 영문 소문자 · 숫자 · 하이픈 63자 이하여야 합니다 (하이픈으로 시작 불가)");
  if (!HEX64.test(hash)) throw new Error("해시 모양이 올바르지 않습니다");
  if (exp !== undefined && !realDate(exp)) throw new Error("기한은 실제 날짜 YYYY-MM-DD 여야 합니다");
  if (name === OWNER && exp !== undefined) throw new Error("owner 에는 기한을 줄 수 없습니다");
  if (name !== OWNER && Object.hasOwn(list, name)) throw new Error(`이미 있는 이름입니다: ${name}`);
  return { ...list, [name]: exp === undefined ? { hash } : { hash, exp } };
}

/** 새 목록 — owner · 없는 이름은 던짐 */
export function removeEntry(list: TokenList, name: string): TokenList {
  if (name === OWNER) throw new Error("owner 는 지울 수 없습니다 (본인이 잠기지 않게). 다시 만들려면 add owner");
  if (!Object.hasOwn(list, name)) throw new Error(`없는 이름입니다: ${name}`);
  const next = { ...list };
  delete next[name];
  return next;
}

/** 이름 글자순 · 해시 · 토큰은 싣지 않음 · exp 날까지 유효 */
export function listRows(list: TokenList, today: string): { name: string; exp: string | null; status: "유효" | "기한 지남"; owner: boolean }[] {
  return Object.keys(list)
    .sort()
    .map((name) => {
      const exp = list[name]?.exp ?? null;
      return { name, exp, status: exp !== null && exp < today ? ("기한 지남" as const) : ("유효" as const), owner: name === OWNER };
    });
}

export const linkFor = (token: string, base = "https://admin.flapfx.com"): string => `${base}/?t=${token}`;

/** wrangler secret put ADMIN_TOKENS 로 올릴 JSON */
export const secretPayload = (list: TokenList): string => JSON.stringify(list);

// ── 비밀값 넣기 실패 안내 (작업 0329) — Workers Builds 가 새 버전을 올리기만 해서 최신 버전이 운영에 배포되지 않으면 wrangler secret put 이 실패함
export type SecretFailure = "not-deployed" | "other";

/** wrangler 오류 글 → 종류 · 배포 문구 여러 표현을 넓게 봄(대소문자 무시) · wrangler 업데이트 안내의 "latest version" 만으로는 아님 */
export function secretPutFailure(output: string): SecretFailure {
  const text = output.toLowerCase();
  if (/code:\s*10215|\b10215\b/.test(text) || /gradual deployment/.test(text) || /(isn'?t|is not|not)\s+(currently\s+|fully\s+)?deployed/.test(text)) return "not-deployed";
  return "other";
}

/** 한국어 안내 — 이유 + 해결 두 가지 · 버전을 모르면 <버전> 자리표시 */
export function notDeployedHelp(opts: { config: string; versionId?: string }): string {
  const deploy = `wrangler versions deploy ${opts.versionId ?? "<버전>"} --config ${opts.config}`;
  return [
    "이유: 이 Worker 의 최신 버전이 운영에 배포되지 않은 상태(미리보기로만 올라감)라서 비밀값을 넣지 못했습니다.",
    "해결 (둘 중 하나):",
    `  1. 최신 버전을 운영에 배포한 뒤 이 명령을 다시 실행합니다. 배포: Cloudflare 대시보드의 Workers > 배포 에서, 또는 \`${deploy}\``,
    "  2. 명령에 --versions 를 붙이면 새 버전에 비밀값을 넣습니다(배포는 하지 않음). 그 뒤 위 방법으로 그 버전을 배포해야 적용됩니다.",
  ].join("\n");
}

/** 실패 한 줄 — 다른 오류는 출력 끝 세 줄 · 배포되지 않음은 한국어 안내(출력 글은 되비치지 않음) */
export function wranglerFailureText(args: string[], output: string, config: string): string {
  const head = `wrangler ${args.slice(0, 3).join(" ")} 실패`;
  if (secretPutFailure(output) === "not-deployed") return `${head} — 최신 버전이 배포되지 않았습니다\n${notDeployedHelp({ config })}`;
  return `${head} — ${output.trim().split("\n").slice(-3).join(" ")}`;
}

/** 기본은 secret put · versions 면 versions secret put (새 버전만 만들고 배포하지 않음) */
export const secretPutArgs = (name: string, config: string, opts: { versions: boolean }): string[] =>
  opts.versions ? ["versions", "secret", "put", name, "--config", config] : ["secret", "put", name, "--config", config];

/** --versions 로 넣은 뒤 안내 */
export const versionsPutNotice = (config: string): string =>
  `새 버전에 비밀값을 넣었습니다. 아직 배포하지 않았으니 적용하려면 그 버전을 배포하세요: wrangler versions deploy <버전> --config ${config} (또는 Cloudflare 대시보드의 Workers > 배포)`;

/** 명령 인자에 정확히 --versions 가 있으면 true */
export const hasVersionsFlag = (argv: string[]): boolean => argv.includes("--versions");

// ── 미리보기 버전 점검 (작업 0367) — Workers Builds 가 푸시마다 새 버전만 올려 "최신 버전 ≠ 운영 배포 버전" 이어도
//   코드가 같으면 한 번의 명령으로 끝낸다: versions secret put → 그 새 버전 하나만 100% 배포. 코드가 다르거나 판정할 수 없으면 비밀값을 넣지 않고 멈춘다(운영 코드가 바뀌는 배포는 하지 않음).
//   wrangler 4.x 의 JSON 모양 (node_modules/wrangler 소스로 확인 · 작업 0367 plan "정한 것")
//     versions list --json                → [{ id, metadata: { created_on }, … }] (오래된 것부터 정렬해 마지막이 최신)
//     versions deployments list --json    → [{ created_on, versions: [{ version_id, percentage }] }] (마지막이 지금 배포)
//     versions view <id> --json           → { id, resources: { script: { etag }, bindings: [{ type, name }] } } — etag = 스크립트 내용 해시 · type "secret_text" 의 name = 비밀값 이름(값은 오지 않음)
export type VersionFacts = { etag: string | null; secrets: string[] };
export type Preflight = { action: "direct" } | { action: "versions" } | { action: "stop"; reason: string };

/** wrangler JSON 출력 → 값 · 앞뒤에 다른 글이 섞여도 첫 [ 또는 { 부터 읽음 · 못 읽으면 null */
export function parseJson(text: string): unknown {
  const at = text.search(/[[{]/);
  if (at < 0) return null;
  try {
    return JSON.parse(text.slice(at));
  } catch {
    return null;
  }
}

const rec = (v: unknown): Record<string, unknown> | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** 최신 버전 id — 만든 때(metadata.created_on)가 가장 늦은 것 · 목록이 비었거나 모양이 다르면 null */
export function latestVersionId(listJson: unknown): string | null {
  if (!Array.isArray(listJson)) return null;
  const rows = listJson.flatMap((v) => {
    const r = rec(v);
    const created = rec(r?.metadata)?.created_on;
    return typeof r?.id === "string" && typeof created === "string" ? [{ id: r.id, created }] : [];
  });
  if (rows.length === 0) return null;
  return rows.reduce((a, b) => (b.created > a.created ? b : a)).id;
}

/** 지금 운영 배포 버전 id — 가장 최근 배포가 버전 하나 100% 일 때만 · 점진 배포(둘 이상 · 100% 아님) · 모양이 다르면 null */
export function productionVersionId(deploymentsJson: unknown): string | null {
  if (!Array.isArray(deploymentsJson) || deploymentsJson.length === 0) return null;
  const rows = deploymentsJson.flatMap((d) => {
    const r = rec(d);
    return r && typeof r.created_on === "string" && Array.isArray(r.versions) ? [{ created: r.created_on, versions: r.versions as unknown[] }] : [];
  });
  if (rows.length === 0) return null;
  const last = rows.reduce((a, b) => (b.created > a.created ? b : a));
  if (last.versions.length !== 1) return null;
  const v = rec(last.versions[0]);
  return typeof v?.version_id === "string" && v.percentage === 100 ? v.version_id : null;
}

/** 버전 상세 → 스크립트 내용 해시(etag) · 비밀값 이름(글자순 · 값은 읽지 않음) · 모양이 다르면 null */
export function versionFacts(viewJson: unknown): VersionFacts | null {
  const r = rec(viewJson);
  const res = rec(r?.resources);
  if (!res) return null;
  const etag = rec(res.script)?.etag;
  const bindings = Array.isArray(res.bindings) ? res.bindings : [];
  const secrets = bindings.flatMap((b) => {
    const x = rec(b);
    return x?.type === "secret_text" && typeof x.name === "string" ? [x.name] : [];
  });
  return { etag: typeof etag === "string" && etag !== "" ? etag : null, secrets: [...new Set(secrets)].sort() };
}

const sameList = (a: string[], b: string[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

/** 최신 버전 vs 운영 배포 버전 → 할 일 · 같은 버전이면 그냥 secret put · 코드(etag)와 비밀값 이름이 같으면 versions 경로 · 그 밖에는 모두 멈춤(가정으로 배포하지 않음) */
export function judgePreflight(p: { latestId: string | null; prodId: string | null; latest: VersionFacts | null; prod: VersionFacts | null }): Preflight {
  if (p.latestId === null) return { action: "stop", reason: "최신 버전을 찾지 못했습니다" };
  if (p.prodId === null) return { action: "stop", reason: "운영 배포가 버전 하나 100% 가 아닙니다(점진 배포 중이거나 읽지 못함)" };
  if (p.latestId === p.prodId) return { action: "direct" };
  if (!p.latest || !p.prod) return { action: "stop", reason: "버전 정보를 읽지 못했습니다" };
  if (p.latest.etag === null || p.prod.etag === null) return { action: "stop", reason: "코드가 같은지 판정할 값(내용 해시)이 없습니다" };
  if (p.latest.etag !== p.prod.etag) return { action: "stop", reason: "최신 미리보기 버전의 코드가 운영 배포 버전과 다릅니다" };
  if (!sameList(p.latest.secrets, p.prod.secrets)) return { action: "stop", reason: "최신 버전의 비밀값 이름이 운영 배포 버전과 다릅니다" };
  return { action: "versions" };
}

/** versions secret put 으로 만든 새 버전을 배포해도 되는가 — 코드가 운영과 같고 운영의 비밀값 이름이 모두 남아 있을 때만 */
export function judgeNewVersion(prod: VersionFacts | null, created: VersionFacts | null): boolean {
  if (!prod || !created || prod.etag === null || prod.etag !== created.etag) return false;
  return prod.secrets.every((s) => created.secrets.includes(s));
}

/** 멈춤 안내 — 이유 + 할 일(운영 반영 뒤 다시 실행 · 대시보드 배포) · 비밀값은 넣지 않았음 */
export function preflightStopHelp(reason: string, config: string): string {
  return [
    `멈춥니다: ${reason}. 비밀값은 넣지 않았습니다.`,
    "할 일 (둘 중 하나):",
    "  1. 운영 반영(main)이 끝나 최신 버전이 운영에 배포된 뒤 이 명령을 다시 실행합니다.",
    `  2. Cloudflare 대시보드의 Workers > 배포 에서 원하는 버전을 직접 배포한 뒤 다시 실행합니다 (설정: ${config}).`,
  ].join("\n");
}

const withConfig = (args: string[], config: string): string[] => [...args, "--config", config];
export const listVersionsArgs = (config: string): string[] => withConfig(["versions", "list", "--json"], config);
export const listDeploymentsArgs = (config: string): string[] => withConfig(["versions", "deployments", "list", "--json"], config);
export const viewVersionArgs = (id: string, config: string): string[] => withConfig(["versions", "view", id, "--json"], config);
/** 그 버전 하나만 100% — 다른 버전은 섞지 않음 */
export const deployVersionArgs = (id: string, config: string): string[] => withConfig(["versions", "deploy", `${id}@100%`, "--yes"], config);

/** 점검을 거칠 명령인가 — 수동 경로(--versions)는 점검 없이 예전 그대로 */
export const needsPreflight = (cmd: string | undefined, versions: boolean): boolean => !versions && (cmd === "add" || cmd === "remove" || cmd === "init");

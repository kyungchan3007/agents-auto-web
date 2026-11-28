// 어드민 입구 판정 — 모든 요청 앞에서 (작업 0326)
//   결과: 막거나 · 바로 응답(로그인 · 로그아웃 · /session)하거나 · 통과(로그인한 토큰 이름)
import { COMPANY_HOME, sendsToCompanyHome } from "./owner-only";
import { invalidPage, blockedPage } from "./pages";
import { COOKIE_NAME, OWNER_NAME, clearCookie, maxAgeFor, sessionCookie, signSession, verifySession } from "./session";
import { type TokenList, matchToken, parseTokens } from "./token";

export type GateEnv = { ADMIN_TOKENS?: string; ADMIN_SESSION_SECRET?: string; ADMIN_API_KEY?: string };
export type GateResult = { response: Response } | { response?: undefined; name: string };

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

function readCookie(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

/** ?t 를 지운 같은 주소 (다른 쿼리는 남김) — 회사 세션이고 첫 화면(/) 이나 막힌 화면이면 /geo (작업 0403 · 쿠키는 심은 뒤) */
function landing(url: URL, name: string): string {
  if (name !== OWNER_NAME && sendsToCompanyHome(url.pathname)) return `${url.origin}${COMPANY_HOME}`;
  const next = new URL(url);
  next.searchParams.delete("t");
  return next.href;
}

async function grant(name: string, list: TokenList, secret: string, location: string, onGranted: (name: string) => void): Promise<Response> {
  const entry = list[name];
  if (!entry) return invalidPage();
  const maxAge = maxAgeFor(name);
  const value = await signSession(name, entry.hash, Math.floor(Date.now() / 1000) + maxAge, secret);
  onGranted(name);
  return new Response(null, { status: 303, headers: { location, "set-cookie": sessionCookie(value, maxAge), "cache-control": "no-store" } });
}

async function readLoginToken(request: Request): Promise<string> {
  try {
    if (!(request.headers.get("content-type") ?? "").includes("application/x-www-form-urlencoded")) return "";
    return new URLSearchParams(await request.text()).get("token") ?? "";
  } catch {
    return "";
  }
}

/** onGranted — 쿠키를 심은 뒤 알리는 쪽(owner 는 호출하지 않음 · 작업 0403 부터 Worker 는 쓰지 않음 — 접속 기록을 남기지 않음) */
export async function runGate(request: Request, url: URL, env: GateEnv, onGranted: (name: string) => void = () => undefined): Promise<GateResult> {
  const list = parseTokens(env.ADMIN_TOKENS);
  const secret = env.ADMIN_SESSION_SECRET ?? "";
  // 목록 · 서명 열쇠 중 하나라도 없으면 아무도 못 들어옴(닫힌 쪽)
  const ready = secret !== "" && Object.keys(list).length > 0;
  const record = (name: string) => {
    if (name !== OWNER_NAME) onGranted(name);
  };

  if (url.pathname === "/logout") {
    return { response: new Response(null, { status: 303, headers: { location: `${url.origin}/`, "set-cookie": clearCookie(), "cache-control": "no-store" } }) };
  }

  if (url.pathname === "/login" && request.method === "POST") {
    const match = ready ? await matchToken(list, await readLoginToken(request), new Date()) : null;
    return { response: match ? await grant(match.name, list, secret, `${url.origin}/`, record) : invalidPage() };
  }

  if (url.searchParams.has("t")) {
    const match = ready ? await matchToken(list, url.searchParams.get("t") ?? "", new Date()) : null;
    return { response: match ? await grant(match.name, list, secret, landing(url, match.name), record) : invalidPage() };
  }

  const cookie = readCookie(request.headers.get("cookie"), COOKIE_NAME);
  const session = ready && cookie ? await verifySession(cookie, list, secret, Math.floor(Date.now() / 1000)) : null;
  const api = url.pathname === "/bff" || url.pathname.startsWith("/bff/") || url.pathname === "/session";
  if (!session) {
    if (api) return { response: json({ error: "로그인이 필요합니다" }, 401) };
    return { response: cookie ? invalidPage() : blockedPage() };
  }
  if (url.pathname === "/session") return { response: json({ name: session.name }, 200) };
  return { name: session.name };
}

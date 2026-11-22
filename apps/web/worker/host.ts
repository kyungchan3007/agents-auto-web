// 주소(host)로 나누기 (작업 0302) — 같은 Worker · 같은 빌드에 어드민 주소(admin.flapfx.com)를 더함
//   flapfx.com · www 의 /log · /geo → 어드민 같은 경로로 301
//   admin.flapfx.com: robots 는 전부 막음 · / → /log · /log · /geo · /bff/* 는 검색에 막고 제공 · 그 밖은 flapfx.com 으로 301
//   그 밖의 host(미리보기 workers.dev · 로컬)는 손대지 않음
export const PUBLIC_HOSTS = ["flapfx.com", "www.flapfx.com"] as const;
export const ADMIN_HOST = "admin.flapfx.com";
export const ADMIN_PAGES = ["/log", "/geo"] as const;
export const ADMIN_ROBOTS = "User-agent: *\nDisallow: /\n";
export const NOINDEX = "noindex, nofollow";

export type HostRoute =
  | { kind: "redirect"; location: string; status: 301 | 302 }
  | { kind: "robots" }
  | { kind: "admin" }
  | { kind: "pass" };

const under = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);
const isAdminPage = (pathname: string) => ADMIN_PAGES.some((p) => under(pathname, p));

export function hostRoute(url: URL): HostRoute {
  const host = url.hostname;
  const rest = `${url.pathname}${url.search}`;
  if ((PUBLIC_HOSTS as readonly string[]).includes(host)) {
    return isAdminPage(url.pathname) ? { kind: "redirect", location: `https://${ADMIN_HOST}${rest}`, status: 301 } : { kind: "pass" };
  }
  if (host !== ADMIN_HOST) return { kind: "pass" };
  if (url.pathname === "/robots.txt") return { kind: "robots" };
  if (url.pathname === "/") return { kind: "redirect", location: `https://${ADMIN_HOST}/log${url.search}`, status: 302 };
  if (isAdminPage(url.pathname) || under(url.pathname, "/bff")) return { kind: "admin" };
  return { kind: "redirect", location: `https://${PUBLIC_HOSTS[0]}${rest}`, status: 301 };
}

/** 응답에 검색 막음 머리글을 더한 새 응답 (원래 응답의 머리글은 바꿀 수 없을 수 있어 복사) */
export function withNoindex(res: Response): Response {
  const out = new Response(res.body, res);
  out.headers.set("X-Robots-Tag", NOINDEX);
  return out;
}

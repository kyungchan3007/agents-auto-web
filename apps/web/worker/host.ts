// 주소(host)로 나누기 (작업 0302 · 0312) — 어드민은 따로 배포(apps/admin · admin.flapfx.com)
//   flapfx.com · www 의 옛 어드민 경로(/log · /geo · /how · /marketing) → 어드민 같은 경로로 301 (검색 기록 · 북마크 보존)
//   그 밖의 주소 · host(미리보기 workers.dev · 로컬)는 손대지 않음
import { ADMIN_HOST, ADMIN_PATHS, PUBLIC_HOSTS } from "@hav/shared/site";

export type HostRoute = { kind: "redirect"; location: string; status: 301 } | { kind: "pass" };

const under = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export function hostRoute(url: URL): HostRoute {
  if (!(PUBLIC_HOSTS as readonly string[]).includes(url.hostname)) return { kind: "pass" };
  if (!ADMIN_PATHS.some((p) => under(url.pathname, p))) return { kind: "pass" };
  return { kind: "redirect", location: `https://${ADMIN_HOST}${url.pathname}${url.search}`, status: 301 };
}

// 어드민 주소(host)로 나누기 (작업 0302 · 0312 에 운영 Worker 에서 옮김)
//   admin.flapfx.com: robots 는 전부 막음 · / → /log · 어드민 화면 · /bff/* 는 제공 · 그 밖은 flapfx.com 같은 주소로 301
//   그 밖의 host(미리보기 workers.dev · 로컬): robots 막음 · / → /log · 나머지는 제공 (첫 화면이 없어서 / 는 작업실로)
import { isBff } from "@hav/edge/bff";
import { ADMIN_HOST, ADMIN_PATHS, PUBLIC_HOSTS } from "@hav/shared/site";

export type HostRoute =
  | { kind: "redirect"; location: string; status: 301 | 302 }
  | { kind: "robots" }
  | { kind: "serve" };

const under = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);
const isAdminPage = (pathname: string) => ADMIN_PATHS.some((p) => under(pathname, p));
/** 정적 내보내기가 만든 자산(스크립트 · 글꼴 · 아이콘) — 어드민 화면이 불러야 하므로 운영 주소로 넘기지 않음 */
const ASSET_FILES = ["/favicon.ico", "/icon.svg", "/404.html"];
const isAsset = (pathname: string) => pathname.startsWith("/_next/") || ASSET_FILES.includes(pathname);

export function hostRoute(url: URL): HostRoute {
  if (url.pathname === "/robots.txt") return { kind: "robots" };
  if (url.pathname === "/") return { kind: "redirect", location: `${url.origin}/log${url.search}`, status: 302 };
  if (url.hostname !== ADMIN_HOST) return { kind: "serve" };
  if (isAdminPage(url.pathname) || isBff(url.pathname) || isAsset(url.pathname)) return { kind: "serve" };
  return { kind: "redirect", location: `https://${PUBLIC_HOSTS[0]}${url.pathname}${url.search}`, status: 301 };
}

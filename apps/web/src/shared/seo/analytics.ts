// GA4 측정 태그 판정 (작업 0322) — 운영 주소(flapfx.com · www.flapfx.com)에서만 · 정확히 같을 때만 · 순수 함수
const PROD_HOSTS: readonly string[] = ["flapfx.com", "www.flapfx.com"];

export const analyticsEnabled = (hostname: string): boolean => PROD_HOSTS.includes(hostname);

/** gtag.js 주소 */
export const gtagSrc = (id: string) => `https://www.googletagmanager.com/gtag/js?id=${id}`;

/** 처음 설정 글 — dataLayer · gtag 를 만들고 측정 ID 를 설정 (page_view 는 설정에서 자동으로 보냄) */
export const gtagInit = (id: string) => `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;

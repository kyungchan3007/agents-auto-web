// 작업 0359 — 버튼 클릭 이벤트 e2e 도우미: 운영 주소(flapfx.com) 흉내 · 보낸 gtag 이벤트 모으기
//   방법(보고에 적음): Chrome 에 --host-resolver-rules="MAP flapfx.com 127.0.0.1" 을 주어 http://flapfx.com:<포트>/ 로 열면 location.hostname 이 정확히 'flapfx.com' 이라 analyticsEnabled 가 true.
//   그 주소에서는 GA4 초기 글(gtagInit)이 window.gtag 를 만들어 dataLayer 에 쌓음 — gtag.js 자체(googletagmanager.com)는 막아 실제 전송은 없음.
//   이벤트는 dataLayer.push 를 가로채 sessionStorage 에 모음(링크를 눌러 페이지가 바뀌어도 남음) — 같은 출처 안에서.
import { type BrowserContext, type Page, expect } from "@playwright/test";

/** test.use({ launchOptions: PROD_LAUNCH }) */
export const PROD_LAUNCH = { args: ["--host-resolver-rules=MAP flapfx.com 127.0.0.1"] };

export type Sent = [string, string, Record<string, unknown>?];

/** 운영 주소로 바꾼 전체 주소 — baseURL 의 포트를 그대로 씀 */
export const prodUrl = (baseURL: string | undefined, path: string) => `http://flapfx.com:${new URL(baseURL ?? "http://127.0.0.1:4399").port}${path}`;

/** 운영 흉내 문맥 준비: 소개 화면 끄기 · 이벤트 모으기 · gtag.js 막기 */
export async function recordProd(ctx: BrowserContext) {
  await ctx.addInitScript(() => {
    localStorage.setItem("flapfx:intro-off", "1");
    const dl: unknown[] = [];
    (window as unknown as { dataLayer: unknown[] }).dataLayer = dl;
    const push = dl.push.bind(dl);
    dl.push = (...a: unknown[]) => {
      try {
        const e = Array.from((a[0] ?? []) as ArrayLike<unknown>);
        if (e[0] === "event") sessionStorage.setItem("__ev", JSON.stringify([...JSON.parse(sessionStorage.getItem("__ev") ?? "[]"), e]));
      } catch {}
      return push(...a);
    };
  });
  await ctx.route(/googletagmanager\.com/, (r) => r.abort());
}

/** 미리보기(지금 주소 127.0.0.1) 문맥 준비: 누가 window.gtag 를 부르면 기록 — 불리면 안 됨 */
export async function recordPreview(ctx: BrowserContext) {
  await ctx.addInitScript(() => {
    localStorage.setItem("flapfx:intro-off", "1");
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag = (...a: unknown[]) => sessionStorage.setItem("__ev", JSON.stringify([...JSON.parse(sessionStorage.getItem("__ev") ?? "[]"), a]));
  });
}

/** 지금까지 보낸 이벤트(시간순) — 'event' 줄만 */
export const sent = async (page: Page): Promise<Sent[]> => (await page.evaluate(() => JSON.parse(sessionStorage.getItem("__ev") ?? "[]"))) as Sent[];
export const names = async (page: Page) => (await sent(page)).map((e) => e[1]);

/** 개인정보 없음: 매개변수는 currency · country 키만 · 값은 영문 대문자 세 글자 */
export function expectClean(events: Sent[]) {
  for (const e of events) {
    for (const [k, v] of Object.entries(e[2] ?? {})) {
      expect(["currency", "country"].includes(k), `매개변수 키 ${k}`).toBe(true);
      expect(String(v), `${k} 값`).toMatch(/^[A-Z]{3}$/);
    }
  }
}

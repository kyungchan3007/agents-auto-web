// 어드민 입구 화면 — ① 막는 화면 · ③ 사용할 수 없는 링크 (작업 0326 · 시안 .tmp/mock-admin-gate/index.html)
//   Worker 가 HTML 을 직접 돌려줌(정적 파일도 막혀 있으므로) · 받은 값을 화면에 되비치지 않음 · 검색 막음 메타
import { NOINDEX } from "@hav/edge/noindex";
import { PUBLIC_HOSTS } from "@hav/shared/site";

const PUBLIC_URL = `https://${PUBLIC_HOSTS[0]}`;

const STYLE = `
:root{--bg:#f6f7f9;--panel:#fff;--ink:#161b26;--sub:#4a5263;--mute:#616979;--line:rgba(22,27,38,.09);--line2:rgba(22,27,38,.14);--blue:#2438a8;--bad:#b42318;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--bg);color:var(--ink);font:14px/1.55 "IBM Plex Sans KR",system-ui,sans-serif;word-break:keep-all}
.card{width:100%;max-width:380px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:28px 28px 24px}
.brand{display:flex;align-items:baseline;gap:8px;margin-bottom:22px}
.brand b{font-weight:700;font-size:20px;letter-spacing:-.04em;color:var(--blue);line-height:1}
.brand span{font-size:12px;color:var(--mute)}
h1{font-size:20px;font-weight:600;margin:0 0 6px;letter-spacing:-.01em}
.lede{color:var(--sub);margin:0 0 20px}
.msg{font-size:12px;margin:0 0 8px;color:var(--bad)}
.btn{display:grid;place-items:center;width:100%;height:42px;border-radius:8px;border:0;background:var(--blue);color:#fff;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
.btn.ghost{background:#fff;color:var(--sub);border:1px solid var(--line2);margin-top:8px}
details{margin-top:18px;padding-top:14px;border-top:1px solid var(--line);font-size:12px;color:var(--mute)}
summary{cursor:pointer}
form{margin-top:12px}
input{width:100%;height:42px;border-radius:8px;border:1px solid var(--line2);padding:0 12px;font:13px var(--mono);color:var(--ink);background:#fff}
`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">`;

const page = (title: string, body: string) =>
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="${NOINDEX}"><title>${title}</title>${FONTS}<style>${STYLE}</style></head><body><main class="card"><div class="brand"><b>Flapfx</b><span>어드민</span></div>${body}</main></body></html>`;

const PUBLIC_LINK = `<a class="btn" href="${PUBLIC_URL}/">공개 화면 보기 · ${PUBLIC_HOSTS[0]}</a>`;

const BLOCKED = page(
  "어드민 입구",
  `<h1>전용 링크로만 들어올 수 있습니다</h1><p class="lede">에이전트 팀이 사이트를 만드는 과정과 측정 결과를 보여 주는 내부 화면입니다. 받으신 링크를 다시 눌러 주세요.</p>${PUBLIC_LINK}<details><summary>링크 대신 토큰이 있으신가요?</summary><form action="/login" method="post"><input type="password" name="token" autocomplete="off" placeholder="토큰" aria-label="토큰"><button class="btn ghost" type="submit">들어가기</button></form></details>`,
);

const INVALID = page(
  "사용할 수 없는 링크",
  `<p class="msg">● 사용할 수 없는 링크</p><h1>이 링크는 더 이상 쓸 수 없습니다</h1><p class="lede">맞지 않거나 사용 기간이 끝난 링크입니다. 링크를 받으신 곳에서 다시 확인해 주세요.</p>${PUBLIC_LINK}`,
);

const htmlResponse = (html: string) => new Response(html, { status: 401, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

/** ① 쿠키도 토큰도 없음 */
export const blockedPage = () => htmlResponse(BLOCKED);
/** ③ 틀림 · 지움 · 기한 지남 · 쿠키 무효 — 어느 경우든 같은 본문 */
export const invalidPage = () => htmlResponse(INVALID);

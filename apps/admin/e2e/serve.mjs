// e2e 용 정적 서버 — 빌드 결과(out)를 Cloudflare Pages 처럼 냄: /currencies/USD → USD.html · 폴더 → index.html (작업 0101)
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const ROOT = new URL("../out/", import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4397);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json" };

// _headers — Cloudflare Pages 와 같게 응답 머리글을 더함 (예: /opengraph-image 는 확장자가 없어 Content-Type: image/png 를 여기서 알려 줌 · 작업 0175)
//   형식: 줄 맨 앞(들여쓰기 없음)의 경로 · 그 아래 들여쓴 "이름: 값" 줄들 · # 은 설명 · 경로의 * 는 아무 글자(splat)
function loadHeaders() {
  const file = [join(ROOT, "_headers"), new URL("../public/_headers", import.meta.url).pathname].find((f) => existsSync(f));
  if (!file) return [];
  const rules = [];
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      const pattern = raw.trim();
      rules.push({ re: new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}/?$`), headers: {} });
    } else if (rules.length) {
      const i = raw.indexOf(":");
      if (i > 0) rules.at(-1).headers[raw.slice(0, i).trim().toLowerCase()] = raw.slice(i + 1).trim();
    }
  }
  return rules;
}
const RULES = loadHeaders();
const headersFor = (urlPath) => Object.assign({}, ...RULES.filter((r) => r.re.test(urlPath.split("?")[0])).map((r) => r.headers));

function resolve(urlPath) {
  const p = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  for (const c of [p, `${p}.html`, join(p, "index.html")]) {
    const f = join(ROOT, c);
    if (f.startsWith(ROOT) && existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
}

createServer((req, res) => {
  const f = resolve(req.url ?? "/");
  if (!f) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    createReadStream(join(ROOT, "404.html")).on("error", () => res.end("404")).pipe(res);
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(f)] ?? "application/octet-stream", ...headersFor(req.url ?? "/") }); // _headers 가 있으면 그 값이 먼저
  createReadStream(f).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log(`e2e 서버 http://127.0.0.1:${PORT}`));

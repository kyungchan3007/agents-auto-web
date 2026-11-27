// 빌드 끝에 부르는 자료 검사 (작업 0388) — 빌드가 실제로 받은 값(Next 의 받은 응답 저장 폴더 .next/cache/fetch-cache)을 읽어 판정 · 새로 받아 덮어 보지 않음(지금 API 기준일 한 줄만 읽어 비교)
//   node scripts/check-build-data.mjs   (apps/web 에서 · build 스크립트가 next build 뒤에 부름 · 순수 JS 라 Node 18 이상 어디서나 돎)
//   운영 빌드(Workers Builds main)에서 환율이 깨졌으면 코드 1 로 끝나 배포되지 않음 · 그 밖은 경고만
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hasPoints, hasSignals, fxSeen, isProductionBuild, judgeBuildData, liveDateOf, parseCacheFile, pickCached } from "./check-build-data-lib.mjs";

const CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".next", "cache", "fetch-cache");
// @hav/shared/api 의 DEFAULT_API 와 같은 주소(노드가 패키지 안의 .ts 를 직접 읽지 못해 여기 적음)
const API = (process.env.TRIPFX_API_URL ?? "https://tripfx-api.developfff.workers.dev").replace(/\/$/, "");

/** @returns {import("./check-build-data-lib.mjs").CacheEntry[]} */
function readEntries() {
  try {
    return readdirSync(CACHE_DIR).flatMap((name) => {
      const file = join(CACHE_DIR, name);
      const entry = parseCacheFile(readFileSync(file, "utf8"), statSync(file).mtimeMs);
      return entry ? [entry] : [];
    });
  } catch {
    return [];
  }
}

/** @returns {Promise<string | null>} */
async function liveDate() {
  try {
    const res = await fetch(`${API}/fx/latest`, { signal: AbortSignal.timeout(10_000) });
    return res.ok ? liveDateOf(await res.json()) : null;
  } catch {
    return null;
  }
}

const entries = readEntries();
const production = isProductionBuild(process.env);
const verdict = judgeBuildData(
  {
    fx: fxSeen(pickCached(entries, "/fx/latest")),
    signals: hasSignals(pickCached(entries, "/signal")),
    airFare: hasPoints(pickCached(entries, "/indicators/kosis-cpi:air-fare")),
    liveDate: await liveDate(),
    inspectable: entries.length > 0,
  },
  production,
);
for (const w of verdict.warnings) console.warn(`[빌드 자료 검사] ${production ? "주의 !!!" : "경고"}: ${w}`);
for (const f of verdict.failures) console.error(`[빌드 자료 검사] ${production ? "실패" : "경고(운영이 아니라 막지 않음)"}: ${f}`);
if (verdict.exitCode === 1) console.error("[빌드 자료 검사] 운영 빌드를 멈춥니다 — 예전 배포를 그대로 둡니다");
else if (verdict.failures.length === 0 && verdict.warnings.length === 0) console.log("[빌드 자료 검사] 통과");
process.exit(verdict.exitCode);

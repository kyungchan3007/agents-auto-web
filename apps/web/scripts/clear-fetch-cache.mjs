// 빌드 시작 때 API 응답 저장 폴더(.next/cache/fetch-cache)만 지움 (작업 0388) — next build 가 옛 응답(저장 기간 1년)을 다시 써서 사이트가 어제 환율로 만들어지는 것을 막음
//   node scripts/clear-fetch-cache.mjs   (apps/web 에서 · build 스크립트가 맨 앞에 부름)
//   .next/cache 의 다른 것(빌드 캐시)은 지우지 않음 · 폴더가 없으면 조용히 통과 · node 내장 fs 만 써서 Node 18 이상 어디서나 돎
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FETCH_CACHE = join(dirname(fileURLToPath(import.meta.url)), "..", ".next", "cache", "fetch-cache");

rmSync(FETCH_CACHE, { recursive: true, force: true });

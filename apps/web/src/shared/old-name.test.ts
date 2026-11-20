// 작업 0195 — 옛 사이트 이름 Tripfx 잔존 검사 (apps · packages · docs · README 의 추적 파일)
// 사이트 이름으로 쓰인 Tripfx/tripfx 는 0 이어야 함 — 빼는 것은 아래 목록에 이유와 함께 (새로 빼려면 이유를 적어야 통과)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../../..");
const BINARY = /\.(png|jpe?g|webp|gif|ico|woff2?|glb|gltf|bin|mp4|pdf)$/i;

/** 경로 앞부분으로 통째로 뺌 — 지난 기록 */
const SKIP_PREFIX: Record<string, string> = {
  ".agents/": "지난 작업 문서 · 기록(그때 이름 그대로 두는 지난 기록)",
  "apps/api/data/": "지난 측정 결과 파일(그때 이름 그대로)",
};

/** 파일째로 뺌 — 이유 필수 */
const SKIP_FILES: Record<string, string> = {
  "apps/web/src/shared/old-name.test.ts": "이 검사 파일 자신 (설명 글에 옛 이름을 적음)",
  "apps/api/src/features/geo/questions.ts": "1 · 2판 질문 문구(지난 기록을 그때 문구로 읽을 때 씀 · 2026-11-17 이전 Tripfx 시기)",
  "apps/api/src/features/geo/ask.test.ts": "위 지난 질문 문구와 판정 주소(옛 tripfx.pages.dev 는 우리 사이트가 아님)를 확인하는 테스트",
  "apps/api/src/features/geo/gsc.ts": "Search Console 속성 주소(옛 Pages 주소) — 새 주소 속성 등록은 사람이 정할 일이라 바꾸지 않음",
  "apps/api/src/features/geo/gsc.test.ts": "위 Search Console 자료(옛 주소)를 읽는 테스트",
  "apps/web/src/features/geo/lib/geo-view.ts": "질문 판 표시 '1판 · Tripfx' · '2판 · Tripfx' (지난 기록을 보여 주는 글)",
  "apps/web/src/features/geo/lib/geo-view.test.ts": "위 판 표시 · 지난 측정 기록 예시",
  "apps/web/src/features/geo/lib/geo-detail.test.ts": "위 판 표시 테스트",
  "apps/web/src/features/geo/components/rename-compare.tsx": "이름 바꾼 날 전후 비교 화면 — 'Tripfx → Flapfx' · 'Tripfx 시기' · 옛 속성 주소를 그대로 적는 글 (작업 0205)",
  "apps/web/src/features/geo/lib/rename-compare.ts": "이름 바꾼 날 전후 비교 계산 — Tripfx 시기 · Flapfx 시기 필드 이름과 설명 (작업 0205)",
  "apps/web/src/features/geo/lib/rename-compare.test.ts": "위 계산 테스트 — Tripfx 시기 브랜드 질문 예시",
  "packages/shared/src/contracts/geo.ts": "이름 바꾼 날 기준 상수 설명 주석 — Tripfx(tripfx.pages.dev) → Flapfx (작업 0205)",
  "docs/geo-measurement.md": "측정 기록 문서 — 지난 기록의 Tripfx 는 그때 이름 그대로 둔다고 문서 머리에 적음",
  "apps/api/src/db/schema.ts": "보호 파일(DB 스키마) 주석 — 승인 없이 바꾸지 않음",
  "apps/api/wrangler.jsonc": "보호 파일 — API Worker 이름 tripfx-api",
  "apps/web/wrangler.jsonc": "보호 파일 — 서비스 바인딩 tripfx-api · 옛 Pages 설정을 지웠다는 주석",
  "apps/web/src/shared/site-story.test.ts": "README 에 옛 주소 tripfx.pages.dev 가 없음을 확인하는 검사",
};

/** 줄 안에서 지우고 검사할 것 — API Worker 이름 · 환경 변수 · 서비스 계정 (사이트 이름이 아님) */
const API_TOKENS = [/tripfx-api(\.developfff\.workers\.dev)?/gi, /TRIPFX_API_URL/g, /tripfx-gsc/gi];
/** 날짜가 붙은 결정 기록 문단이 옛 주소를 그때 이름으로 적은 문서 — 옛 주소 tripfx.pages.dev 만 허용 */
const OLD_ADDRESS_DOCS = ["docs/architecture.md", "docs/project-facts.md"];

/** 한 줄에서 사이트 이름으로 남은 tripfx 가 있는가 */
export function leftoverIn(line: string, file = ""): boolean {
  let s = line;
  for (const t of API_TOKENS) s = s.replace(t, "");
  if (OLD_ADDRESS_DOCS.includes(file)) s = s.replace(/tripfx\.pages\.dev/gi, "");
  return /tripfx/i.test(s);
}

function trackedTextFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "-z", "--", "apps", "packages", "docs", "README.md"], { cwd: ROOT, encoding: "utf8" }); // -z: 한글 · 특수 문자 파일 이름을 따옴표 · 8진수 없이 그대로 받음 (작업 0240)
  return out.split("\0").filter((f) => f && !BINARY.test(f) && !Object.keys(SKIP_PREFIX).some((p) => f.startsWith(p)) && !(f in SKIP_FILES));
}

describe("옛 이름 Tripfx 잔존 검사", () => {
  it("apps · packages · docs · README 에 사이트 이름으로 쓰인 Tripfx/tripfx 가 0 (빼는 곳은 이유와 함께 위 목록)", () => {
    const left: string[] = [];
    for (const f of trackedTextFiles()) {
      readFileSync(join(ROOT, f), "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (leftoverIn(line, f)) left.push(`${f}:${i + 1} ${line.trim().slice(0, 90)}`);
        });
    }
    expect(left, `남은 Tripfx:\n${left.join("\n")}`).toEqual([]);
  });

  it("검사가 실제로 잡음 — 사이트 이름 Tripfx 는 걸리고 API 이름 tripfx-api 는 안 걸림", () => {
    expect(leftoverIn("# Tripfx 환율")).toBe(true);
    expect(leftoverIn("<title>tripfx</title>")).toBe(true);
    expect(leftoverIn('{ service: "tripfx-api" }')).toBe(false);
    expect(leftoverIn("const DEFAULT_API = 'https://tripfx-api.developfff.workers.dev'")).toBe(false);
    expect(leftoverIn("process.env.TRIPFX_API_URL")).toBe(false);
    expect(leftoverIn("옛 tripfx.pages.dev 는 삭제", "docs/architecture.md")).toBe(false);
    expect(leftoverIn("옛 tripfx.pages.dev 는 삭제", "README.md")).toBe(true);
  });

  it("빼는 파일은 모두 이유가 적혀 있고 실제로 있는 파일임", () => {
    for (const [f, why] of Object.entries(SKIP_FILES)) {
      expect(why.trim().length, f).toBeGreaterThan(5);
      expect(() => readFileSync(join(ROOT, f), "utf8"), f).not.toThrow();
    }
    for (const [p, why] of Object.entries(SKIP_PREFIX)) expect(why.trim().length, p).toBeGreaterThan(5);
  });
});

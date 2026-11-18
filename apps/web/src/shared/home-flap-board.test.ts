// 작업 0177 — 홈 첫 화면 출발 안내판 배치 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "출발 안내판 C안 사진에 걸치기로 가자" — 울트라마린 전체 띠(today-band) 삭제 → 판에만 울트라마린 · 사진에 반쯤 걸침 · 지구는 하늘 종이 위(배경 없이)
//
// builder 가 할 것 (prd B1~B9 · sdd)
//   features/home/components/today-board.tsx — export function TodayBoard({ rates, signals, windowDays, problem }) (today-band.tsx 는 지움)
//     <section id="today" aria-labelledby="today-title"> (data-surface · bg-surface 없음) 안에: 작은 제목(h2 id="today-title" · BOARD_TITLE) · <FlapBoard rows cols label/> · 판정 한 줄(evidence) · <GlobeLazy …지금과 같은 props/>
//     자료는 lib/today-board.ts 의 todayBoard({ found: cheapestDestination(…), hasRates, windowDays, problem }) 가 만든 값 그대로 (today-board.test.ts)
//     (옛 설명 — 사진에 걸치기 · 사진 아래 끝 막은 작업 0217 · 0222 에서 사진 머리와 함께 없어짐)
//     지구: 판 오른쪽(lg 이상 두 칸 격자 · 판이 먼저) · 모바일은 판 아래 작게(≤ 280px) · 지구 뒤에 배경 · 띠 · data-surface 없음
//   features/home/components/home.tsx — TodayBand 대신 TodayBoard
//   packages/ui three/objects/*.tsx · three/scene/*.tsx — 건드리지 않음 (지구 · 비행기 생김새 그대로)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const UI_SRC = resolve(WEB_SRC, "../../../packages/ui/src");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => codeOf(readFileSync(p, "utf8"));
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
const HOME_COMPONENTS = sources(join(WEB_SRC, "features/home/components"));
// 작업 0217: 서버 계산(today-board.tsx) + 탑승권 카드(ticket.tsx · 판 · 제목 · 판정 한 줄)
const board = () => ["today-board.tsx", "ticket.tsx"].map((f) => read(join(WEB_SRC, "features/home/components", f))).join("\n");
const sectionTag = (s: string) => /<section\b[^>]*id="today"[^>]*>|<section\b[^>]*>(?=[^<]*)/.exec(s.match(/<section\b[^>]*id="today"[^>]*>/)?.[0] ?? "")?.[0] ?? "";

describe("울트라마린 전체 띠 없음 (B1)", () => {
  it("today-band.tsx 가 없고 홈이 TodayBoard 를 씀 (TodayBand 이름이 홈 코드에 없음)", () => {
    expect(existsSync(join(WEB_SRC, "features/home/components/today-band.tsx"))).toBe(false);
    expect(existsSync(join(WEB_SRC, "features/home/components/today-board.tsx"))).toBe(true);
    const home = read(join(WEB_SRC, "features/home/components/home.tsx"));
    expect(home).toMatch(/\bTodayBoard\b/);
    for (const f of HOME_COMPONENTS) expect(read(f), f).not.toMatch(/\bTodayBand\b|today-band/);
  });

  it("id=\"today\" 가 한 번 · 그 구간에 data-surface · bg-surface · 울트라마린 바탕(bg-cheap · bg-[#2438A8])이 없음", () => {
    const ui = HOME_COMPONENTS.map(read).join("\n");
    expect(ui.match(/id="today"/g)?.length).toBe(1);
    const tag = board().match(/<section\b[^>]*id="today"[^>]*>/)?.[0] ?? "";
    expect(tag, "id=today 구간").not.toBe("");
    expect(tag).not.toMatch(/data-surface=/);
    expect(tag).not.toMatch(/\bbg-(surface|cheap|ink|\[#)/);
  });

  it("홈 화면 코드에 data-surface=\"dark\" · \"elevated\"(전체 띠)가 없음 — 울트라마린은 판(FlapBoard)에만", () => {
    // 작업 0217: 새 홈 첫 면(hero-section · 메뉴와 이어지는 파랑)만 data-surface="dark" — 탑승권 카드 · 나머지 구간은 아님
    for (const f of HOME_COMPONENTS.filter((x) => !x.endsWith("hero-section.tsx"))) expect(read(f), f).not.toMatch(/data-surface="(dark|elevated)"/);
    expect(board()).not.toMatch(/\bbg-cheap\b|\bbg-\[#2438a8\]/i);
  });
});

describe("구성 — 작은 제목 · 판 · 판정 한 줄 · 지구 (B3 · B4 · B6 · B7)", () => {
  it("자료는 todayBoard · cheapestDestination 에서 — 판 부품에 rows · cols · label 을 넘김", () => {
    const s = board();
    expect(s).toMatch(/from\s*"@hav\/ui\/data\/flap-board"/);
    expect(s).toMatch(/\btodayBoard\(/);
    expect(s).toMatch(/\bcheapestDestination\(/);
    const tag = /<FlapBoard\b[^>]*>/.exec(s)?.[0] ?? "";
    expect(tag, "<FlapBoard …>").not.toBe("");
    expect(tag).toMatch(/\brows=/);
    expect(tag).toMatch(/\bcols=/);
    expect(tag).toMatch(/\blabel=/);
  });

  it("작은 제목(h2 · id=today-title · BOARD_TITLE) · 구간이 그 제목으로 이름 붙음 (aria-labelledby) · 판정 한 줄(evidence)을 그림", () => {
    const s = board();
    expect(s).toMatch(/aria-labelledby="today-title"/);
    expect(s).toMatch(/<h2\b[^>]*id="today-title"|<SectionTitle\b[^>]*id="today-title"|<Eyebrow\b[^>]*id="today-title"/);
    expect(s).toMatch(/\bBOARD_TITLE\b|\.title\b/);
    expect(s).toMatch(/\.evidence\b|\bevidence\b/);
  });

  it("글 · 숫자를 코드에 박지 않음 — 예시 숫자(912 · 833 · 1,234.56) · '예측이 아닙니다' · FreshnessNote 없음", () => {
    const s = [board(), read(join(WEB_SRC, "features/home/lib/today-board.ts"))].join("\n");
    expect(s).not.toMatch(/\b912\b|\b833\b|1,234\.56|1,486|1,382/);
    expect(s).not.toMatch(/예측이 아닙니다|평일 12시|\bFreshnessNote\b/);
  });

  it("수출입은행 값이 없어 예비 출처(Frankfurter)를 쓸 때의 안내는 지금처럼 남음 (지어내지 않음 · 출처 숨기지 않음)", () => {
    expect(board()).toMatch(/frankfurter/);
    expect(board()).toMatch(/예비 출처/);
  });
});

describe("안내판을 하늘 종이 위에 놓음 (B2 · 작업 0177 수정: 걸치기 취소)", () => {
  it("판 묶음에 음수 위 여백(-mt-)이 없음 — 사진에 겹치지 않고 사진 아래 하늘 종이 위", () => {
    expect(board()).not.toMatch(/-mt-\d+|-mt-\[[^\]]+\]/);
  });

  it("홈에 사진 머리 · 사진 부품이 없음 (작업 0217 · 0222 — 부품 파일을 지움)", () => {
    for (const f of HOME_COMPONENTS) expect(read(f), f).not.toMatch(/\bPhotoHeader\b|\bPickedPhotoHeader\b/);
  });
});

describe("3D 지구 제거 · 비행기는 그대로 (작업 0177 수정)", () => {
  // 비행기 · 비행기 길 · 장면 코드는 그대로 — /flights 와 홈 그래프가 씀 (지구만 지움)
  const HASH: Record<string, string> = {
    "three/objects/plane.tsx": "3078d67e7503b99c822ef40b46d9c663938be6529cdcf13719574b7ad464ea8a",
    "three/objects/plane-route.tsx": "5ba9463304d795d2", // 앞 16자만 비교
    "three/scene/stage.tsx": "1cee7f2529c4a122",
  };
  for (const [file, expected] of Object.entries(HASH)) {
    it(`${file} 가 그대로`, () => {
      const sha = createHash("sha256").update(readFileSync(join(UI_SRC, file))).digest("hex");
      expect(sha.startsWith(expected)).toBe(true);
    });
  }

  it("홈에 3D 지구 · 둘레 원 · 지구 그림 파일이 없음 — GlobeLazy · SEOUL · EARTH_TEXTURE 를 쓰지 않음", () => {
    for (const f of HOME_COMPONENTS) expect(read(f), f).not.toMatch(/\bGlobeLazy\b|\bSEOUL\b|EARTH_TEXTURE/); // 작업 0217: 상태 점 · 막대 끝은 rounded-full 을 씀 (지구 둘레 원이 아님)
    expect(read(join(WEB_SRC, "features/home/lib/places.ts"))).not.toMatch(/SEOUL|EARTH_TEXTURE|earth-2048/);
  });

  it("쓰지 않는 지구 부품 · 계산 · 그림 파일을 남기지 않음 (globe.tsx · lib/geo.ts · textures/earth-2048.jpg · lazy 의 GlobeLazy)", () => {
    expect(existsSync(join(UI_SRC, "three/objects/globe.tsx"))).toBe(false);
    expect(existsSync(join(UI_SRC, "three/lib/geo.ts"))).toBe(false);
    expect(existsSync(join(WEB_SRC, "../public/textures/earth-2048.jpg"))).toBe(false);
    expect(read(join(UI_SRC, "three/scene/lazy.tsx"))).not.toMatch(/Globe/);
  });

  it("안내판은 하늘 종이 위 한 칸 — 두 칸 격자(lg:grid-cols-) · 지구 자리 없이 왼쪽 정렬", () => {
    expect(board()).not.toMatch(/lg:grid-cols-/);
    expect(board()).toMatch(/<FlapBoard\b/);
  });
});

describe("글꼴 · 색 규칙 유지 (B9)", () => {
  it("밝은 화면만 — prefers-color-scheme · dark: 변형이 판 · 홈 구간에 없음", () => {
    for (const f of [...HOME_COMPONENTS, join(UI_SRC, "components/data/flap-board.tsx")]) {
      expect(read(f), f).not.toMatch(/prefers-color-scheme|\bdark:/);
    }
  });
});

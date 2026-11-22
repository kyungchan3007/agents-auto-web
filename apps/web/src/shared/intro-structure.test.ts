// 작업 0185 — 공항 인트로의 구조 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// prd 완료 기준: 홈 HTML 은 인트로 없이도 지금과 같음(검색 · GEO) · three · 모델은 인트로가 열릴 때만 불러옴 · 폭 700 이하는 인트로 없음 · 출처 표시(Poly by Google CC-BY · Kenney CC0) · 홈 첫 화면에 '같은 달 평균' 문장 없음
//
// builder 가 만들 것 (sdd 파일 계획)
//   apps/web/src/features/intro/
//     lib/flow.ts · lib/flight.ts   (순수 · 도시 표는 작업 0192 에서 @hav/shared/travel 의 TRAVEL_CITIES 로 옮김 · react · three 를 가져오지 않음 — 각 *.test.ts 머리 주석)
//     lib/scene.ts       three 를 가져오는 유일한 파일 · export function mountIntroScene(el, api): () => void  (정리 함수를 돌려줌 · three 객체 dispose)
//     hooks/use-intro-enabled.ts   export function useIntroEnabled(): boolean — 처음 값 false(서버 HTML 에 인트로 없음) · 마운트 뒤 폭 700 초과(window.matchMedia("(min-width: 701px)") 또는 innerWidth > 700)이고 localStorage[INTRO_OFF_KEY] !== "1" 일 때만 true
//     hooks/use-intro.ts           단계 · 입력 · 탑승권 · 스크롤(휠 passive:false · 방향키) · 창문 전환 순서 · 저장(writePicked + window 이벤트 PICK_EVENT) · prefers-reduced-motion · 정리(removeEventListener)
//     hooks/use-intro-scene.ts     import("../lib/scene") 동적으로만 · 실패해도 흐름은 계속(try/catch)
//     components/intro-gate.tsx    "use client" · useIntroEnabled() 가 참일 때만 <Intro/> · 아니면 null
//     components/intro.tsx · boarding-pass.tsx · window-transition.tsx · bubble-*.tsx   (그리기만 — 훅 직접 금지)
//   apps/web/src/app/page.tsx  <Home .../> 뒤에 <IntroGate .../> · api.priceLevels() 를 더 받아 넘김
//   apps/web/src/features/home/components/picked-board.tsx · hooks/use-picked-destination.ts · components/home-footer.tsx(Kenney CC0 출처)
//   apps/web/public/models/intro/{car,taxi,people,city}/ — *.glb + Textures/colormap.png (Kenney CC0)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const WEB = resolve(WEB_SRC, "..");
const INTRO = join(WEB_SRC, "features/intro");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => codeOf(readFileSync(p, "utf8"));
function walk(dir: string, keep: (f: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    return d.isDirectory() ? walk(p, keep) : keep(p) ? [p] : [];
  });
}
const SRC = (dir: string) => walk(dir, (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));
const rel = (f: string) => f.replace(`${WEB}/`, "");

describe("파일 구성", () => {
  const MUST = [
    "lib/flow.ts", "lib/flight.ts", "lib/scene.ts",
    "hooks/use-intro.ts", "hooks/use-intro-scene.ts", "hooks/use-intro-enabled.ts",
    "components/intro-gate.tsx", "components/intro.tsx", "components/boarding-pass.tsx", "components/window-transition.tsx",
  ];
  for (const f of MUST) it(`features/intro/${f} 가 있음`, () => expect(existsSync(join(INTRO, f)), f).toBe(true));

  it("말풍선 화면(components/bubble-*.tsx)이 1개 이상", () => {
    expect(walk(join(INTRO, "components"), (f) => /bubble-[\w-]+\.tsx$/.test(f)).length).toBeGreaterThan(0);
  });

  it("홈 쪽 파일 — ticket(작업 0217 · 예전 picked-board) · use-picked-destination · picked.ts", () => {
    for (const f of ["features/home/components/ticket.tsx", "features/home/hooks/use-picked-destination.ts", "features/home/lib/picked.ts"]) expect(existsSync(join(WEB_SRC, f)), f).toBe(true);
  });
});

describe("three 는 인트로가 열릴 때만 — 홈 첫 로딩 무게 그대로", () => {
  it("three 를 가져오는 파일은 lib/scene.ts 하나뿐 (features/intro · app · shared)", () => {
    const users = [...SRC(INTRO), ...SRC(join(WEB_SRC, "app")), ...SRC(join(WEB_SRC, "shared")), ...SRC(join(WEB_SRC, "features/home"))]
      .filter((f) => /from\s*"three(\/[^"]*)?"|import\("three/.test(read(f)))
      .map((f) => f.replace(`${WEB_SRC}/`, ""));
    expect(users).toEqual(["features/intro/lib/scene.ts"]);
  });

  it("scene.ts 는 어디서도 정적으로 가져오지 않음 — use-intro-scene.ts 의 import(\"../lib/scene\") 하나뿐", () => {
    const static_ = SRC(WEB_SRC).filter((f) => /from\s*"[^"]*lib\/scene"/.test(read(f))).map((f) => f.replace(`${WEB_SRC}/`, ""));
    expect(static_).toEqual([]);
    expect(read(join(INTRO, "hooks/use-intro-scene.ts"))).toMatch(/import\(\s*"\.\.\/lib\/scene"\s*\)/);
  });

  it("scene.ts — mountIntroScene 이 정리 함수를 돌려주고(dispose) · react 를 가져오지 않음 · data: 우회 없음 · 모델은 /models/intro/", () => {
    const s = read(join(INTRO, "lib/scene.ts"));
    expect(s).toMatch(/export\s+(async\s+)?function\s+mountIntroScene|export\s+const\s+mountIntroScene/);
    expect(s).toMatch(/\.dispose\(/);
    expect(s).not.toMatch(/from\s*"react/);
    expect(s).toMatch(/\/models\/intro/);
    expect(s).not.toMatch(/createImageBitmap|data:image/); // 시안의 우회는 실제 사이트에서 쓰지 않음
  });

  it("비행기 · 카메라 경로와 LIFT 는 lib/flight.ts 한 곳 — scene.ts 가 따로 정의하지 않고 가져다 씀 (flight.test.ts 가 값을 고정)", () => {
    const s = read(join(INTRO, "lib/scene.ts"));
    expect(s).toMatch(/from\s*"\.\/flight"/);
    expect(s).not.toMatch(/\b(const|let)\s+(PLANE_KEYS|CAMERA_KEYS|LIFT|FLIGHT_START)\b/);
    expect(s).not.toMatch(/\bfunction\s+(planeAt|cameraAt)\b/);
  });

  it("use-intro-scene — 장면이 안 떠도(WebGL 없음 · 모델 못 받음) 흐름은 계속: try/catch", () => {
    const h = read(join(INTRO, "hooks/use-intro-scene.ts"));
    expect(h).toMatch(/catch/);
    expect(h).toMatch(/\bmountIntroScene\b/);
  });

  it("순수 lib(flow · flight)는 react · three 를 가져오지 않음", () => {
    for (const f of ["lib/flow.ts", "lib/flight.ts"]) expect(read(join(INTRO, f)), f).not.toMatch(/from\s*"(react|three|next)[^"]*"/);
  });
});

describe("서버 HTML 에는 인트로 없음 · 폭 700 초과에서만 · 끄기 스위치", () => {
  it("use-intro-enabled — 처음 false · 마운트 뒤(useEffect)에 폭 700 초과 · INTRO_OFF_KEY 를 읽음", () => {
    const h = read(join(INTRO, "hooks/use-intro-enabled.ts"));
    expect(h).toMatch(/useState(<boolean>)?\(\s*false\s*\)/);
    expect(h).toMatch(/useEffect\(/);
    expect(h).toMatch(/\(min-width:\s*701px\)|innerWidth\s*>\s*700/);
    expect(h).toMatch(/INTRO_OFF_KEY/);
    expect(h).toMatch(/@hav\/shared\/travel/);
  });

  it("intro-gate — 'use client' · useIntroEnabled 가 거짓이면 null · 훅은 hooks/ 에서만", () => {
    const g = read(join(INTRO, "components/intro-gate.tsx"));
    expect(readFileSync(join(INTRO, "components/intro-gate.tsx"), "utf8")).toMatch(/^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/);
    expect(g).toMatch(/useIntroEnabled\(/);
    expect(g).toMatch(/return\s+null|\?\s*<Intro\b[\s\S]*:\s*null|&&\s*<Intro\b/);
    expect(g).not.toMatch(/data-testid="intro"/); // 덮개 표시는 Intro 안 — 게이트 자체는 아무것도 그리지 않음
  });

  it("app/page.tsx — <Home/> 뒤에 <IntroGate/> · 물가 수준(priceLevels)도 받아 넘김 · 인트로 때문에 홈 본문을 바꾸지 않음", () => {
    const p = read(join(WEB_SRC, "app/page.tsx"));
    expect(p).toMatch(/features\/intro\/components\/intro-gate/);
    expect(p.indexOf("<Home")).toBeGreaterThan(-1);
    expect(p.indexOf("<IntroGate")).toBeGreaterThan(p.indexOf("<Home"));
    expect(p).toMatch(/api\.priceLevels\(/);
    expect(p).toMatch(/api\.latest\(\)/);
  });

  it("끄기 스위치는 화면 글에 노출하지 않음 (flapfx:intro-off 는 상수로만)", () => {
    for (const f of SRC(INTRO).filter((x) => x.endsWith(".tsx"))) expect(read(f), rel(f)).not.toMatch(/flapfx:intro-off/);
  });
});

describe("건너뛰기 · 이전 · 움직임", () => {
  const ui = () => SRC(join(INTRO, "components")).map(read).join("\n");

  it("건너뛰기 버튼 — 늘 있음 (글 '건너뛰기' · data-testid=intro-skip) · 덮개 data-testid=intro · role=dialog", () => {
    expect(ui()).toMatch(/건너뛰기/);
    expect(ui()).toMatch(/data-testid="intro-skip"/);
    expect(ui()).toMatch(/data-testid="intro"/);
    expect(ui()).toMatch(/role="dialog"/);
  });

  it("이전 버튼 — data-testid=intro-back · 글 '이전'", () => {
    expect(ui()).toMatch(/data-testid="intro-back"/);
    expect(ui()).toMatch(/이전/);
  });

  it("use-intro — 휠은 passive:false · 정리에서 removeEventListener · 움직임 줄이기(prefers-reduced-motion) · 저장(writePicked) · 이벤트(PICK_EVENT)", () => {
    const h = read(join(INTRO, "hooks/use-intro.ts"));
    expect(h).toMatch(/addEventListener\(\s*"wheel"[\s\S]*passive:\s*false/);
    expect(h).toMatch(/removeEventListener\(/);
    expect(h).toMatch(/prefers-reduced-motion/);
    expect(h).toMatch(/\bwritePicked\(/);
    expect(h).toMatch(/\bPICK_EVENT\b/);
    expect(h).toMatch(/@hav\/shared\/travel/);
  });

  it("화면 파일(components)에 훅을 직접 쓰지 않음 — 상태 · 효과는 hooks/use-*.ts", () => {
    for (const f of SRC(join(INTRO, "components"))) expect(read(f), rel(f)).not.toMatch(/\buse(State|Effect|LayoutEffect|Ref|Memo|Callback|Reducer|Transition)\(/);
  });

  it("끝 장면(작업 0223) — 로고가 홈 메뉴 로고의 실제 자리(getBoundingClientRect)로 옮겨 감 · 창밖 사진 자리는 쓰지 않음", () => {
    const code = SRC(INTRO).map(read).join("\n");
    expect(code).not.toMatch(/images\/photos/);
    expect(code).toMatch(/getBoundingClientRect\(/);
  });
});

describe("기능 폴더 규칙 — 홈 · 인트로가 서로 가져오지 않음", () => {
  it("features/intro 는 features/home 을 가져오지 않음 · features/home 은 features/intro 를 가져오지 않음", () => {
    for (const f of SRC(INTRO)) expect(read(f), rel(f)).not.toMatch(/from\s*"(@\/features\/home|\.\.\/\.\.\/home)/);
    for (const f of SRC(join(WEB_SRC, "features/home"))) expect(read(f), rel(f)).not.toMatch(/from\s*"(@\/features\/intro|\.\.\/\.\.\/intro)/);
  });

  it("홈은 고른 값을 @hav/shared/travel 로만 읽음 (use-picked-destination — readPicked · PICK_EVENT · 정리)", () => {
    const h = read(join(WEB_SRC, "features/home/hooks/use-picked-destination.ts"));
    expect(h).toMatch(/@hav\/shared\/travel/);
    expect(h).toMatch(/\breadPicked\(/);
    expect(h).toMatch(/\bPICK_EVENT\b/);
    expect(h).toMatch(/removeEventListener\(/);
    expect(h).toMatch(/useEffect\(/); // 서버 HTML 은 지금 그대로 · 마운트 뒤에 읽음
  });

  it("홈 ticket — 같은 FlapBoard 로 pickedBoard() 를 그림 · key 로 다시 넘어가게 · 탑승권 보기 버튼 (작업 0217)", () => {
    const b = read(join(WEB_SRC, "features/home/components/ticket.tsx"));
    expect(b).toMatch(/from\s*"@hav\/ui\/data\/flap-board"/);
    expect(b).toMatch(/\bpickedBoard\(|\bpickedChip\(/);
    expect(b).toMatch(/\bkey=/);
    expect(b).toMatch(/<button\b/);
    expect(b).toMatch(/탑승권 보기|pickedChip/);
  });

  it("홈 안내판(today-board → Ticket)이 고른 나라 판을 씀 — 안 한 사람에게는 지금 그대로", () => {
    const home = ["today-board.tsx", "home.tsx"].map((f) => read(join(WEB_SRC, "features/home/components", f))).join("\n");
    expect(home).toMatch(/\bTicket\b/);
    expect(read(join(WEB_SRC, "features/home/components/ticket.tsx"))).toMatch(/\bpickedBoard\(/);
    expect(home).toMatch(/\btodayBoard\(/); // 서버에서 그리는 지금 안내판은 그대로
  });
});

describe("출처 표시 · 홈 문구", () => {
  it("인트로 화면에 Poly by Google(CC-BY) · Kenney(CC0) 출처", () => {
    const ui = SRC(INTRO).map((f) => readFileSync(f, "utf8")).join("\n");
    expect(ui).toMatch(/Kenney/);
    expect(ui).toMatch(/CC0/);
    expect(ui).toMatch(/Poly by Google|PLANE_CREDIT/);
  });

  it("홈 바닥 띠 출처에 Kenney(CC0) 추가 — 기존 출처는 그대로", () => {
    const f = readFileSync(join(WEB_SRC, "features/home/components/home-footer.tsx"), "utf8");
    expect(f).toMatch(/Kenney/);
    expect(f).toMatch(/CC0/);
    expect(f, "환율 출처는 공용 상수(RATE_SOURCE_LABEL · 작업 0299: 한국수출입은행 · Frankfurter)에서").toMatch(/RATE_SOURCE_LABEL|한국수출입은행/);
    expect(f).not.toMatch(/PLANE_CREDIT|Poly by Google/); // 홈은 3D 비행기를 뺌(그래프 2D) — 출처 줄도 뺌 · 인트로 화면(intro.tsx)에는 그대로
  });

  it("홈 첫 화면 설명(travel-timing.ts)에 '같은 달 평균으로 비교했습니다' 가 없음", () => {
    expect(read(join(WEB_SRC, "features/home/lib/travel-timing.ts"))).not.toMatch(/같은 달 평균으로 비교했습니다/);
    expect(walk(join(WEB_SRC, "features/home"), (f) => /\.tsx?$/.test(f) && !/\.test\./.test(f)).map(read).join("\n")).not.toMatch(/같은 달 평균으로 비교했습니다/);
  });
});

describe("모델 파일 — Kenney(CC0) · 인트로가 열릴 때만 받음", () => {
  const ROOT = join(WEB, "public/models/intro");
  for (const dir of ["car", "taxi", "people", "city"]) {
    it(`public/models/intro/${dir}/ 에 .glb 가 1개 이상`, () => {
      const glb = walk(join(ROOT, dir), (f) => f.endsWith(".glb"));
      expect(glb.length, dir).toBeGreaterThan(0);
      for (const f of glb) expect(statSync(f).size, rel(f)).toBeGreaterThan(1000);
    });
    it(`public/models/intro/${dir}/ 에 colormap.png (모델이 읽는 색상표)`, () => {
      expect(walk(join(ROOT, dir), (f) => f.endsWith("colormap.png")).length, dir).toBeGreaterThan(0);
    });
  }

  it("모델은 홈 첫 화면 코드가 가져오지 않음 — 홈 컴포넌트에 /models/intro 가 없음", () => {
    for (const f of SRC(join(WEB_SRC, "features/home"))) expect(read(f), rel(f)).not.toMatch(/\/models\/intro/);
  });

  it("three 는 apps/web 의 의존성 (packages/ui 와 같은 버전)", () => {
    const web = JSON.parse(readFileSync(join(WEB, "package.json"), "utf8")).dependencies ?? {};
    const ui = JSON.parse(readFileSync(resolve(WEB, "../../packages/ui/package.json"), "utf8")).dependencies ?? {};
    expect(web.three, "apps/web three").toBeDefined();
    if (ui.three) expect(web.three).toBe(ui.three);
  });
});

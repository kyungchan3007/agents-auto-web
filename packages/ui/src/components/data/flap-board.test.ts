// 작업 0177 — 출발 안내판 부품 FlapBoard (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 판은 HTML/CSS 칸(고정폭) · 판 울트라마린 #2438A8 · 칸 #3247b8 · 칸 가운데 이음선 · 도착지 줄 흰 글자 · 금액 줄 햇빛 노랑 #F7C548 · 판에만 울트라마린 (B3)
// 처음 한 번만 넘어감(1~2초) · 움직임 줄이기면 바로 최종 글자 · 다시 돌지 않음 (B5) · 화면 읽기 도구는 판 전체를 한 문장으로 (B6)
//
// builder 가 만들 것 — packages/ui/src/components/data/flap-board.tsx
//   export function FlapBoard({ rows, cols, label, className }: { rows: { text: string | null; tone: "dest" | "money" }[]; cols: number; label: string; className?: string })
//   표시(e2e): data-testid="flap-board"(판 · role="img" + aria-label={label}) · "flap-row"(줄 · data-tone="dest|money") · "flap-cell"(칸 · aria-hidden) · 칸마다 이음선 요소(data-testid="flap-seam" · 가운데 가로선)
//   tokens.css: --hav-flap-cell: #3247b8 (+ @theme --color-flap-cell: var(--hav-flap-cell)) → bg-flap-cell · 판은 bg-cheap(#2438A8)
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const src = () => code(read("./flap-board.tsx"));
const tokens = () => code(readFileSync(new URL("../../tokens.css", import.meta.url), "utf8"));
const tag = (s: string, id: string) => new RegExp(`<[^>]*data-testid="${id}"[^>]*>`).exec(s)?.[0] ?? "";

describe("구성 · 표시", () => {
  it("FlapBoard export · props(rows · cols · label) · 순수 함수(toCells · flipPlan)를 씀", () => {
    const s = src();
    expect(s).toMatch(/export function FlapBoard\(/);
    for (const p of ["rows", "cols", "label"]) expect(s, p).toMatch(new RegExp(`\\b${p}\\b`));
    expect(s).toMatch(/\btoCells\(/);
    expect(s).toMatch(/\bflipPlan\(/);
    expect(s).toMatch(/from\s*"\.\.\/\.\.\/lib\/flap"/);
  });

  it("e2e 가 찾는 표시 — flap-board · flap-row(data-tone) · flap-cell · flap-seam", () => {
    const s = src();
    for (const id of ["flap-board", "flap-row", "flap-cell", "flap-seam"]) expect(s, id).toMatch(new RegExp(`data-testid="${id}"`));
    expect(tag(s, "flap-row")).toMatch(/data-tone=/);
  });
});

describe("흰 글자 줄 (작업 0216 · 시안 B 의 .w)", () => {
  it("tone 에 white 를 더함 — 글자 색 text-foam · 기존 dest · money 는 노랑 그대로", () => {
    const s = src();
    expect(s).toMatch(/"dest"\s*\|\s*"money"\s*\|\s*"white"/);
    expect(s).toMatch(/white:\s*"text-foam"/);
    expect(s).toMatch(/dest:\s*"text-sun"/);
  });
});

describe("이름은 흰 글자 · 값은 노랑 — 줄 안 whiteUntil (작업 0218)", () => {
  it("Row 에 whiteUntil(앞 N칸은 흰 글자)을 받음 — 기본은 줄 색 그대로", () => {
    const s = src();
    expect(s).toMatch(/whiteUntil\??:\s*number/);
    expect(s).toMatch(/whiteUntil/);
    expect(s).toMatch(/text-foam/);
  });
});

describe("접근성 — 판 전체를 한 문장으로 (B6)", () => {
  it("판에 role=\"img\" + aria-label={label} — 칸 글자는 aria-hidden (글자 하나씩 읽지 않음)", () => {
    const s = src();
    const board = tag(s, "flap-board");
    expect(board).toMatch(/role="img"/);
    expect(board).toMatch(/aria-label=\{label\}/);
    expect(tag(s, "flap-cell")).toMatch(/aria-hidden/);
  });
});

describe("움직임 — 처음 한 번 · 움직임 줄이기면 바로 최종 글자 · 다시 돌지 않음 (B5)", () => {
  it("움직임 줄이기 설정을 읽음 (useReducedMotion 또는 prefers-reduced-motion)", () => {
    expect(src()).toMatch(/useReducedMotion|prefers-reduced-motion/);
  });

  it("한 번만 — 반복(infinite · setInterval · repeat)이 없고 한 번 돌았는지 기억(played · once)", () => {
    const s = src();
    expect(s).not.toMatch(/\binfinite\b|setInterval|repeat:|animation-iteration-count/);
    expect(s).toMatch(/played|hasPlayed|once/i);
  });

  it("첫 그림(서버 · 움직임 전)은 최종 글자 — 칸 글자가 toCells 결과 그대로 마크업에 들어감 (움직임이 못 돌아도 글자는 보임)", () => {
    expect(src()).toMatch(/\{(ch|cell|c|char)\}|\.frames\b/);
    expect(src()).not.toMatch(/opacity-0\b[^"]*flap-cell|visibility:\s*hidden/);
  });
});

describe("모양 — 판 · 칸 · 이음선 · 글자 색 (B3)", () => {
  it("판은 짙은 남색 잉크(bg-pin-ink · 작업 0177 A안 물건처럼) · 칸은 bg-flap-cell · 고정폭 칸(글자 하나 = 같은 폭 · 가운데 맞춤) · 줄이 줄바꿈하지 않음", () => {
    const s = src();
    expect(tag(s, "flap-board")).toMatch(/bg-pin-ink/);
    expect(tag(s, "flap-board")).toMatch(/rounded-\[10px\]/);
    const cell = tag(s, "flap-cell");
    expect(cell).toMatch(/bg-flap-cell/);
    expect(cell).toMatch(/\bw-\[[^\]]+\]|\bw-\d+|\bsize-\[[^\]]+\]|\bsize-\d+/); // 폭 고정
    expect(cell).toMatch(/justify-center|text-center/);
    expect(tag(s, "flap-row")).not.toMatch(/flex-wrap/);
  });

  it("칸 가운데 이음선 — 가로선(top-1/2 · 한 줄 굵기) · 판보다 더 짙은 색(bg-on-band)", () => {
    const seam = tag(src(), "flap-seam");
    expect(seam).toMatch(/top-1\/2/);
    expect(seam).toMatch(/\bh-px\b|\bh-0\.5\b|\bh-\[1px\]|\bh-\[2px\]/);
    expect(seam).toMatch(/bg-on-band/);
  });

  it("두 줄 모두 햇빛 노랑(text-sun) — 도착지 줄도 노랑 (작업 0177 수정)", () => {
    const s = src();
    expect(s).toMatch(/dest[\s\S]{0,80}text-sun|text-sun[\s\S]{0,80}dest/);
    expect(s).toMatch(/money[\s\S]{0,80}text-sun|text-sun[\s\S]{0,80}money/);
    expect(s.replace(/white:\s*"text-foam"/, "")).not.toMatch(/text-(foam|white)/); // 흰 글자는 white 줄 선택(작업 0216)에만
  });

  it("글꼴 — 칸 글자는 큰 제목 글꼴(font-display · Pretendard 800) · 숫자는 같은 폭(tabular-nums)", () => {
    const s = src();
    expect(s).toMatch(/\bfont-display\b/);
    expect(s).toMatch(/\bfont-extrabold\b|\bfont-\[800\]/);
    expect(s).toMatch(/\btabular-nums\b/);
  });

  it("벽에 걸린 물건처럼 — 부드러운 그림자 한 가지(0 10px 24px) · 그라데이션 없음", () => {
    const s = src();
    expect(tag(s, "flap-board")).toMatch(/\bshadow-board\b/);
    expect(s).not.toMatch(/gradient/);
  });
});

describe("토큰 — 칸 색 #1f3190 (작업 0216 · 시안 B)", () => {
  it("--hav-flap-cell: #1f3190 · @theme 에서 --color-flap-cell 로 연결", () => {
    expect(tokens()).toMatch(/--hav-flap-cell\s*:\s*#1f3190/i);
    expect(tokens()).toMatch(/--color-flap-cell\s*:\s*var\(--hav-flap-cell\)/);
  });
});

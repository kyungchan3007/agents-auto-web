// 작업 0175 네 번째 묶음 — 홈 "오늘 환율" 구간 배경을 하늘 종이로 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "지구본 배경이 파란색이잖아 hero 가 들어가니까 그냥 같은 배경색을 써야 할 것 같아" — 울트라마린 바다 띠를 없애고 페이지와 같은 하늘 종이(#EAF4F2) · 맨 위 사진 구간과 이어지게 · 홈만
//
// builder 가 할 것 (prd G1~G4)
//   features/home/components/today-band.tsx: data-surface="dark" 삭제(페이지 바탕 하늘 종이 그대로) · id="today" 유지(메뉴 "오늘 환율"이 옴)
//     글자색은 밝은 바탕 규칙: 작은 제목(Eyebrow) 청록(accent · 기본 그대로) · 큰 문장(Title) 울트라마린(text-cheap) · 큰 숫자 울트라마린 + 제목 숫자 강조 규칙대로 노란 형광펜 띠(EmphText · bg="sea" 아님) · 설명 보조 남색(text-fg-2)
//   3D 지구 컴포넌트는 그대로(GlobeLazy · origin · texture · arcs) · packages/ui/src/three/objects/globe.tsx 는 바뀌지 않음 — 아래 내용 고정값(sha256)이 같아야 함
//     (밝은 바탕에서 테두리 빛이 안 보이면 생김새 코드는 건드리지 말고 결과만 보고 · 일부러 지구 모양을 바꾸는 날은 이 값을 같이 바꿈)
//   0168 · 0169 의 "바다 띠 = dark" 기대 테스트(home-redesign · number-emphasis)는 새 규칙으로 고침 · e2e: 홈 #today 바탕이 #EAF4F2
//   docs/design.md: 홈 오늘 환율 구간이 하늘 종이라고 갱신 — "바다 띠(3D 지구 자리 · 큰 숫자 띠)" 설명은 예전 결정으로
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const ROOT = resolve(WEB_SRC, "../../..");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const band = codeOf(readFileSync(join(WEB_SRC, "features/home/components/today-band.tsx"), "utf8"));
const tag = (re: RegExp) => re.exec(band)?.[0] ?? "";

describe("오늘 환율 구간 — 바다 띠 배경이 없음 (하늘 종이)", () => {
  it("data-surface=\"dark\" · \"elevated\" 가 없음 (data-surface 가 있다면 light)", () => {
    expect(band).not.toMatch(/data-surface="(dark|elevated)"/);
    for (const m of band.matchAll(/data-surface="([a-z]+)"/g)) expect(m[1]).toBe("light");
  });

  it("id=\"today\" 는 한 번 그대로 (메뉴 '오늘 환율' → /#today)", () => {
    expect(band.match(/id="today"/g)?.length).toBe(1);
    expect(tag(/<section\b[^>]*id="today"[^>]*>/)).not.toBe("");
  });

  it("바탕을 따로 칠하지 않음 — 구간에 울트라마린 배경 클래스(bg-cheap · bg-[#2438a8] · bg-sea)가 없고 바다 띠 글자(bg=\"sea\")도 없음", () => {
    expect(tag(/<section\b[^>]*id="today"[^>]*>/)).not.toMatch(/bg-(cheap|sea|\[#2438a8\])/i);
    expect(band).not.toMatch(/bg="sea"/);
  });
});

describe("글자색 — 밝은 바탕 규칙", () => {
  it("작은 제목(Eyebrow) 청록 — 색 클래스를 덮어쓰지 않고 기본(accent)", () => {
    const eyebrow = tag(/<Eyebrow\b[^>]*>/);
    expect(eyebrow, "Eyebrow").not.toBe("");
    expect(eyebrow).not.toMatch(/text-/);
  });

  it("큰 문장(Title)은 울트라마린(text-cheap) — 검정 남색(text-fg) 아님", () => {
    const titles = [...band.matchAll(/<Title\b[^>]*>/g)].map((m) => m[0]);
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) {
      expect(t).toMatch(/text-cheap/);
      expect(t).not.toMatch(/text-fg\b(?!-2)/);
    }
  });

  it("큰 숫자(값 / 단위)는 울트라마린 + 노란 형광펜 띠 — EmphText 로(기본 bg · bg=\"sea\" 아님) · Gasoek 큰 글자 · 해 노랑 글자 아님", () => {
    const tags = [...band.matchAll(/<EmphText\b[^>]*>/g)].map((m) => m[0]);
    expect(tags.some((t) => /copy\.value/.test(t)), "큰 숫자가 EmphText").toBe(true);
    expect(tags.some((t) => /copy\.headline/.test(t)), "큰 문장이 EmphText").toBe(true);
    for (const t of tags) expect(t).not.toMatch(/bg="sea"/);
    const big = tag(/<p\b[^>]*font-display[^>]*>/);
    expect(big, "큰 숫자 줄").not.toBe("");
    expect(big).toMatch(/text-(cheap|figure)/); // 밝은 바탕에서 figure 는 울트라마린
  });

  it("설명 · 근거 줄은 보조 남색(text-fg-2)", () => {
    expect(band).toMatch(/text-body text-fg-2/);
  });
});

describe("3D 지구 — 그대로", () => {
  it("today-band 가 GlobeLazy 로 지구를 그림 — origin · texture · arcs", () => {
    const g = tag(/<GlobeLazy[\s\S]*?\/>/);
    expect(g, "GlobeLazy").not.toBe("");
    for (const p of ["origin=", "texture=", "arcs="]) expect(g, p).toContain(p);
  });

  it("globe.tsx 는 바뀌지 않음 (내용 sha256 고정 · 지구 모양을 바꾸는 날 이 값을 같이 바꿈)", () => {
    const sha = createHash("sha256").update(readFileSync(join(ROOT, "packages/ui/src/three/objects/globe.tsx"))).digest("hex");
    expect(sha).toBe("324c908f62821b2beade51600082c39602497c4e819d59fc6e1a78cb65c80c29");
  });
});

describe("문서 — docs/design.md (하늘 종이 한 바탕)", () => {
  const doc = readFileSync(join(ROOT, "docs/design.md"), "utf8");

  it("홈 오늘 환율 구간(3D 지구)이 하늘 종이 바탕이라고 적혀 있음", () => {
    expect(doc).toMatch(/오늘 환율[^|\n]*하늘 종이|하늘 종이[^|\n]*오늘 환율/);
  });

  it("'바다 띠 = 3D 지구 자리 · 큰 숫자 띠 · 홈에만' 은 현재 결정으로 남지 않음 (예전 결정 줄에만)", () => {
    const lines = doc.split("\n").filter((l) => /바다 띠/.test(l) && /3D 지구 자리|큰 숫자 띠|홈 바다 띠|홈에만/.test(l));
    for (const l of lines) expect(l, l).toMatch(/바뀐 결정|예전|없앴|없앰|제거/);
  });
});

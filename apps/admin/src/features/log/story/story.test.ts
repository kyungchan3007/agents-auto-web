// 작업 0172 — 작업실 맨 위 "이 사이트를 어떻게 만들었나" 요약의 글 상수 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 원칙(plan.md): 숫자 · 사건은 docs/project-facts.md 에 있는 것만 · "확인 필요"는 쓰지 않음 · 불릿 위주 · 한 줄은 짧게 · 표 금지 · 내부 용어(파일 · 스크립트 이름, 루프 이름) 대신 풀어 쓴 말 ·
//   자기 평가 · 한계 항목 없음 · 개인 사정을 드러내는 말 없음 · "~합니다" 체 (캐주얼 어미 · 표현 금지)
//
// builder 가 만들 것 — apps/admin/src/features/log/story/story.ts
//   export type StoryBullet = { text: string; source: string }          // source = 근거 (PR · 작업 번호 · 문서 경로) — 숫자 옆의 출처를 데이터로
//   export type StoryStep = { id: string; title: string; bullets: readonly StoryBullet[] }
//   export const STORY_STEPS: readonly StoryStep[]                      // 다섯 단계 · 이 순서
//     제목: "문제 정의" · "외부 공공 API 연결" · "구현 · 운영" · "사고 대응" · "결과 측정"
//   화면은 이 상수만 그림 (소스 검사는 shared/site-story.test.ts)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STORY_STEPS } from "./story";

const FACTS = readFileSync(resolve(__dirname, "../../../../../../docs/project-facts.md"), "utf8");
const bullets = STORY_STEPS.flatMap((s) => s.bullets.map((b) => ({ step: s.title, ...b })));
const step = (title: string) => STORY_STEPS.find((s) => s.title === title);
const stepText = (title: string) => (step(title)?.bullets ?? []).map((b) => b.text).join("\n");

/** 쉼표 숫자는 쉼표를 지워 비교 (7,500 → 7500) */
const norm = (s: string) => s.replace(/(?<=\d),(?=\d)/g, "");
const FACTS_N = norm(FACTS);
const hasNumber = (n: string) => new RegExp(`(?<![\\d.])${n.replace(/\./g, "\\.")}(?![\\d])`).test(FACTS_N);

describe("구조 — 다섯 단계", () => {
  it("문제 정의 → 외부 공공 API 연결 → 구현 · 운영 → 사고 대응 → 결과 측정", () => {
    expect(STORY_STEPS.map((s) => s.title)).toEqual(["문제 정의", "외부 공공 API 연결", "구현 · 운영", "사고 대응", "결과 측정"]);
  });

  it("id 는 서로 다름 · 단계마다 불릿 2~5개 · 불릿마다 글과 출처", () => {
    expect(new Set(STORY_STEPS.map((s) => s.id)).size).toBe(5);
    for (const s of STORY_STEPS) {
      expect(s.bullets.length, s.title).toBeGreaterThanOrEqual(2);
      expect(s.bullets.length, s.title).toBeLessThanOrEqual(5);
      for (const b of s.bullets) {
        expect(b.text.trim().length, `${s.title} 글`).toBeGreaterThan(0);
        expect(b.source.trim().length, `${s.title}: ${b.text}`).toBeGreaterThan(0);
      }
    }
  });

  it("숫자가 있는 불릿은 출처가 PR · 작업 번호 · 문서 경로 중 하나", () => {
    for (const b of bullets.filter((x) => /\d/.test(x.text))) expect(b.source, b.text).toMatch(/#\d+|작업 \d{3,4}|docs\/|\.agents\/|apps\//);
  });

  it("한 줄은 짧게 — 불릿 글 60자 이하", () => {
    for (const b of bullets) expect(b.text.length, b.text).toBeLessThanOrEqual(60);
  });
});

describe("숫자 · 사건은 docs/project-facts.md 에 있는 것만 (지어낸 숫자 막기)", () => {
  it("불릿 글의 숫자가 모두 사실 기록표에 있음 — 날짜(10-29)는 그대로 · 나머지는 한 덩어리 숫자", () => {
    const missing: string[] = [];
    for (const b of bullets) {
      let t = norm(b.text);
      for (const d of t.match(/\b\d{1,2}-\d{1,2}\b/g) ?? []) {
        if (!FACTS_N.includes(d)) missing.push(`${b.step}: 날짜 ${d} ← ${b.text}`);
        t = t.replace(d, " ");
      }
      for (const n of t.match(/\d+(?:\.\d+)?/g) ?? []) if (!hasNumber(n)) missing.push(`${b.step}: ${n} ← ${b.text}`);
    }
    expect(missing).toEqual([]);
  });

  it("'확인 필요' 항목을 글에 쓰지 않음", () => {
    for (const b of bullets) {
      expect(b.text, b.text).not.toMatch(/확인 필요|미확정|추정/);
    }
  });

  it("받지 못한 금액을 쓰지 않음 — 사실 기록표에 금액 기록이 없음(비용 · 인프라)", () => {
    for (const b of bullets) expect(b.text, b.text).not.toMatch(/\d[\d,]*\s*(원|달러|USD|\$)\b|비용 \d/);
  });
});

describe("실제 사건에서 설계가 나온 과정 (기능 나열이 아니라)", () => {
  it("외부 공공 API 연결 — 연동한 자료 이름이 나옴 (수출입은행 · 관세청 · 통계청 · 한국은행 · 세계은행)", () => {
    const t = stepText("외부 공공 API 연결");
    for (const name of ["한국수출입은행", "관세청", "통계청", "한국은행", "세계은행"]) expect(t, name).toContain(name);
  });

  it("사고 대응 — 읽기 한도 초과 → 색인 · 캐시, 예비 값 때문에 재시도를 건너뜀 → 공식 값 기준 판단", () => {
    const t = stepText("사고 대응");
    for (const s of ["읽기 한도", "색인", "캐시", "공식 값"]) expect(t, s).toContain(s);
  });

  it("결과 측정 — 실제 측정 결과(노출 · 인용 0)를 그대로 · 측정하지 않은 효과를 성과로 쓰지 않음", () => {
    const t = stepText("결과 측정");
    expect(t).toMatch(/인용 0|노출 0/);
    expect(t).not.toMatch(/성과|향상|개선되|효과적|증가/);
  });

  it("구현 · 운영 — 에이전트 팀과 자동 검사 통과를 완료 조건으로 (사람이 머지)", () => {
    const t = stepText("구현 · 운영");
    expect(t).toMatch(/에이전트/);
    expect(t).toMatch(/자동 검사/);
  });
});

describe("글 원칙 — 표 없음 · 내부 용어 없음 · 자기 평가 없음 · 개인 사정 없음 · 합니다 체", () => {
  const all = STORY_STEPS.flatMap((s) => [s.title, ...s.bullets.map((b) => b.text)]).join("\n");

  it("표 없음 (| --- |)", () => {
    expect(all).not.toMatch(/\|\s*-{3,}/);
  });

  it("개인 사정을 드러내는 말 없음 — 포트폴리오 · FDE · 채용 · 지원", () => {
    expect(all).not.toMatch(/포트폴리오|FDE|채용|지원/);
  });

  it("내부 용어 없음 — 파일 · 스크립트 이름 · 루프 이름 · 설정 이름 (출처 칸은 제외)", () => {
    for (const b of bullets) expect(b.text, b.text).not.toMatch(/\.(ts|tsx|sh|md|json|yml|yaml)\b|checks\.sh|Quick Loop|Full Loop|LOOP=|wrangler|turbo|protected\.txt/i);
  });

  it("자기 평가 · 한계 항목 없음", () => {
    expect(all).not.toMatch(/한계|부족|아쉬|완벽|뛰어난|훌륭|최고|혁신|성공적/);
  });

  it("캐주얼한 표현 · 말투 없음 (안 돎 · 재서 · ~요 · ~함 · ~음으로 끝나는 글)", () => {
    expect(all).not.toMatch(/안 돎|재서/);
    for (const b of bullets) expect(b.text.trim(), b.text).not.toMatch(/(요|함|음|임|됨)[.]?$/);
  });
});

// 작업 0170 → 작업 0267 — 소개(/about) 기준 카드 8개 (사용자 결정: 41번 · "팀 추천 문구대로 해줘")
// 글을 문장으로 다시 쓰고 칸을 여섯에서 여덟으로: 환율 · 낮음 · 보통 · 높음 판정 · 여행 물가 · 항공료 지수 · 항공권 출발일 달력 · 직구 계산 · 방문 통계 · 누가 만드나요
// 글은 사용자가 본 문구(request.md · handoff 표 · 6번 · 7번은 사용자 답 문구)라 그대로 고정 — 판정 설명은 사이트 신호 규칙(최근 90일 백분위 · SIG-05)
//
//   export const ABOUT_CARDS: readonly { id: string; title: string; body: string; link?: { word: string; href: string } }[]  // 8개 · 이 순서
//   link: 본문 안의 한 낱말(word)을 그 주소(href)로 잇는 링크 — 누가 만드나요의 "작업실" → 어드민 작업실(https://admin.flapfx.com/log · 작업 0302)
import { describe, expect, it } from "vitest";
import { ABOUT_CARDS } from "./criteria";

const card = (title: string) => ABOUT_CARDS.find((c) => c.title === title);

const EXPECTED: [string, string][] = [
  ["환율", "한국수출입은행이 고시하는 매매기준율을 평일 낮 12시에 받습니다. 받지 못하면 13시 30분과 15시에 다시 받고, 그래도 받지 못하는 날은 예비 출처(Frankfurter)의 값을 씁니다."],
  ["낮음 · 보통 · 높음 판정", "최근 90일 가운데 오늘 환율이 어디쯤인지로 판정합니다. 낮은 쪽 30% 안이면 낮음, 높은 쪽 30% 안이면 높음, 그 사이는 보통입니다. 앞으로의 환율을 예측하는 것은 아닙니다."],
  ["여행 물가", "세계은행의 나라별 물가 수준을 한국을 100으로 놓고 비교합니다. 물가 수준은 세계은행의 가계 소비 구매력평가(PA.NUS.PRVT.PP)를 시장 환율(PA.NUS.FCRF)로 나눈 값입니다. 100보다 작으면 한국보다 물가가 낮은 나라입니다. 세계은행 자료에 없는 대만은 비교에서 뺐습니다."],
  ["항공료 지수", "통계청 소비자물가 가운데 국제항공료와 해외단체여행비 지수(2020년 = 100)를 씁니다. 실제 항공권 값이 아니라 달마다 오르내리는 정도를 보여 줍니다."],
  ["항공권 출발일 달력", "인천에서 떠나 1주 뒤 돌아오는 왕복 최저가를 출발일마다 보여 줍니다. 자료를 받은 날의 가격이라 실제 결제 가격과 다를 수 있습니다."],
  ["직구 계산", "면세 한도는 미국에서 오는 목록통관 200달러, 그 밖은 150달러입니다. 원화로 바꿀 때는 관세청이 주마다 고시하는 과세환율을 씁니다(없으면 수출입은행 환율로 어림합니다)."],
  ["방문 통계", "쿠키를 쓰지 않습니다. AI · 검색 봇의 방문과 AI 서비스에서 넘어온 방문만 날짜별 횟수로 셉니다. 개인 정보는 저장하지 않습니다."],
  ["누가 만드나요", "사람 한 명과 AI 에이전트 팀이 함께 만듭니다. 만드는 과정은 작업실에 공개합니다."],
];

describe("기준 카드 8개 (작업 0267)", () => {
  it("제목 · 순서 — 여섯에서 여덟으로(항공료 지수 · 항공권 출발일 달력이 판정 · 물가 뒤에 들어감)", () => {
    expect(ABOUT_CARDS.map((c) => c.title)).toEqual(EXPECTED.map(([t]) => t));
    expect(ABOUT_CARDS).toHaveLength(8);
  });

  it("id 는 서로 다르고 본문은 비지 않음", () => {
    expect(new Set(ABOUT_CARDS.map((c) => c.id)).size).toBe(8);
    for (const c of ABOUT_CARDS) expect(c.body.trim().length, c.title).toBeGreaterThan(0);
  });

  it("본문은 사용자가 본 문구 그대로 — 여덟 칸 모두", () => {
    for (const [title, body] of EXPECTED) expect(card(title)?.body, title).toBe(body);
  });

  it("옛 글이 남지 않음 — 옛 제목(싼 편 · 비싼 편 신호) · '쿠키 없는 방문 수만' · 달러 기호 표기($200) · 옛 '1년 평균' 판정", () => {
    const all = ABOUT_CARDS.map((c) => `${c.title} ${c.body}`).join("\n");
    for (const old of ["싼 편 · 비싼 편 신호", "쿠키 없는 방문 수만", "$200", "$150", "한국 = 100", "1년 평균", "평일 12시"]) expect(all, old).not.toContain(old);
  });

  it("사실 — 판정 규칙 30% · 90일 · 받는 시각 12시 · 13시 30분 · 15시 · 면세 한도 200 · 150달러", () => {
    expect(card("낮음 · 보통 · 높음 판정")?.body).toMatch(/90일[\s\S]*30%[\s\S]*30%/);
    const rate = card("환율")?.body ?? "";
    for (const s of ["12시", "13시 30분", "15시"]) expect(rate, s).toContain(s);
    const imp = card("직구 계산")?.body ?? "";
    for (const s of ["200달러", "150달러", "과세환율"]) expect(imp, s).toContain(s);
  });

  it("항공권 자료의 제공처 이름은 넣지 않음(화면에 적혀 있지 않음 · 사용자 결정 대기)", () => {
    const all = ABOUT_CARDS.map((c) => c.body).join("\n");
    for (const name of ["SerpApi", "구글 항공권", "Google", "serpapi"]) expect(all, name).not.toContain(name);
  });

  it("누가 만드나요 — '작업실' 낱말이 어드민 작업실로 가는 링크 · 본문에 그 낱말이 있음 · 다른 칸에는 링크 없음", () => {
    const maker = card("누가 만드나요");
    expect(maker?.link).toEqual({ word: "작업실", href: "https://admin.flapfx.com/log" });
    expect(maker?.body).toContain(maker?.link?.word ?? "?");
    for (const c of ABOUT_CARDS.filter((c) => c.title !== "누가 만드나요")) expect(c.link, c.title).toBeUndefined();
  });
});

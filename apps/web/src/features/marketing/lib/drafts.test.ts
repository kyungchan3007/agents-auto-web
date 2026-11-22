// 알리기 소재 초안 나누기 (작업 0304)
import { describe, expect, it } from "vitest";
import { draftDays, parseDraft, sections } from "./drafts";

const MD = `# 알림 초안 2026-11-20

## 본문
오늘 유로 환율은 1,459.62원입니다.
유로 환율 자세히 보기 → flapfx.com/currencies/EUR

## 해시태그
#환율 #유로환율

## 이미지 대체 글
파란 바탕의 탑승권 모양 카드.

## 쓴 숫자와 받은 날짜
- 유로 환율 1,459.62원 · 2026-11-20 값
- 90일 중간값 1,513.65원

## 눌렀을 때 갈 주소
https://flapfx.com/currencies/EUR
`;

describe("알리기 초안 (작업 0304)", () => {
  it("절(## 제목)로 나눔", () => {
    expect(Object.keys(sections(MD))).toEqual(["본문", "해시태그", "이미지 대체 글", "쓴 숫자와 받은 날짜", "눌렀을 때 갈 주소"]);
  });

  it("본문 · 해시태그 · 대체 글 · 숫자 목록 · 주소", () => {
    const d = parseDraft("2026-11-20", MD, "img.png");
    expect(d.body).toBe("오늘 유로 환율은 1,459.62원입니다.\n유로 환율 자세히 보기 → flapfx.com/currencies/EUR");
    expect(d.tags).toBe("#환율 #유로환율");
    expect(d.alt).toBe("파란 바탕의 탑승권 모양 카드.");
    expect(d.numbers).toEqual(["유로 환율 1,459.62원 · 2026-11-20 값", "90일 중간값 1,513.65원"]);
    expect(d.link).toBe("https://flapfx.com/currencies/EUR");
    expect(d.image).toBe("img.png");
  });

  it("빠진 절은 빈 글 · 주소가 없으면 null (지어내지 않음)", () => {
    const d = parseDraft("2026-11-21", "## 본문\n안녕", null);
    expect(d).toMatchObject({ body: "안녕", tags: "", alt: "", numbers: [], link: null, image: null });
  });

  it("날짜 폴더만 · 최근 날부터", () => {
    expect(draftDays(["2026-11-20", "README.md", "2026-11-22", "links"])).toEqual(["2026-11-22", "2026-11-20"]);
  });
});

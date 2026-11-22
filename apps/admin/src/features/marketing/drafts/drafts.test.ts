// 알리기 소재 초안 나누기 (작업 0307)
import { describe, expect, it } from "vitest";
import { draftDays, imageSources, nextImage, parseDraft, sections } from "./drafts";

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

describe("알리기 초안 (작업 0307)", () => {
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

// 그림 주소 고르기 (작업 0310) — R2 먼저 · 저장소 원본이 있는 날만 raw 로 되돌림 · 둘 다 없으면 그림 없음
describe("알리기 그림 주소 (작업 0310)", () => {
  const R2 = "https://pub-test.r2.dev/";
  const RAW = "https://raw.githubusercontent.com/o/r/main/docs/marketing/";

  it("처음 주소는 R2 의 {날짜}.jpg — 끝 슬래시가 있든 없든 같은 주소", () => {
    expect(imageSources("2026-11-20", R2, RAW, false).image).toBe("https://pub-test.r2.dev/2026-11-20.jpg");
    expect(imageSources("2026-11-20", R2.replace(/\/$/, ""), RAW, false).image).toBe("https://pub-test.r2.dev/2026-11-20.jpg");
  });

  it("되돌림 주소는 저장소에 image.png 가 있는 날만 — 없으면 null", () => {
    expect(imageSources("2026-11-20", R2, RAW, true).imageFallback).toBe(`${RAW}2026-11-20/image.png`);
    expect(imageSources("2026-11-20", R2, RAW.replace(/\/$/, ""), true).imageFallback).toBe(`${RAW}2026-11-20/image.png`);
    expect(imageSources("2026-11-20", R2, RAW, false).imageFallback).toBeNull();
  });

  it("그림이 안 열리면 R2 → raw → 그림 없음(null) 순서 — 같은 주소로 되돌아가지 않음", () => {
    const { image, imageFallback } = imageSources("2026-11-20", R2, RAW, true);
    const a = nextImage(image, { imageFallback });
    expect(a).toBe(imageFallback);
    expect(nextImage(a, { imageFallback })).toBeNull();
    expect(nextImage(image, { imageFallback: null }), "되돌림 주소 없는 날은 바로 그림 없음").toBeNull();
  });

  it("초안에 두 주소가 함께 실림 — 되돌림 주소를 안 주면 null", () => {
    const md = "## 본문\n글\n";
    const { image, imageFallback } = imageSources("2026-11-20", R2, RAW, true);
    expect(parseDraft("2026-11-20", md, image, imageFallback)).toMatchObject({ image, imageFallback });
    expect(parseDraft("2026-11-20", md, null).imageFallback).toBeNull();
  });
});

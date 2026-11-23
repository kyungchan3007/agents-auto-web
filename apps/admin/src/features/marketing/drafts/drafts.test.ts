// 알리기 소재 초안 나누기 (작업 0307)
import { describe, expect, it } from "vitest";
import { collectDrafts, draftDays, imageSources, nextImage, orderPosts, parseDraft, postKey, sections, subPostNames } from "./drafts";

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

describe("알리기 문구 · 주소 도우미 (작업 0312)", () => {
  it("저장소 원본 주소 · 링크 글 · 복사 글 · 최근 날짜", async () => {
    const { copyBody, latestDay, linkText, rawBase } = await import("./drafts");
    expect(rawBase("https://github.com/o/r")).toBe("https://raw.githubusercontent.com/o/r/main/docs/marketing/");
    expect(linkText("https://flapfx.com/prices")).toBe("flapfx.com/prices");
    expect(copyBody({ body: "본문", tags: "#태그" })).toBe("본문\n\n#태그");
    expect(copyBody({ body: "본문", tags: "" })).toBe("본문");
    expect(latestDay([{ day: "2026-11-23" }, { day: "2026-11-22" }])).toBe("2026-11-23");
    expect(latestDay([])).toBeNull();
  });
});

// 작업 0327 — 한 날짜 칸에 게시물 여러 개 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   읽는 규칙: 날짜 폴더 바로 아래 문구.md(지금 게시물) + 날짜 폴더 안 하위 폴더(영문 소문자 · 숫자 · 하이픈 이름)마다의 문구.md 를 각각 게시물로
//   builder 가 만들 것 — apps/admin/src/features/marketing/drafts/drafts.ts (순수 함수 · read-drafts.server.ts 는 파일을 읽는 얇은 겉)
//     Draft 에 두 칸 더함: sub: string | null (하위 폴더 이름 · 날짜 폴더 바로 아래 게시물은 null) · key: string (카드 key = postKey(day, sub))
//     export function subPostNames(names: string[]): string[]
//        날짜 폴더 안 이름들 → 하위 게시물 폴더 이름만 · 규칙 /^[a-z0-9][a-z0-9-]*$/ (파일 이름 · 점 · 밑줄 · 대문자 · 한글 · 하이픈으로 시작은 제외) · 이름 글자순
//     export function postKey(day: string, sub?: string | null): string      sub 가 없으면 day 그대로(지금 key) · 있으면 `${day}/${sub}`
//     export function parseDraft(day, md, image, imageFallback = null, sub: string | null = null): Draft   — sub · key 를 채움 · 나머지는 그대로
//     export function imageSources(day, r2Base, rawBase, hasRaw, sub?: string | null)
//        sub 가 없으면 지금 그대로 · 있으면 R2 `{r2Base}{day}-{sub}.jpg` · 저장소 raw `{rawBase}{day}/{sub}/image.png`(hasRaw 일 때만 · 아니면 null) — 끝 슬래시 유무와 상관없이 같은 주소
//     export function orderPosts<T extends { day: string; sub: string | null }>(posts: T[]): T[]
//        새 배열 · 최근 날부터 · 같은 날 안에서는 sub 가 null 인 것(날짜 폴더 바로 아래) 먼저 그다음 sub 이름 글자순 · 입력 순서와 상관없이 같은 결과
//     export type MarketingIo = { list(rel: string): string[] | null; read(rel: string): string | null; has(rel: string): boolean }
//        rel 은 docs/marketing 기준 — list("") = 날짜 폴더들 · list("2026-11-23") = 그 폴더 안 이름들 · read("2026-11-23/문구.md") · read("2026-11-23/yen-reel/문구.md") · has("2026-11-23/yen-reel/image.png")
//     export function collectDrafts(io: MarketingIo, bases: { r2Base: string; rawBase: string }): Draft[]
//        날짜(draftDays) 최근 날부터 · 날짜 폴더 문구.md 가 있으면 게시물 하나 · 하위 폴더마다 문구.md 가 있으면 게시물 하나(없는 하위 폴더 · 이름 규칙 밖은 읽지 않음) · orderPosts 순서 · 못 읽으면(list 가 null) 빈 목록
describe("subPostNames — 날짜 폴더 안 하위 게시물 폴더 이름 (작업 0327)", () => {
  it("규칙(영문 소문자 · 숫자 · 하이픈)에 맞는 이름만 · 이름 글자순", () => {
    expect(subPostNames(["yen-reel", "yen-carousel", "a1"])).toEqual(["a1", "yen-carousel", "yen-reel"]);
  });

  it("요구 1: 파일 이름 · 이름 규칙 밖은 읽지 않음 — 문구.md · image.png · 점 · 밑줄 · 대문자 · 한글 · 공백 · 하이픈 시작 · 빈 글", () => {
    expect(subPostNames(["문구.md", "image.png", "README.md", "notes.txt", "Yen", "yen_reel", "yen.reel", "엔화", "a b", "-x", "", "yen-reel"])).toEqual(["yen-reel"]);
  });

  it("빈 목록 · 날짜 모양 이름도 하위 게시물 이름으로는 규칙에 맞으면 허용(숫자 · 하이픈)", () => {
    expect(subPostNames([])).toEqual([]);
    expect(subPostNames(["2026-11-24"])).toEqual(["2026-11-24"]);
  });

  it("입력을 바꾸지 않음", () => {
    const names = ["b", "a"];
    subPostNames(names);
    expect(names).toEqual(["b", "a"]);
  });
});

describe("postKey · parseDraft 의 sub (작업 0327)", () => {
  it("요구 3: 날짜 폴더 바로 아래 게시물은 key = 날짜(지금 그대로) · 하위 게시물은 날짜/하위 폴더 이름 — 같은 날 여러 개여도 겹치지 않음", () => {
    expect(postKey("2026-11-23")).toBe("2026-11-23");
    expect(postKey("2026-11-23", null)).toBe("2026-11-23");
    expect(postKey("2026-11-23", "yen-reel")).toBe("2026-11-23/yen-reel");
    const keys = [postKey("2026-11-23"), postKey("2026-11-23", "yen-reel"), postKey("2026-11-23", "yen-carousel"), postKey("2026-11-22", "yen-reel")];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("parseDraft — sub 를 주면 sub · key 가 채워짐 · day 는 날짜 그대로(카드 날짜 표시) · 안 주면 sub null · key = 날짜", () => {
    const md = "## 본문\n안녕\n\n## 눌렀을 때 갈 주소\nhttps://flapfx.com";
    const sub = parseDraft("2026-11-23", md, "img", "fb", "yen-reel");
    expect(sub).toMatchObject({ day: "2026-11-23", sub: "yen-reel", key: "2026-11-23/yen-reel", body: "안녕", link: "https://flapfx.com", image: "img", imageFallback: "fb" });
    const top = parseDraft("2026-11-23", md, "img");
    expect(top).toMatchObject({ day: "2026-11-23", sub: null, key: "2026-11-23", imageFallback: null });
  });
});

describe("imageSources 의 하위 게시물 (작업 0327)", () => {
  const R2 = "https://pub-test.r2.dev/";
  const RAW = "https://raw.githubusercontent.com/o/r/main/docs/marketing/";

  it("요구 4: 하위 게시물 — R2 {날짜}-{하위 폴더}.jpg → 저장소 raw {날짜}/{하위 폴더}/image.png", () => {
    expect(imageSources("2026-11-23", R2, RAW, true, "yen-reel")).toEqual({ image: "https://pub-test.r2.dev/2026-11-23-yen-reel.jpg", imageFallback: `${RAW}2026-11-23/yen-reel/image.png` });
  });

  it("저장소에 image.png 가 없으면 되돌림 주소 null · 끝 슬래시 유무와 상관없이 같은 주소", () => {
    expect(imageSources("2026-11-23", R2, RAW, false, "yen-reel").imageFallback).toBeNull();
    expect(imageSources("2026-11-23", R2.replace(/\/$/, ""), RAW.replace(/\/$/, ""), true, "yen-reel")).toEqual(imageSources("2026-11-23", R2, RAW, true, "yen-reel"));
  });

  it("요구 5: sub 를 안 주거나 null 이면 지금 날짜 폴더 게시물 규칙 그대로", () => {
    const base = { image: "https://pub-test.r2.dev/2026-11-23.jpg", imageFallback: `${RAW}2026-11-23/image.png` };
    expect(imageSources("2026-11-23", R2, RAW, true)).toEqual(base);
    expect(imageSources("2026-11-23", R2, RAW, true, null)).toEqual(base);
    expect(imageSources("2026-11-23", R2, RAW, true, undefined)).toEqual(base);
  });

  it("하위 게시물의 두 주소가 같은 날 다른 하위 폴더와 겹치지 않음", () => {
    const a = imageSources("2026-11-23", R2, RAW, true, "yen-reel");
    const b = imageSources("2026-11-23", R2, RAW, true, "yen-carousel");
    const top = imageSources("2026-11-23", R2, RAW, true);
    expect(new Set([a.image, b.image, top.image]).size).toBe(3);
    expect(new Set([a.imageFallback, b.imageFallback, top.imageFallback]).size).toBe(3);
  });
});

describe("orderPosts — 같은 날 안의 순서 (작업 0327)", () => {
  const p = (day: string, sub: string | null) => ({ day, sub });

  it("요구 2: 최근 날부터 · 같은 날 안에서는 날짜 폴더 바로 아래 게시물 먼저, 그다음 하위 폴더 이름순", () => {
    const out = orderPosts([p("2026-11-22", null), p("2026-11-23", "yen-reel"), p("2026-11-23", null), p("2026-11-23", "yen-carousel"), p("2026-11-24", "x")]);
    expect(out).toEqual([p("2026-11-24", "x"), p("2026-11-23", null), p("2026-11-23", "yen-carousel"), p("2026-11-23", "yen-reel"), p("2026-11-22", null)]);
  });

  it("입력 순서와 상관없이 같은 결과 · 입력은 안 바뀜", () => {
    const a = [p("2026-11-23", "b"), p("2026-11-23", null), p("2026-11-22", null), p("2026-11-23", "a")];
    const want = [p("2026-11-23", null), p("2026-11-23", "a"), p("2026-11-23", "b"), p("2026-11-22", null)];
    expect(orderPosts(a)).toEqual(want);
    expect(orderPosts([...a].reverse())).toEqual(want);
    expect(a[0]).toEqual(p("2026-11-23", "b"));
  });

  it("다른 칸(본문 등)은 그대로 따라감 · 빈 입력은 빈 배열", () => {
    expect(orderPosts([{ day: "2026-11-22", sub: null, body: "x" }, { day: "2026-11-23", sub: null, body: "y" }]).map((d) => d.body)).toEqual(["y", "x"]);
    expect(orderPosts([])).toEqual([]);
  });
});

describe("collectDrafts — 저장소 글에서 게시물 모으기 (작업 0327)", () => {
  const R2 = "https://pub-test.r2.dev/";
  const RAW = "https://raw.githubusercontent.com/o/r/main/docs/marketing/";
  const md = (body: string) => `# 초안\n\n## 본문\n${body}\n\n## 눌렀을 때 갈 주소\nhttps://flapfx.com\n`;
  /** 메모리 위의 저장소 — files: 경로(docs/marketing 기준) → 글 · 빈 글("")은 있는 파일(그림) */
  function io(files: Record<string, string>, dirs: Record<string, string[]>) {
    return {
      list: (rel: string) => dirs[rel] ?? null,
      read: (rel: string) => (rel in files ? files[rel]! : null),
      has: (rel: string) => rel in files,
    };
  }
  const bases = { r2Base: R2, rawBase: RAW };

  // 11-23: 사용자가 올린 게시물(날짜 폴더 바로 아래) + 엔화 릴스 · 캐러셀(하위 폴더) · 이름 규칙 밖 · 문구 없는 폴더 / 11-22: 하나 / README · links 는 날짜가 아님
  const TREE = {
    files: {
      "2026-11-22/문구.md": md("22일"),
      "2026-11-22/image.png": "",
      "2026-11-23/문구.md": md("사용자 게시물"),
      "2026-11-23/image.png": "",
      "2026-11-23/yen-reel/문구.md": md("엔화 릴스"),
      "2026-11-23/yen-reel/image.png": "",
      "2026-11-23/yen-carousel/문구.md": md("엔화 캐러셀"),
      "2026-11-23/Bad_Name/문구.md": md("이름 규칙 밖"),
      "2026-11-23/empty-sub/image.png": "",
    } as Record<string, string>,
    dirs: {
      "": ["2026-11-22", "2026-11-23", "README.md", "links"],
      "2026-11-22": ["문구.md", "image.png"],
      "2026-11-23": ["문구.md", "image.png", "yen-reel", "yen-carousel", "Bad_Name", "empty-sub", "notes.txt"],
    } as Record<string, string[]>,
  };

  it("요구 1 · 2 · 3: 게시물 4개 — 최근 날부터 · 같은 날은 날짜 폴더 바로 아래 먼저 그다음 하위 폴더 이름순 · key 가 모두 다름 · 문구 없는 하위 폴더 · 이름 규칙 밖은 없음", () => {
    const out = collectDrafts(io(TREE.files, TREE.dirs), bases);
    expect(out.map((d) => d.key)).toEqual(["2026-11-23", "2026-11-23/yen-carousel", "2026-11-23/yen-reel", "2026-11-22"]);
    expect(new Set(out.map((d) => d.key)).size).toBe(out.length);
    expect(out.map((d) => d.body)).toEqual(["사용자 게시물", "엔화 캐러셀", "엔화 릴스", "22일"]);
    expect(out.map((d) => d.day)).toEqual(["2026-11-23", "2026-11-23", "2026-11-23", "2026-11-22"]);
    expect(out.map((d) => d.sub)).toEqual([null, "yen-carousel", "yen-reel", null]);
    expect(JSON.stringify(out)).not.toMatch(/이름 규칙 밖|empty-sub|Bad_Name/);
  });

  it("요구 4: 그림 주소 — 하위 게시물은 R2 {날짜}-{하위}.jpg · 저장소에 image.png 가 있으면 raw {날짜}/{하위}/image.png(없으면 null) · 날짜 폴더 게시물은 지금 그대로", () => {
    const out = collectDrafts(io(TREE.files, TREE.dirs), bases);
    const by = (k: string) => out.find((d) => d.key === k)!;
    expect(by("2026-11-23")).toMatchObject({ image: `${R2}2026-11-23.jpg`, imageFallback: `${RAW}2026-11-23/image.png` });
    expect(by("2026-11-23/yen-reel")).toMatchObject({ image: `${R2}2026-11-23-yen-reel.jpg`, imageFallback: `${RAW}2026-11-23/yen-reel/image.png` });
    expect(by("2026-11-23/yen-carousel")).toMatchObject({ image: `${R2}2026-11-23-yen-carousel.jpg`, imageFallback: null });
  });

  it("글 칸은 parseDraft 와 같음 — 주소 · 본문 · 해시태그 등 (하위 게시물도)", () => {
    const out = collectDrafts(io(TREE.files, TREE.dirs), bases);
    const reel = out.find((d) => d.key === "2026-11-23/yen-reel")!;
    expect(reel).toEqual(parseDraft("2026-11-23", TREE.files["2026-11-23/yen-reel/문구.md"]!, `${R2}2026-11-23-yen-reel.jpg`, `${RAW}2026-11-23/yen-reel/image.png`, "yen-reel"));
    expect(reel.link).toBe("https://flapfx.com");
  });

  it("요구 5: 날짜 폴더 게시물만 있는 지금 모습 그대로 — 게시물 수 · 순서 · key = 날짜 · sub null · 그림 주소 규칙", () => {
    const files = { "2026-11-20/문구.md": md("20일"), "2026-11-22/문구.md": md("22일"), "2026-11-22/image.png": "" };
    const dirs = { "": ["2026-11-20", "2026-11-22", "README.md"], "2026-11-20": ["문구.md"], "2026-11-22": ["문구.md", "image.png"] };
    const out = collectDrafts(io(files, dirs), bases);
    expect(out.map((d) => d.key)).toEqual(["2026-11-22", "2026-11-20"]);
    expect(out.every((d) => d.sub === null)).toBe(true);
    expect(out[0]).toEqual(parseDraft("2026-11-22", files["2026-11-22/문구.md"], `${R2}2026-11-22.jpg`, `${RAW}2026-11-22/image.png`));
    expect(out[1]).toEqual(parseDraft("2026-11-20", files["2026-11-20/문구.md"], `${R2}2026-11-20.jpg`, null));
  });

  it("날짜 폴더 바로 아래 문구.md 가 없어도 하위 게시물만 있으면 읽음 · 둘 다 없는 날은 없음", () => {
    const files = { "2026-11-24/yen-reel/문구.md": md("릴스만"), "2026-11-25/image.png": "" };
    const dirs = { "": ["2026-11-24", "2026-11-25"], "2026-11-24": ["yen-reel"], "2026-11-25": ["image.png"] };
    const out = collectDrafts(io(files, dirs), bases);
    expect(out.map((d) => d.key)).toEqual(["2026-11-24/yen-reel"]);
  });

  it("못 읽으면 빈 목록 — 저장소 목록 null · 날짜 폴더 목록 null 이어도 던지지 않음", () => {
    expect(collectDrafts({ list: () => null, read: () => null, has: () => false }, bases)).toEqual([]);
    const files = { "2026-11-22/문구.md": md("22일") };
    const out = collectDrafts({ list: (rel) => (rel === "" ? ["2026-11-22", "2026-11-23"] : null), read: (rel) => files[rel as keyof typeof files] ?? null, has: () => false }, bases);
    expect(out.map((d) => d.key)).toEqual(["2026-11-22"]); // 날짜 폴더 목록을 못 읽어도 바로 아래 문구.md 는 읽음
  });
});

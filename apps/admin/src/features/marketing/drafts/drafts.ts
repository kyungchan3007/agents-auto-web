// 알리기 소재 초안 (작업 0307) — geo 가 쓰는 docs/marketing/YYYY-MM-DD/문구.md 를 절(## 제목)로 나눔 · 순수 함수
//   절 이름은 team.md geo 절의 초안 묶음과 같음: 본문 · 해시태그 · 이미지 대체 글 · 쓴 숫자와 받은 날짜 · 눌렀을 때 갈 주소
export type Draft = {
  day: string;
  /** 날짜 폴더 안 하위 게시물 폴더 이름 — 날짜 폴더 바로 아래 게시물은 null (작업 0327) */
  sub: string | null;
  /** 카드 key — 날짜 · 하위 게시물이면 날짜/하위 폴더 이름 (같은 날 여러 개여도 겹치지 않음) */
  key: string;
  body: string;
  tags: string;
  alt: string;
  numbers: string[];
  link: string | null;
  image: string | null;
  /** 처음 주소(R2)가 안 열릴 때 바꿔 보는 주소(저장소 raw) — 없으면 null */
  imageFallback: string | null;
};

export function sections(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  let cur: string | null = null;
  for (const line of md.split("\n")) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      cur = h[1] ?? null;
      if (cur) out[cur] = "";
      continue;
    }
    if (cur) out[cur] += `${line}\n`;
  }
  for (const k of Object.keys(out)) out[k] = (out[k] ?? "").trim();
  return out;
}

/** 문구.md 한 편 → 초안 · 빠진 절은 빈 글(지어내지 않음) */
export function parseDraft(day: string, md: string, image: string | null, imageFallback: string | null = null, sub: string | null = null): Draft {
  const s = sections(md);
  const link = (s["눌렀을 때 갈 주소"] ?? "").split("\n").map((l) => l.trim()).find((l) => /^https?:\/\//.test(l)) ?? null;
  return {
    day,
    sub,
    key: postKey(day, sub),
    body: s["본문"] ?? "",
    tags: s["해시태그"] ?? "",
    alt: s["이미지 대체 글"] ?? "",
    numbers: (s["쓴 숫자와 받은 날짜"] ?? "").split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean),
    link,
    image,
    imageFallback,
  };
}

/** 폴더 이름이 날짜(YYYY-MM-DD)인 것만 · 최근 날부터 */
export const draftDays = (names: string[]) => names.filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n)).sort().reverse();

/** 그림 주소 고르기 (작업 0310 · 0327) — 먼저 R2 공개 주소({날짜}.jpg · 하위 게시물은 {날짜}-{하위}.jpg) · 저장소에 원본 파일이 있으면 raw 주소를 되돌림 주소로 · 끝 슬래시 유무와 상관없이 같은 주소 */
export function imageSources(day: string, r2Base: string, rawBase: string, hasRaw: boolean, sub: string | null = null): { image: string; imageFallback: string | null } {
  const slash = (b: string) => (b.endsWith("/") ? b : `${b}/`);
  const name = sub ? `${day}-${sub}` : day;
  const dir = sub ? `${day}/${sub}` : day;
  return { image: `${slash(r2Base)}${name}.jpg`, imageFallback: hasRaw ? `${slash(rawBase)}${dir}/image.png` : null };
}

/** 카드 key — 날짜 폴더 바로 아래 게시물은 날짜 그대로 · 하위 게시물은 날짜/하위 폴더 이름 (작업 0327) */
export const postKey = (day: string, sub: string | null = null) => (sub ? `${day}/${sub}` : day);

/** 날짜 폴더 안 이름들 → 하위 게시물 폴더 이름만 (영문 소문자 · 숫자 · 하이픈 · 하이픈으로 시작 안 함) · 이름 글자순 (작업 0327) */
export const subPostNames = (names: string[]) => names.filter((n) => /^[a-z0-9][a-z0-9-]*$/.test(n)).sort();

/** 최근 날부터 · 같은 날 안에서는 날짜 폴더 바로 아래 게시물(sub 없음) 먼저 그다음 하위 폴더 이름순 · 새 배열 (작업 0327) */
export const orderPosts = <T extends { day: string; sub: string | null }>(posts: T[]): T[] =>
  [...posts].sort((a, b) => (a.day === b.day ? (a.sub ?? "").localeCompare(b.sub ?? "") : a.day < b.day ? 1 : -1));

/** 저장소 글을 읽는 겉 — rel 은 docs/marketing 기준 · list("") = 날짜 폴더들 (작업 0327) */
export type MarketingIo = { list(rel: string): string[] | null; read(rel: string): string | null; has(rel: string): boolean };

/** 저장소 글에서 게시물 모으기 — 날짜 폴더 바로 아래 문구.md 와 하위 폴더마다 문구.md 를 각각 게시물로 · 못 읽으면 빈 목록 (작업 0327) */
export function collectDrafts(io: MarketingIo, bases: { r2Base: string; rawBase: string }): Draft[] {
  const days = io.list("");
  if (!days) return [];
  const posts = draftDays(days).flatMap((day) =>
    [null, ...subPostNames(io.list(day) ?? [])].flatMap((sub) => {
      const dir = sub ? `${day}/${sub}` : day;
      const md = io.read(`${dir}/문구.md`);
      if (md === null) return [];
      const { image, imageFallback } = imageSources(day, bases.r2Base, bases.rawBase, io.has(`${dir}/image.png`), sub);
      return [parseDraft(day, md, image, imageFallback, sub)];
    }),
  );
  return orderPosts(posts);
}

/** 그림이 안 열렸을 때 다음에 보일 주소 — 지금 주소가 되돌림 주소가 아니고 되돌림 주소가 있으면 그것 · 아니면 null(그림 없음) */
export function nextImage(current: string | null, d: Pick<Draft, "imageFallback">): string | null {
  return d.imageFallback && current !== d.imageFallback ? d.imageFallback : null;
}

/** 저장소 원본 파일 주소 — github.com/<저장소> → raw.githubusercontent.com/<저장소>/main/docs/marketing/ (작업 0310 · 0312 에 page.tsx 에서 옮김) */
export const rawBase = (repoUrl: string) => `${repoUrl.replace("https://github.com/", "https://raw.githubusercontent.com/")}/main/docs/marketing/`;

/** 링크 글 — 앞의 https:// 를 뺀 주소 */
export const linkText = (link: string) => link.replace(/^https?:\/\//, "");

/** 본문 복사 글 — 본문과 해시태그를 빈 줄로 이음 */
export const copyBody = (d: Pick<Draft, "body" | "tags">) => [d.body, d.tags].filter(Boolean).join("\n\n");

/** 최근 초안 날짜 — 목록은 최근 날부터라 맨 앞 · 없으면 null */
export const latestDay = (drafts: Pick<Draft, "day">[]) => drafts[0]?.day ?? null;

/** 숫자 칸 날짜 — "2026-11-23" → "11-23" */
export const shortDay = (day: string) => day.slice(5);

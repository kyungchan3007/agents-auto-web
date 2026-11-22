// 알리기 소재 초안 (작업 0304) — geo 가 쓰는 docs/marketing/YYYY-MM-DD/문구.md 를 절(## 제목)로 나눔 · 순수 함수
//   절 이름은 team.md geo 절의 초안 묶음과 같음: 본문 · 해시태그 · 이미지 대체 글 · 쓴 숫자와 받은 날짜 · 눌렀을 때 갈 주소
export type Draft = {
  day: string;
  body: string;
  tags: string;
  alt: string;
  numbers: string[];
  link: string | null;
  image: string | null;
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
export function parseDraft(day: string, md: string, image: string | null): Draft {
  const s = sections(md);
  const link = (s["눌렀을 때 갈 주소"] ?? "").split("\n").map((l) => l.trim()).find((l) => /^https?:\/\//.test(l)) ?? null;
  return {
    day,
    body: s["본문"] ?? "",
    tags: s["해시태그"] ?? "",
    alt: s["이미지 대체 글"] ?? "",
    numbers: (s["쓴 숫자와 받은 날짜"] ?? "").split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean),
    link,
    image,
  };
}

/** 폴더 이름이 날짜(YYYY-MM-DD)인 것만 · 최근 날부터 */
export const draftDays = (names: string[]) => names.filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n)).sort().reverse();

// 어드민 찾기 — 낱자 그대로 또는 한글 초성으로 찾고, 찾은 글자 자리를 돌려줌 (작업 0303 · 순수 함수)
//   "관세" · "ㄱㅅ" → "관세청 과세환율" 의 앞 두 글자 · 띄어쓰기 · 대소문자는 무시

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

/** 한 글자의 초성 (한글 음절이 아니면 그대로) */
export function choOf(c: string): string {
  const k = c.charCodeAt(0) - 0xac00;
  return k >= 0 && k < 11172 ? (CHO[Math.floor(k / 588)] ?? c) : c;
}

export const isChoOnly = (q: string) => q.length > 0 && [...q].every((c) => CHO.includes(c));

export type Match = { hits: number[]; score: number };

/** text 안에서 q 를 찾음 — 못 찾으면 null · hits 는 text 의 글자 자리(띄어쓰기 포함 기준) · score 가 클수록 앞에 둠 */
export function match(text: string, q: string): Match | null {
  const n = q.toLowerCase().replace(/\s+/g, "");
  if (!n) return { hits: [], score: 0 };
  const chars = [...text];
  const map: number[] = [];
  const flat: string[] = [];
  chars.forEach((c, i) => {
    if (!/\s/.test(c)) {
      map.push(i);
      flat.push(c.toLowerCase());
    }
  });
  const plain = flat.join("");
  let at = plain.indexOf(n);
  let score = 3;
  if (at < 0 && isChoOnly(n)) {
    at = flat.map(choOf).join("").indexOf(n);
    score = 2;
  }
  if (at < 0) return null;
  return { hits: map.slice(at, at + [...n].length), score: score + (at === 0 ? 1 : 0) };
}

/** 찾은 글자를 나눠 그리기 좋게 — [글, 찾은 글자인가] 조각들 */
export function pieces(text: string, hits: number[]): [string, boolean][] {
  const set = new Set(hits);
  const out: [string, boolean][] = [];
  [...text].forEach((c, i) => {
    const on = set.has(i);
    const last = out.at(-1);
    if (last && last[1] === on) last[0] += c;
    else out.push([c, on]);
  });
  return out;
}

// 제목 속 숫자 · 금액 강조 — 문장을 [글 · 숫자] 조각으로 나눔 (순수 함수 · 작업 0175 · 테스트 emphasis.test.ts)
//   숫자 · 퍼센트 · 통화 기호 · 단위(% 원 엔 달러 월 일 년)를 한 덩어리 · 조사("의" "에" "이")는 덩어리 밖 · 이어 붙이면 원래 문장
export type Piece = { text: string; num: boolean };

// 부호(+ -)는 단어 앞에서만 ("2026-11-13" 의 "-11" 은 부호가 아님) · 통화 기호($ ¥ € £ ฿ ₫)는 숫자 바로 앞 · 숫자는 쉼표 · 소수점 허용 · 단위가 바로 붙으면 함께
const NUM = /(?:(?<![\w가-힣])[+-])?[$¥€£฿₫]?\d[\d,]*(?:\.\d+)?(?:%|원|엔|달러|월|일|년)?/g;

export function splitNumbers(sentence: string): Piece[] {
  const out: Piece[] = [];
  const push = (text: string, num: boolean) => {
    if (!text) return;
    const last = out.at(-1);
    if (last && last.num === num) last.text += text;
    else out.push({ text, num });
  };
  let at = 0;
  for (const m of sentence.matchAll(NUM)) {
    const i = m.index ?? 0;
    push(sentence.slice(at, i), false);
    // 쉼표로 끝나는 덩어리("4월," 가 아니라 "1,")는 쉼표를 글로 돌려줌
    const tok = m[0].replace(/,+$/, "");
    push(tok, true);
    push(m[0].slice(tok.length), false);
    at = i + m[0].length;
  }
  push(sentence.slice(at), false);
  return out;
}

const PRICEY = /높습니다|높고|높은|비쌉니다|비싼|비싸|올랐습니다|올랐|붙습니다|붙고/;
const CHEAP = /낮습니다|낮고|낮은|내렸|없이|저렴/;

/** 비싼 쪽을 뜻하는 문장이면 "expensive" · 싼 쪽 말이 함께 있으면 · 그 밖은 "neutral" */
export function numberTone(sentence: string): "neutral" | "expensive" {
  if (!PRICEY.test(sentence)) return "neutral";
  // "비싼 · 비싸" 안의 "싼 · 싸" 는 싼 쪽 말이 아님
  const rest = sentence.replace(/비싼|비싸|비쌉니다/g, "");
  return CHEAP.test(rest) || /(?:^|[^비])[싼싸]/.test(rest) ? "neutral" : "expensive";
}

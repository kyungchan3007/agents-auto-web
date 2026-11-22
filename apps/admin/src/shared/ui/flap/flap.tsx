"use client";

// 안내판 숫자 (작업 0303) — 숫자 글자가 몇 번 넘어간 뒤 제 값에서 멈춤(왼쪽부터 차례로 · use-flap-digits) · 화면 읽기는 처음부터 최종 값
//   서버 HTML 에는 최종 값이 그대로 있음(검색 · 화면 읽기 · 자바스크립트 없을 때) · replay 가 바뀌면 다시 넘어감
import { cellStyle } from "./flap-digits";
import { useFlapDigits } from "./use-flap-digits";

export function Flap({ text, order = 0, replay = 0 }: { text: string; order?: number; replay?: number }) {
  const ref = useFlapDigits(text, order, replay);
  return (
    <span ref={ref} className="adm-flap" aria-label={text} role="img">
      {[...text].map((c, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 글자 자리가 곧 키
        <i key={i} aria-hidden data-f={c} style={cellStyle(c)}>
          {c}
        </i>
      ))}
    </span>
  );
}

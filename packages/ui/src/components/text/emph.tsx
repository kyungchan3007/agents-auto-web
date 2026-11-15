// 제목 속 숫자 · 금액 강조 — 큰 제목 · 구간 제목 안의 숫자를 공통 부품 하나로 (작업 0175 · 화면마다 따로 칠하지 않음)
//   하늘 종이 위: 글자색 그대로 + 해 노랑(--hav-sun) 형광펜 띠(글자 아래 40~50%) · 비싼 쪽을 뜻하면 주홍 글자 · 노란 글자는 하늘 종이 위 대비가 부족해 쓰지 않음
//   바다 띠(울트라마린) 위: 해 노랑 글자 · 사진 울트라마린 막(PhotoHeader veil="ultramarine") 안에서도 같음 (막이 group/photo 로 알려 줌)
//   이 부품만 그라데이션을 씀 (장식이 아니라 형광펜 띠)
import type { ReactNode } from "react";
import { numberTone, splitNumbers } from "../../lib/emphasis";

type Bg = "light" | "sea";
type Tone = "neutral" | "expensive";

const LIGHT_NEUTRAL = "box-decoration-clone bg-[linear-gradient(transparent_55%,var(--hav-sun)_55%)] group-data-[veil=ultramarine]/photo:bg-none group-data-[veil=ultramarine]/photo:text-sun";
const LIGHT_EXPENSIVE = "text-expensive group-data-[veil=ultramarine]/photo:text-sun";
const SEA = "text-figure";

export function Emph({ children, bg = "light", tone = "neutral" }: { children: ReactNode; bg?: Bg; tone?: Tone }) {
  const cls = bg === "sea" ? SEA : tone === "expensive" ? LIGHT_EXPENSIVE : LIGHT_NEUTRAL;
  return (
    <span data-testid="emph" data-tone={tone} data-bg={bg} className={cls}>
      {children}
    </span>
  );
}

/** 문장을 숫자 조각으로 나눠 숫자만 Emph 로 — tone 을 안 주면 문장의 뜻(numberTone)으로 */
export function EmphText({ text, bg = "light", tone }: { text: string; bg?: Bg; tone?: Tone }) {
  const t = tone ?? numberTone(text);
  return (
    <>
      {splitNumbers(text).map((p, i) =>
        p.num ? (
          <Emph key={`${i}-${p.text}`} bg={bg} tone={t}>
            {p.text}
          </Emph>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

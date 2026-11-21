// 제목 속 숫자 · 금액 강조 — 큰 제목 · 구간 제목 안의 숫자를 공통 부품 하나로 (작업 0175 · 화면마다 따로 칠하지 않음)
//   하늘 종이 위: 글자색 그대로 + 해 노랑(--hav-sun) 형광펜 띠(글자 아래 40~50%) · 비싼 쪽을 뜻하면 주홍 글자 · 노란 글자는 하늘 종이 위 대비가 부족해 쓰지 않음
//   바다 띠(울트라마린) 위: 해 노랑 글자
//   이 부품만 그라데이션을 씀 (장식이 아니라 형광펜 띠)
import type { ReactNode } from "react";
import { numberTone, splitNumbers } from "../../lib/emphasis";

type Bg = "light" | "sea";
type Tone = "neutral" | "expensive";

// 화면이 뜨고 0.35초 뒤 띠가 왼쪽에서 오른쪽으로 0.6초에 걸쳐 그어짐(emph-sweep · tokens.css) · 끝 모양은 아래 값 그대로 · 움직임 줄이기는 처음부터 그어져 있음 · 자바스크립트 없이 CSS 만 (작업 0255)
// 띠는 글자 폭에 맞추고(왼쪽 밖 · 아래로 삐져나오지 않게) 높이는 글자 위쪽 64% ~ 90% 구간만 (작업 0248 → 0249 · 24번 · 예전: 55% 부터 아래 끝까지 · 양쪽 0.05em 안쪽 가운데 맞춤 · 작업 0209)
const LIGHT_NEUTRAL = "box-decoration-clone bg-[linear-gradient(transparent_64%,var(--hav-sun)_64%,var(--hav-sun)_90%,transparent_90%)] bg-size-[100%_100%] bg-position-[0_0] bg-no-repeat animate-[emph-sweep_0.6s_cubic-bezier(0.22,1,0.36,1)_0.35s_backwards] motion-reduce:animate-none";
const LIGHT_EXPENSIVE = "text-expensive";
const SEA = "text-figure";
// 파랑 바탕 + underline: 노란 글자는 그대로 두고 글자 높이 82% ~ 90% 에 가는 노란 밑줄 · 글자 폭 · 줄마다 · 같은 emph-sweep 움직임 (작업 0257 · 여행 물가 머리만 켬)
const SEA_UNDERLINE = "text-figure box-decoration-clone bg-[linear-gradient(transparent_82%,var(--hav-sun)_82%,var(--hav-sun)_90%,transparent_90%)] bg-size-[100%_100%] bg-position-[0_0] bg-no-repeat animate-[emph-sweep_0.6s_cubic-bezier(0.22,1,0.36,1)_0.35s_backwards] motion-reduce:animate-none";

export function Emph({ children, bg = "light", tone = "neutral", underline = false }: { children: ReactNode; bg?: Bg; tone?: Tone; /** 파랑 바탕에서 가는 노란 밑줄을 더함 (기본 꺼짐) */ underline?: boolean }) {
  const cls = bg === "sea" ? (underline ? SEA_UNDERLINE : SEA) : tone === "expensive" ? LIGHT_EXPENSIVE : LIGHT_NEUTRAL;
  return (
    <span data-testid="emph" data-tone={tone} data-bg={bg} className={cls}>
      {children}
    </span>
  );
}

/** 문장을 숫자 조각으로 나눠 숫자만 Emph 로 — tone 을 안 주면 문장의 뜻(numberTone)으로 */
export function EmphText({ text, bg = "light", tone, underline = false }: { text: string; bg?: Bg; tone?: Tone; underline?: boolean }) {
  const t = tone ?? numberTone(text);
  return (
    <>
      {splitNumbers(text).map((p, i) =>
        p.num ? (
          <Emph key={underline ? i : `${i}-${p.text}`} bg={bg} tone={t} underline={underline}>
            {p.text}
          </Emph>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

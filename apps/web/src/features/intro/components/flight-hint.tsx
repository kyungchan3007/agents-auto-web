// 4단계 안내 — "스크롤해서 이륙하세요" · 진행 막대 · 이전(게이트로) (그리기만 · 작업 0185)
// 바퀴가 땅에서 떨어지면 그다음은 자동 · 방향키 ↓ ↑ 도 됨
import type { IntroView } from "../hooks/use-intro";

export function FlightHint({ s }: { s: IntroView }) {
  if (s.step !== 4) return null;
  return (
    <div data-testid="intro-hint" className="fixed bottom-7 left-1/2 z-[3] w-[380px] -translate-x-1/2 rounded-2xl border border-line bg-card/95 px-[18px] py-3.5 shadow-[0_18px_40px_-18px_rgba(22,36,110,0.35)]">
      <b className="flex items-center gap-2.5 text-lg font-black">
        <span aria-hidden className="relative inline-block h-6 w-4 rounded-[9px] border-2 border-fg">
          <span className="absolute top-1 left-1/2 -ml-px h-1.5 w-0.5 rounded-sm bg-accent" />
        </span>
        스크롤해서 이륙하세요
      </b>
      <span className="text-[13px] text-fg-2">바퀴가 땅에서 떨어지면 그다음은 자동으로 이어집니다 (방향키 ↓ ↑ 도 됩니다)</span>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] bg-surface-2">
        <i ref={s.refs.meter} className="block h-full w-0 bg-cheap" />
      </div>
      <button type="button" data-testid="intro-back" onClick={s.back} className="mt-2 border-0 bg-transparent py-0.5 text-[13px] font-semibold text-fg-2 hover:text-fg hover:underline">
        ← 이전 · 게이트로
      </button>
    </div>
  );
}

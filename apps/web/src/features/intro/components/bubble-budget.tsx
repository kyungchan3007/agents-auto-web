// 2단계 말풍선 — 환전소: 예산(원)을 넣으면 오늘 환율로 현지 돈 · 최근 90일 판정 · 물가(한국 100) (그리기만 · 작업 0185)
// 환율이 없는 나라는 환산 결과 칸이 없음 — 계산하지 못했다고 알림 (지어내지 않음)
import type { IntroView } from "../hooks/use-intro";

export function BubbleBudget({ s }: { s: IntroView }) {
  const c = s.country;
  if (!c) return null;
  const hasRate = c.base !== null;
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[0.9375rem] font-bold text-accent">
          {c.country} · {s.pickedCity}로 가시는군요
        </p>
        <button type="button" data-testid="intro-back" onClick={s.back} className="border-0 bg-transparent py-0.5 text-[13px] font-semibold text-fg-2 hover:text-fg hover:underline">
          ← 이전
        </button>
      </div>
      <h2 className="m-0 text-[28px] leading-tight font-bold tracking-tight text-fg">얼마나 환전할까요?</h2>
      <label className="flex items-center gap-2 rounded-[14px] border border-line bg-surface px-4 py-1.5 focus-within:border-cheap">
        <input
          data-testid="intro-budget"
          data-autofocus
          inputMode="numeric"
          aria-label="환전할 금액(원)"
          value={s.budgetText}
          onChange={(e) => s.setBudgetText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") s.next2();
          }}
          className="min-w-0 flex-1 border-0 bg-transparent text-[28px] font-bold text-fg tabular-nums"
        />
        <span className="font-semibold text-fg-2">원</span>
      </label>
      {hasRate ? (
        <div className="flex flex-wrap items-baseline gap-2.5">
          {s.outText && (
            <strong data-testid="intro-out" className="bg-[linear-gradient(transparent_55%,var(--hav-sun)_55%)] text-[28px] font-bold tracking-tight text-cheap tabular-nums">
              {s.outText}
            </strong>
          )}
          <span className="text-[13px] text-fg-2">{s.rateNote}</span>
        </div>
      ) : null}
      <p className={`m-0 flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2.5 text-[15px] font-semibold ${hasRate && c.signal ? "" : "text-expensive"}`}>
        <span aria-hidden className={`size-2.5 flex-none rounded-full ${hasRate && c.signal ? "bg-cheap" : "bg-expensive"}`} />
        {s.pinLine}
      </p>
      <p className="m-0 text-xs text-fg-2">{s.priceLine}</p>
      <button type="button" data-testid="intro-next" onClick={s.next2} className="w-full rounded-pill bg-cheap py-3 text-base font-bold text-on-accent hover:bg-pin-ink">
        다음 · 게이트로
      </button>
    </div>
  );
}

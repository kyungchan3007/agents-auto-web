// 3단계 말풍선 — 게이트: "이번 달 11월에 떠나요" · 항공료 한 줄(홈 여행 타이밍과 같은 계산) · 탑승하기 → 탑승권 출력 (그리기만 · 작업 0185)
import type { IntroView } from "../hooks/use-intro";

export function BubbleGate({ s }: { s: IntroView }) {
  const printing = s.boardingPrinting !== "off";
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[0.9375rem] font-bold text-accent">{printing ? "즐거운 여행 되세요" : "탑승 수속을 시작합니다"}</p>
        {!printing && (
          <button type="button" data-testid="intro-back" onClick={s.back} className="border-0 bg-transparent py-0.5 text-[13px] font-semibold text-fg-2 hover:text-fg hover:underline">
            ← 이전
          </button>
        )}
      </div>
      <h2 className="m-0 text-[28px] leading-tight font-bold tracking-tight text-fg">{printing ? "탑승권을 출력합니다" : `이번 달 ${s.month}월에 떠나요`}</h2>
      {!printing && (
        <>
          <p className="m-0 flex items-center gap-2.5 rounded-[0.875rem] bg-surface-2 px-3 py-2.5 text-[15px] font-semibold">
            <span aria-hidden className="size-2.5 flex-none rounded-full bg-cheap" />
            {s.airfareLine}
          </p>
          <p className="m-0 text-xs text-fg-2">통계청 국제항공료 물가지수 기준</p>
          <button type="button" data-testid="intro-boardbtn" data-autofocus onClick={s.printTicket} className="w-full rounded-pill bg-cheap py-3 text-base font-bold text-on-accent hover:bg-pin-ink">
            탑승하기
          </button>
        </>
      )}
      {printing && <div aria-hidden className="mt-1 h-2.5 rounded-[0.375rem] bg-pin-ink" />}
    </div>
  );
}

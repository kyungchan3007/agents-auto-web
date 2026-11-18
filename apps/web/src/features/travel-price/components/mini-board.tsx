// 작은 출발 안내판 — 탑승권 오른쪽 "가장 싼 달" 칸 (작업 0218 리뷰 · 시안처럼 칸 높이 약 44px) · 움직임 없이 글자만 (머리 큰 글자판은 FlapBoard 가 처음 한 번 넘어감)
// 글자 하나 = 한 칸 · 칸 가운데 이음선 · 노랑 글자 · 화면 읽기 도구는 판 전체를 label 한 문장으로 (칸 글자는 읽지 않음)
export function MiniBoard({ text, label }: { text: string; label: string }) {
  return (
    <div data-testid="flap-board" role="img" aria-label={label} className="inline-flex max-w-full gap-[3px] rounded-lg bg-pin-ink p-2">
      {Array.from(text).map((c, i) => (
        <span key={i} aria-hidden className="relative grid h-11 w-8 min-w-0 shrink place-items-center rounded-[3px] bg-flap-cell font-display text-[1.5rem] leading-none font-extrabold tracking-display text-sun tabular-nums">
          {c === " " ? "" : c}
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
        </span>
      ))}
    </div>
  );
}

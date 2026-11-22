// 관세청 과세환율 글자판 — 출발 안내판 모양(B · 칸 이음선 · 노랑 글자)의 작은 판 (작업 0221 · 움직임 없이 글자만 · 큰 글자판 FlapBoard 는 처음 한 번 넘어감)
// 글자 하나 = 한 칸 · 화면 읽기 도구는 판 전체를 label 한 문장으로 (칸 글자는 읽지 않음)
export function CustomsBoard({ text, label }: { text: string; label: string }) {
  return (
    <div data-testid="flap-board" role="img" aria-label={label} className="inline-flex max-w-full gap-[3px] rounded-lg bg-pin-ink p-1.5">
      {Array.from(text).map((c, i) => (
        <span key={i} aria-hidden className="relative isolate grid h-9 w-6 min-w-0 shrink place-items-center rounded-[3px] bg-flap-cell font-display text-[1.25rem] leading-none font-extrabold tracking-display text-sun tabular-nums">
          {c === " " ? "" : c}
          <span aria-hidden className="absolute inset-x-0 top-1/2 -z-10 h-px bg-on-band" />
        </span>
      ))}
    </div>
  );
}

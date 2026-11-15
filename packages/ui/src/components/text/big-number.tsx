/** 큰 숫자 — Gasoek One · 숫자는 자릿수가 같은 폭(tabular-nums) · 숫자 색(figure: 하늘 종이 위 울트라마린 · 바다 띠 위 해 노랑) */
export function BigNumber({ value, unit, label }: { value: string; unit?: string; label?: string }) {
  return (
    <div>
      {label && <p className="text-eyebrow font-semibold text-fg-2">{label}</p>}
      <p className="font-display text-hero font-normal tracking-tighter tabular-nums">
        <span className="text-figure">{value}</span>
        {unit && <span className="ml-2 text-title text-fg">{unit}</span>}
      </p>
    </div>
  );
}

// 1단계 말풍선 — 안내 직원 "어디로 떠나세요?" · 출발 안내판(입력하면 칸이 넘어가며 "ICN → 도시" · 오늘 매매기준율) · 검색칸 · 칩 (그리기만 · 작업 0185)
import type { IntroView } from "../state/use-intro";
import { BOARD_COLS } from "../state/flow";
import { IntroCells } from "../pass/intro-cells";

export function BubbleSearch({ s }: { s: IntroView }) {
  return (
    <div className="grid gap-3">
      <p className="m-0 text-[0.9375rem] font-bold text-accent">안녕하세요, Flapfx입니다!</p>
      <h2 className="m-0 text-[28px] leading-tight font-bold tracking-tight text-fg">어디로 떠나세요?</h2>
      <div className="rounded-[14px] bg-pin-ink p-3" aria-hidden>
        <div className="mx-0.5 mb-2 flex justify-between text-[12px] font-bold tracking-wider text-foam/70">
          <span>DEPARTURES · 출발</span>
          <span>오늘 매매기준율</span>
        </div>
        <IntroCells testId="intro-frow" text={s.rows[0]} cols={BOARD_COLS} />
        <IntroCells testId="intro-frow" text={s.rows[1]} cols={BOARD_COLS} tone="white" className="mt-1" />
      </div>
      <form
        autoComplete="off"
        className="flex items-center gap-2 rounded-[14px] border border-line bg-surface py-1 pr-1 pl-3.5 focus-within:border-cheap"
        onSubmit={(e) => {
          e.preventDefault();
          s.onSearchSubmit();
        }}
      >
        <input
          data-testid="intro-search"
          data-autofocus
          aria-label="나라나 도시"
          placeholder="나라나 도시를 입력하세요 (예: 다낭, 파리)"
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[18px] font-semibold text-fg placeholder:font-normal placeholder:text-fg-2"
        />
        <button type="submit" className="inline-flex items-center justify-center rounded-pill bg-cheap px-5 py-2 text-[0.9375rem] font-semibold text-on-accent hover:bg-pin-ink">
          출발
        </button>
      </form>
      <div className="flex min-h-[34px] items-center gap-1.5 overflow-hidden">
        {s.searching && s.hits.length === 0 ? (
          <span className="text-[13px] font-semibold whitespace-nowrap text-expensive">&quot;{s.query.trim()}&quot; 은(는) 아직 데이터가 없는 곳입니다</span>
        ) : (
          s.hits.map((h, i) => (
            <button
              key={`${h.country.iso}-${h.city}`}
              type="button"
              data-testid="intro-chip"
              onClick={() => s.choose(h)}
              onMouseEnter={() => s.hover(i)}
              onMouseLeave={() => s.hover(null)}
              onFocus={() => s.hover(i)}
              onBlur={() => s.hover(null)}
              className="flex-none rounded-pill border border-line bg-card px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-fg hover:border-cheap focus-visible:border-cheap"
            >
              {h.country.country}
              <small className="ml-1 text-[12px] font-normal text-fg-2">{h.city}</small>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

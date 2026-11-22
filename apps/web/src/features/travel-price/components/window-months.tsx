"use client";

// 여행 타이밍 "창밖으로 보는 12달" — hero 바로 아래 새 구역 (작업 0229 · 모션 1번) · 날개 그림 없음
//   왼쪽(휴대폰은 위): 비행기 창 — 창밖 계절 풍경(캔버스) · 처음엔 덮개가 닫혀 있다가 화면에 보이면 올라감(서버가 그린 첫 그림부터 닫힘 · globals.css) · "다시 보기"를 누를 때만 닫혔다 열림
//   오른쪽(휴대폰은 아래): 달 글자판 · 계절 · 꼬리표 · 같은 달 평균 지수(홈 12달 막대와 같은 계산) · 달 고르기 막대 · 다시 보기 · 설명
//   지수는 페이지가 이미 받는 air-fare 로 계산(추가 API 없음) · 값이 없는 달은 없는 채로(지어내지 않음) · 숫자 · 달은 화면 읽기에도 같은 글 (글자판은 aria-hidden)
import { useFlapChar, useWindowMonths } from "../hooks/use-window-months";
import { type IndexPoint, flapChars, periodRange, windowMonths } from "../lib/window-months";

function FlapCell({ char }: { char: string }) {
  const { ref, shown } = useFlapChar(char);
  return (
    <span
      ref={ref}
      className={`relative isolate grid h-[4.625rem] w-[3.25rem] place-items-center rounded-[5px] bg-flap-cell text-[2.75rem] leading-none font-bold text-sun [perspective:200px] after:absolute after:inset-x-0 after:top-1/2 after:-z-10 after:h-px after:bg-on-band max-sm:h-[3.875rem] max-sm:w-11 max-sm:text-[2.25rem]`}
    >
      {shown}
    </span>
  );
}

export function WindowMonths({ points }: { points: IndexPoint[] | null }) {
  const data = windowMonths(points);
  // 지수가 없으면 구역 자체가 없음 (hero 의 안내가 "준비 중" 을 이미 말함 · 숫자를 지어내지 않음)
  if (!data) return null;
  return <WindowSection data={data} range={periodRange(points)} />;
}

function WindowSection({ data, range }: { data: NonNullable<ReturnType<typeof windowMonths>>; range: string | null }) {
  const { months, lowest, highest, complete } = data;
  const values = Object.fromEntries(months.map((m) => [m.month, m.avg]));
  const { month, shade, value, pick, replay, view, back, near, front, grain, trip } = useWindowMonths(months.map((m) => m.month), lowest, values);
  const cur = months.find((m) => m.month === month) ?? months[0];
  const vals = months.map((m) => Number(m.text));
  const vmin = Math.min(...vals);
  const vmax = Math.max(...vals);
  const idx = Math.max(0, months.findIndex((m) => m.month === cur.month));
  const n = months.length;
  const lowText = months.find((m) => m.month === lowest)?.text;
  const chars = flapChars(cur.month);
  return (
    <section data-testid="window-section" aria-labelledby="window-title" className="bg-surface-2 px-4 pt-14 pb-[4.5rem] text-fg sm:px-8 max-sm:pt-10 max-sm:pb-14">
      <div className="mx-auto max-w-page">
        <p className="text-small text-accent">창밖으로 보는 12달</p>
        <h2 id="window-title" className="mt-1.5 text-[1.5rem] leading-tight font-bold tracking-display sm:text-[1.875rem]">
          계절이 바뀌는 동안 항공료 지수도 오르내립니다
        </h2>
        <p className="mt-1.5 text-small text-fg-2">1월부터 12월까지 같은 달의 국제항공료 지수를 창밖 계절과 함께 봅니다.</p>
        <div ref={trip} className="mt-6 grid overflow-hidden rounded-[1.625rem] bg-card shadow-ticket max-[760px]:grid-cols-1 max-[760px]:rounded-[1.375rem] min-[761px]:grid-cols-[22.5rem_minmax(0,1fr)] min-[1101px]:grid-cols-[26.25rem_minmax(0,1fr)]">
          <div className="relative grid place-items-center bg-surface-2 py-10 max-[760px]:py-7" style={{ background: "linear-gradient(#EEF2F8,#E3E9F2)" }}>
            <div
              className="relative w-[18.75rem] rounded-[7.375rem] p-4 max-[760px]:w-[min(15.625rem,70vw)] max-[760px]:rounded-[6.25rem] max-[760px]:p-[0.8125rem] min-[761px]:max-[1100px]:w-[16.875rem]"
              style={{ background: "linear-gradient(150deg,#FBFCFE,#DCE3EE)" }}
            >
              <div
                ref={view}
                data-testid="window-view"
                data-state={shade}
                role="img"
                aria-label={`비행기 창밖 풍경. ${cur.month}월, ${cur.season} · ${cur.desc}`}
                className="relative aspect-[3/4] w-full rounded-[6.5rem] bg-[#BFD3EA] ring-[5px] ring-[#EDF1F7] max-[760px]:rounded-[5.5rem]"
              >
                {/* 사파리(WebKit)는 둥근 모서리 + overflow-hidden 만으로는 안쪽 합성 층(필터 · 섞기 · 움직이는 덮개)을 못 잘라 풍경이 네모로 보임 → 자르는 칸에 clip-path 로 둥근 모양을 직접 지정 (작업 0258) · 테두리 선(ring)은 바깥 칸에 둬 잘리지 않음 */}
                <div className="absolute inset-0 overflow-hidden rounded-[inherit] [clip-path:inset(0_round_6.5rem)] [isolation:isolate] max-[760px]:[clip-path:inset(0_round_5.5rem)]">
                <canvas ref={back} aria-hidden="true" className="absolute inset-0 block size-full" />
                <canvas ref={near} aria-hidden="true" className="absolute inset-0 block size-full transition-[filter] duration-[400ms] [&.moving]:blur-[0.9px]" />
                <canvas ref={front} aria-hidden="true" className="absolute inset-0 block size-full" />
                <div ref={grain} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[length:160px_160px] opacity-55 mix-blend-multiply" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: "linear-gradient(125deg,rgba(255,255,255,.28),rgba(255,255,255,0) 32%,rgba(255,255,255,0) 70%,rgba(255,255,255,.12))", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.5)" }} />
                <div
                  data-testid="window-shade"
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 z-[3] h-full after:absolute after:bottom-2.5 after:left-1/2 after:h-1.5 after:w-11 after:-translate-x-1/2 after:rounded-[3px] after:bg-[#C3CCDA]"
                  style={{ background: "linear-gradient(#F4F6FA,#E4E9F1)" }}
                />
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex min-w-0 flex-col px-11 pt-[2.375rem] pb-[2.125rem] max-[760px]:px-[1.125rem] max-[760px]:pt-6 max-[760px]:pb-[1.375rem]">
            <p className="text-small font-semibold text-fg-2">이 달의 국제항공료 지수</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-[1.125rem] gap-y-3">
              <div data-testid="window-flap" aria-hidden="true" className="flex gap-1">
                {chars.map((c, i) => (
                  <FlapCell key={i} char={c} />
                ))}
              </div>
              <div data-testid="window-season" className="text-[1.375rem] leading-snug font-bold">
                {cur.season}
                <small className="block text-small font-normal text-fg-2">{cur.desc}</small>
              </div>
              <span
                data-testid="window-tag"
                className={`inline-flex h-[1.875rem] items-center rounded-[6px] px-3.5 text-[0.84375rem] font-bold ${cur.tone === "low" ? "bg-sun text-fg" : cur.tone === "high" ? "bg-pin-expensive text-on-accent" : "hidden"}`}
              >
                {cur.tag ?? ""}
              </span>
            </div>
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-small font-semibold text-fg-2">국제항공료 지수 · 같은 달 평균</p>
              <div className="mt-0.5 flex items-baseline gap-2.5">
                <b data-testid="window-value" data-final={cur.text} className={`text-[3.5rem] leading-[1.05] font-bold tracking-display tabular-nums max-sm:text-[2.875rem] ${cur.tone === "high" ? "text-expensive" : cur.tone === "low" ? "text-figure" : "text-fg"}`}>
                  {value.toFixed(1)}
                </b>
                <span className="text-small text-fg-2">2020년 = 100</span>
              </div>
              <p data-testid="window-cmp" className="mt-1 min-h-[1.375rem] text-small text-fg-2">
                {cur.cmp}
              </p>
            </div>
            <div className="relative mt-6 pb-3">
              <div data-testid="window-band" role="group" aria-label="달 고르기" className="relative grid gap-1.5 pb-3 [--lbl:0.75rem] max-sm:gap-[3px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                {months.map((m) => (
                  <button
                    key={m.month}
                    type="button"
                    data-testid="window-month"
                    data-month={m.month}
                    data-value={m.text}
                    aria-pressed={m.month === cur.month}
                    aria-label={`${m.month}월 · 지수 ${m.text}`}
                    onClick={() => pick(m.month)}
                    className="flex h-[5.75rem] cursor-pointer flex-col items-center justify-end gap-[0.4375rem] rounded-lg"
                  >
                    <span
                      aria-hidden="true"
                      className={`w-[62%] max-w-[1.625rem] rounded-t-[5px] rounded-b-[2px] ${m.month === cur.month ? "ring-2 ring-fg" : ""} ${m.tone === "high" ? "bg-pin-expensive" : m.tone === "low" ? "bg-sun" : "bg-line"}`}
                      style={{ height: `${vmax === vmin ? 30 : 14 + ((Number(m.text) - vmin) / (vmax - vmin)) * 46}px` }}
                    />
                    <span className={`text-(length:--lbl) leading-none ${m.month === cur.month ? "font-bold text-fg" : "text-fg-2"}`}>{m.month}월</span>
                  </button>
                ))}
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[calc(0.75rem+var(--lbl)+0.4375rem)] h-px bg-fg opacity-50" />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 h-1 rounded-sm bg-figure transition-transform duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)]"
                  style={{ width: `calc((100% - ${(n - 1) * 6}px) / ${n})`, transform: `translateX(calc(${idx} * (100% + 6px)))` }}
                />
              </div>
            </div>
            <div className="mt-auto flex flex-col items-start gap-3.5 pt-5">
              <button type="button" data-testid="window-replay" onClick={replay} className="tap-44 inline-flex cursor-pointer items-center gap-2 rounded-pill border-[1.5px] border-figure bg-card px-[1.125rem] py-[0.5625rem] text-[0.875rem] font-bold text-figure">
                ↻ 다시 보기
              </button>
              <p data-testid="window-note" className="max-w-none text-[0.75rem] leading-[1.55] text-fg-2">
                통계청 국제항공료 지수 같은 달 평균{range ? `(${range} 받은 값 · 홈 12달 막대와 같은 계산)` : ""}. 실제 요금이 아니며, {lowest}월이 {complete ? "1년 중" : "받은 달 중"} 가장 낮고 {highest}월이 가장 높습니다.
              </p>
            </div>
            <p aria-live="polite" className="sr-only">
              {shade === "open" && month === lowest ? `${lowest}월이 ${complete ? "1년" : "받은 달"} 중 국제항공료 지수가 가장 낮습니다${lowText ? ` (${lowText})` : ""}` : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

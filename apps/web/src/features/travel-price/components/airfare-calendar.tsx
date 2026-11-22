"use client";

// 여행 타이밍 "항공권 출발일 달력" — 창밖 12달 아래 새 구역 (작업 0234 · 시안 .tmp/motion-pages/m-airfare.src.js)
//   인천 출발 1주 왕복의 출발일별 최저가 · 도시 칩 → 탑승권(글자판 가격) → 머리 문장 → 날짜 띠(‹ › · 밀기) → 요일별 평균 막대 → 요약 두 항목 → 받은 날 한 줄
//   글 · 칸 · 속성은 React · 움직임은 lib/airfare-motion.ts (고른 날 표시 · 비행기 · 띠 흘러가기 · 글자판 굴러가기)
//   받지 못한 도시는 칩을 뺌 · 자료가 하나도 없으면 "아직 받지 못했습니다" (숫자를 지어내지 않음 · AGENTS.md 7)
import type { AirfareCalendar } from "@hav/shared/airfare";
import { formatDay, receivedNote } from "@hav/shared/airfare-domain";
import { Flag } from "@hav/ui/data/flag";
import type { ReactNode } from "react";
import { useAirfareCalendar, type AirfareItem } from "../hooks/use-airfare-calendar";
import { AIRPORT_FLAG, cityView, dotDay, manWon, subline, won } from "../lib/airfare-view";
import "./airfare-calendar.css";

const PLANE = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" transform="rotate(90 12 12)" />
  </svg>
);

export function AirfareCalendarSection({ calendar }: { calendar: AirfareCalendar | null }) {
  const cities: AirfareItem[] = (calendar?.cities ?? []).flatMap((c) => {
    const view = cityView(c);
    return view ? [{ city: c, view }] : [];
  });
  return (
    <section data-testid="airfare-section" aria-labelledby="airfare-title" className="af bg-surface px-4 text-fg sm:px-8">
      <div className="mx-auto max-w-page">
        <p className="af-eyebrow">항공권 출발일 달력</p>
        <h2 id="airfare-title" className="af-title">언제 떠나면 쌀까 — 인천 출발 1주 왕복</h2>
        {cities.length === 0 || !calendar?.fetchedOn ? (
          <p data-testid="airfare-empty" className="af-lede">아직 받지 못했습니다 — 항공권 가격을 받으면 이 자리에 출발일별 최저가가 표시됩니다.</p>
        ) : (
          <Calendar items={cities} fetchedOn={calendar.fetchedOn} />
        )}
      </div>
    </section>
  );
}

/** 숫자 · 금액(예: "(685,748원)" · "27.5만 원" · "2.5배")은 줄 중간에서 쪼개지지 않게 */
function noBreak(text: string): ReactNode[] {
  return text.split(/(\(?[\d,.]+(?:만 원|원|배)\)?)/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">{part}</span>
    ) : (
      part
    ),
  );
}

function Calendar({ items, fetchedOn }: { items: AirfareItem[]; fetchedOn: string }) {
  const { airport, item, sel, grown, range, rootRef, chooseCity, chooseDay, page } = useAirfareCalendar(items);
  const { city, view } = item;
  const picked = view.cells[sel] ?? view.cells[view.bestIndex];
  const isBest = picked.best;
  const [headStart, headDate, headEnd] = view.head.split(/(\d+월 \d+일\([월화수목금토일]\))/);

  return (
    <div ref={rootRef}>
      <p data-testid="airfare-lede" className="af-lede">출발일마다 그날 떠나 1주 뒤 돌아오는 왕복 최저가입니다. 날짜를 고를 필요 없이 가장 저렴한 날을 바로 봅니다.</p>
      <div className="af-chips" role="group" aria-label="도시 고르기">
        {items.map(({ city: c }) => (
          <button key={c.airport} type="button" data-testid="airfare-chip" data-airport={c.airport} aria-pressed={c.airport === airport} onClick={() => chooseCity(c.airport)}>
            <span data-testid="airfare-chip-flag" className="fl">
              <Flag country={AIRPORT_FLAG[c.airport] ?? null} label="" className="h-full w-full" />
            </span>
            {c.city}
          </button>
        ))}
      </div>
      <div className="af-card">
        <div data-testid="airfare-pass" className="af-pass">
          <div className="main">
            <span data-testid="airfare-tag" className="tag">{isBest ? "가장 저렴한 출발" : "고른 출발"}</span>
            <div className="route">
              <span className="code">ICN<small>인천</small></span>
              <span className="fly" aria-hidden="true">{PLANE}</span>
              <span data-testid="airfare-to" className="code">{city.airport}<small>{city.city}</small></span>
            </div>
            <div className="dates">
              <span>출발</span>
              <span>돌아옴</span>
              <b data-testid="airfare-dep">{dotDay(picked.day.depart)}</b>
              <b data-testid="airfare-ret">{dotDay(picked.day.return)}</b>
            </div>
          </div>
          <div className="stub">
            <span className="lab">1주 왕복 최저가</span>
            <div data-testid="airfare-board" className="af-board" aria-hidden="true" data-final={picked.day.price} />
            <span data-testid="airfare-price-sr" className="sr-only" aria-live="polite">{`${won(picked.day.price)} · ${formatDay(picked.day.depart)} 출발 1주 왕복`}</span>
          </div>
        </div>
        <div className="af-top">
          <p data-testid="airfare-head" className="af-head">
            {headStart}
            <em>{headDate}</em>
            {headEnd}
          </p>
          <div className="af-stage">
            <div className="af-bar">
              <span data-testid="airfare-range" className="af-range">{range.text}</span>
              <span className="af-nav">
                <button type="button" data-testid="airfare-prev" aria-label="앞 날짜 보기" disabled={range.atStart} onClick={() => page(-1)}>‹</button>
                <button type="button" data-testid="airfare-next" aria-label="뒤 날짜 보기" disabled={range.atEnd} onClick={() => page(1)}>›</button>
              </span>
            </div>
            <div className="af-strip">
              <div data-testid="airfare-scroll" className="af-scroll">
                <div className="af-track" role="group" aria-label="출발일별 왕복 최저가">
                  <span data-testid="airfare-sel" className="af-sel" aria-hidden="true" />
                  {view.cells.map((c) => (
                    <button
                      key={c.index}
                      type="button"
                      data-testid="airfare-day"
                      data-depart={c.day.depart}
                      data-price={c.day.price}
                      data-tier={c.tier}
                      data-best={c.best ? "true" : undefined}
                      aria-pressed={c.index === sel}
                      aria-label={c.label}
                      className={`af-d${c.sat ? " sat" : ""}${c.sun ? " sun" : ""}`}
                      onClick={() => chooseDay(c.index)}
                    >
                      <span data-testid="airfare-day-wd" className="wd">{c.weekday}</span>
                      <span data-testid="airfare-day-dt" className="dt">{c.dateNumber}</span>
                      <span data-testid="airfare-day-pr" className="pr">{manWon(c.day.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <span data-testid="airfare-plane" className="af-plane" aria-hidden="true">{PLANE}</span>
            </div>
            <div className="af-legend">
              <span><i className="ring" />가장 저렴한 날</span>
              <span><b className="lo">파랑</b> 싼 편</span>
              <span><b className="hi">빨강</b> 비싼 편</span>
              <span>가격은 만 원 단위</span>
              <span>날짜를 누르면 탑승권이 바뀝니다</span>
            </div>
            <p data-testid="airfare-sub" className="af-sub">{noBreak(subline(view, sel))}</p>
          </div>
        </div>
        <div className="af-side">
          <h3>요일별 평균 <small>(막대는 가장 저렴한 요일 ~ 비싼 요일 차이)</small></h3>
          <div className="af-week">
            {view.weekBars.map((b) => (
              <div key={b.label} data-testid="airfare-week-row" className={`af-row${b.min ? " min" : ""}`}>
                <span className="w">{b.label}</span>
                <span className="track"><span data-testid="airfare-week-fill" className="fill" style={{ width: grown ? `${b.percent}%` : 0 }} /></span>
                <span className="v">{b.average === null ? "–" : `${manWon(b.average)}만`}</span>
              </div>
            ))}
          </div>
        </div>
        <dl className="af-facts">
          {[view.facts.weekday, view.facts.spread].map((f) => (
            <div key={f.label} data-testid="airfare-fact">
              <dt>{f.label}</dt>
              <dd className="big">{f.big}</dd>
              <dd className="say">{noBreak(f.say)}</dd>
            </div>
          ))}
        </dl>
        <p data-testid="airfare-note" className="af-note">{receivedNote(city.fetchedOn || fetchedOn)}</p>
      </div>
    </div>
  );
}

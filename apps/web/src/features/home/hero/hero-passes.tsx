"use client";

// hero 오른쪽 탑승권 묶음 (작업 0380 · 0393) — 그리기만 · 장식은 화면 읽기에서 빠짐(aria-hidden) · 고른 장의 링크만 읽힘 · 글자 · 여백은 모두 em 이고 묶음 폭(cqw)이 글자 크기를 정함 · 값은 passCards · fxTags 가 정함
import { type FxTag, deckSlot } from "./hero-pass";
import { useHeroDeckValue } from "./use-hero-deck-context";
import { usePlaneLoop } from "./use-plane-loop";

const LOOP = "M-40,400 C80,470 150,300 250,250 S470,250 520,140 S520,-20 400,20 S240,140 330,190 S560,190 640,90";
const PLANE = "M-9,0 L4,-1.6 L9,-1 L9,1 L4,1.6 Z M-1,-1.4 L-5,-7 L-2,-7 L4,-1.4 Z M-1,1.4 L-5,7 L-2,7 L4,1.4 Z M-8,-0.8 L-10,-3.5 L-8.4,-3.5 L-6,-0.8 Z M-8,0.8 L-10,3.5 L-8.4,3.5 L-6,0.8 Z";

export function HeroPasses({ tags, monthLabel }: { tags: FxTag[]; monthLabel: string }) {
  const deck = useHeroDeckValue();
  const { path, plane } = usePlaneLoop();
  return (
    <div data-testid="hero-passes" className="hp-passes">
      <div className="hp-glow" aria-hidden="true" />
      <svg className="hp-route" viewBox="0 0 600 470" aria-hidden="true">
        <path ref={path} d={LOOP} />
        <path ref={plane} d={PLANE} className="hp-plane" />
      </svg>
      {tags.map((t) => (
        <span key={t.id} className="hp-tag" data-tag={t.id} aria-hidden="true">
          {t.lead}
          <b>{t.value}</b>
        </span>
      ))}
      <div className="hp-float">
        {deck.cards.map((c) => (
          <article key={c.id} data-testid="hero-pass" data-city={c.city} className="hp-pass" data-s={deckSlot(deck.order, deck.leaving, c.id, deck.to)}>
            <div className="hp-m">
              <div className="hp-lbl" aria-hidden="true" data-mine={String(c.id === deck.pickedId)}>
                <span>FLAPFX 탑승권</span>
                <span>
                  {monthLabel}
                  {c.id === deck.pickedId && " · 고른 곳"}
                </span>
              </div>
              <div className="hp-rt" aria-hidden="true">
                <div>
                  <div className="hp-code">{c.fromCode}</div>
                  <div className="hp-city">{c.fromName}</div>
                </div>
                <div className="hp-line" />
                <div className="hp-right">
                  <div className="hp-code">{c.toCode}</div>
                  <div className="hp-city">{c.city}</div>
                </div>
              </div>
              <div className="hp-fx" aria-hidden="true">
                <div>
                  <small>오늘 환율</small>
                  <b>
                    {c.rateText} <i>/ {c.perText}</i>
                  </b>
                </div>
                <div>
                  <small>떠나기 좋은 때</small>
                  <b>{c.month}</b>
                </div>
              </div>
              {c.id === deck.pickedId && (
                <div className="hp-go">
                  <a data-testid="hero-pass-go" href="/flights" tabIndex={c.id === deck.order[0] ? 0 : -1}>
                    {c.city} 항공권 날짜 보기 ›
                  </a>
                </div>
              )}
            </div>
            <aside className="hp-stub" aria-hidden="true">
              <div>
                <p>최근 {c.windowDays}일 중</p>
                <div className="hp-big">{c.pctText}</div>
                <p>의 날보다 환율이 낮습니다</p>
              </div>
              <div className="hp-bar">
                <i style={{ width: `${c.pct}%` }} />
              </div>
            </aside>
          </article>
        ))}
      </div>
    </div>
  );
}

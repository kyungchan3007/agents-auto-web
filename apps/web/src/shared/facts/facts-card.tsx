// 오늘 숫자 칸 (작업 0393 · 0396 · 글래스) — 그리기만 · 첫 페이지와 나라 물가 머리가 같이 씀 · 값은 facts.ts · 받지 못한 값은 "-" · 칸 높이는 늘 같음
//   noRate="message": 통화를 주지 않는 나라는 환율 · 1만원이면 · 90일을 그리지 않고 물가만 크게 + 안내 한 줄 (나라 물가)
import "./facts.css";
import type { Facts } from "./facts";

const NONE = "-";

/** 화면마다 다른 시험용 이름표 */
export type FactsIds = { root: string; title: string; mine: string; rate: string; tenk: string; price: string; bar: string; position: string; link: string; none: string };

export type FactsCardProps = {
  facts: Facts;
  ids: FactsIds;
  /** 칸 이름(스크린리더) */
  label: string;
  /** 고른 곳 이름표를 보임 */
  mine?: boolean;
  /** 아래 링크 — 없으면 줄 자리만 둠 */
  link?: { href: string; text: string } | null;
  /** 칸에 더하는 class — 놓는 자리 */
  className?: string;
  /** 환율 없는 나라: "dash" 는 "-" 로 · "message" 는 물가만 + 안내 */
  noRate?: "dash" | "message";
  /** 아래 링크 줄 자리를 비워 둠(링크를 안 쓰는 화면은 false) */
  reserveLink?: boolean;
};

export function FactsCard({ facts, ids, label, mine = false, link = null, className = "", noRate = "dash", reserveLink = true }: FactsCardProps) {
  const priceOnly = noRate === "message" && facts.noRate;
  return (
    <section data-testid={ids.root} className={`facts ${className}`.trim()} aria-live="polite" aria-label={label}>
      <div className="facts-hd">
        <span data-testid={ids.title} className="facts-title">
          {facts.title}
        </span>
        <small>오늘 기준</small>
        {mine && (
          <span data-testid={ids.mine} className="facts-tag">
            고른 곳
          </span>
        )}
      </div>
      {priceOnly ? (
        <div className="facts-one">
          <small>물가</small>
          <b data-testid={ids.price} className="facts-y">
            {facts.priceText ?? NONE}
          </b>
          <p data-testid={ids.none}>{facts.name} 환율은 아직 제공되지 않습니다</p>
        </div>
      ) : (
        <>
          <div className="facts-st">
            <div>
              <small>오늘 환율</small>
              <b data-testid={ids.rate}>
                {facts.rateText ?? NONE}
                {facts.rateText && facts.perText && (
                  <>
                    {" "}
                    <i>/ {facts.perText}</i>
                  </>
                )}
              </b>
            </div>
            <div>
              <small>1만원이면</small>
              <b data-testid={ids.tenk}>
                {facts.tenKValue ?? NONE}
                {facts.tenKValue && facts.tenKUnit && <i>{facts.tenKUnit}</i>}
              </b>
            </div>
            <div>
              <small>물가</small>
              <b data-testid={ids.price} className="facts-y">
                {facts.priceText ?? NONE}
              </b>
            </div>
          </div>
          <div className="facts-rng">
            <div className="facts-t">
              <span>90일 중간 {facts.medianText ?? NONE}</span>
              <span>오늘 {facts.rateText ?? NONE}</span>
            </div>
            <div data-testid={ids.bar} role="img" aria-label={facts.position === null ? "90일 위치를 받지 못했습니다" : `오늘 환율은 최근 90일 중 ${facts.position}%의 날보다 낮습니다`} className="facts-bar">
              {facts.position !== null && <i style={{ left: `${facts.position}%` }} />}
            </div>
          </div>
          <div className="facts-ft">
            <span data-testid={ids.position}>{facts.positionText ?? NONE}</span>
            {(reserveLink || link) && (
              <div>
                {link && (
                  <a data-testid={ids.link} href={link.href}>
                    {link.text}
                  </a>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

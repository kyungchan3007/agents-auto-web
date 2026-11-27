// 오늘 숫자 칸 (작업 0393 · 0396 · 글래스) — 그리기만 · 첫 페이지와 나라 물가 머리가 같이 씀 · 값은 facts.ts · 받지 못한 값은 "-" · 칸 높이는 늘 같음
//   id="country": 환율 안내(fxNote)가 있는 나라는 환율 · 1만원이면 · 90일을 그리지 않고("-" 로 남기지 않음) 물가만 크게 + 안내 한 줄 · 첫 페이지(id="hero")는 높이가 변하지 않게 늘 같은 칸
import "./facts.css";
import type { Facts } from "./facts";

const NONE = "-";

export type FactsCardProps = {
  /** 쓰는 화면 — 시험용 이름표(testid) 접두사 · "country" 는 환율 안내가 있으면 물가만 그림 */
  id: "hero" | "country";
  facts: Facts;
  /** 칸 이름(스크린리더) */
  label?: string;
  /** 고른 곳 이름표를 보임(첫 페이지) */
  mine?: boolean;
  /** 아래 링크(첫 페이지) — 없으면 줄 자리만 둠 */
  link?: { href: string; text: string } | null;
  /** 칸에 더하는 class — 놓는 자리 */
  className?: string;
};

export function FactsCard({ id, facts, label = "오늘 숫자", mine = false, link = null, className = "" }: FactsCardProps) {
  const priceOnly = id === "country" && facts.fxNote !== null;
  const t = (k: string) => `${id}-${k}`;
  return (
    <section data-testid={t("facts")} className={`facts ${className}`.trim()} aria-live="polite" aria-label={label}>
      <div className="facts-hd">
        <span data-testid={t("facts-title")} className="facts-title">
          {facts.title}
        </span>
        <small>오늘 기준</small>
        {mine && (
          <span data-testid={t("facts-mine")} className="facts-tag">
            고른 곳
          </span>
        )}
      </div>
      {priceOnly ? (
        <div className="facts-one">
          <small>물가</small>
          <b data-testid={t("fact-price")} className="facts-y">
            {facts.priceText ?? NONE}
          </b>
          <p data-testid={t("facts-note")}>{facts.fxNote}</p>
        </div>
      ) : (
        <>
          <div className="facts-st">
            <div>
              <small>오늘 환율</small>
              <b data-testid={t("fact-rate")}>
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
              <b data-testid={t("fact-tenk")}>
                {facts.tenKValue ?? NONE}
                {facts.tenKValue && facts.tenKUnit && <i>{facts.tenKUnit}</i>}
              </b>
            </div>
            <div>
              <small>물가</small>
              <b data-testid={t("fact-price")} className="facts-y">
                {facts.priceText ?? NONE}
              </b>
            </div>
          </div>
          <div className="facts-rng">
            <div className="facts-t">
              <span>90일 중간 {facts.medianText ?? NONE}</span>
              <span>오늘 {facts.rateText ?? NONE}</span>
            </div>
            <div data-testid={t("fact-bar")} role="img" aria-label={facts.position === null ? "90일 위치를 받지 못했습니다" : `오늘 환율은 최근 90일 중 ${facts.position}%의 날보다 낮습니다`} className="facts-bar">
              {facts.position !== null && <i style={{ left: `${facts.position}%` }} />}
            </div>
          </div>
          <div className="facts-ft">
            <span data-testid={t("fact-position")}>{facts.positionText ?? NONE}</span>
            {id === "hero" && (
              <div>
                {link && (
                  <a data-testid={t("fact-link")} href={link.href}>
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

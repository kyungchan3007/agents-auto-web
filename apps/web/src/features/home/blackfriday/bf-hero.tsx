"use client";

// 블랙프라이데이 hero (작업 0381 · 시안 .tmp/hero 의 '블랙프라이데이') — 왼쪽 문구 · 계산기 · 오른쪽 감열지 영수증 · 기간 동안만 기본 hero 대신 보임(bf-hero.css 가 html data-hero 로 하나만 보이게 함)
//   그리기만 — 계산은 bf-calc · 기간은 bf-period · 모션은 use-bf-receipt · 입력값은 보내지 않고 저장하지 않음(IMP-01)
import type { FxRate } from "@hav/shared/fx";
import { ROUTE_LABEL } from "../../import-calc/calculator/rules";
import type { CustomsRate } from "../../import-calc/common/customs-rate";
import { BF_COPY } from "./bf-copy";
import { rateLine } from "./bf-calc";
import { BfReceipt } from "./bf-receipt-view";
import "./bf-hero.css";
import { useBfCalc } from "./use-bf-calc";
import { useBfPeriod } from "./use-bf-period";
import { useBfReceipt } from "./use-bf-receipt";

export function BfHero({ rates, customs }: { rates: FxRate[]; customs: Record<string, CustomsRate> | null }) {
  useBfPeriod();
  const calc = useBfCalc(rates, customs);
  const receipt = useBfReceipt();
  const r = calc.result;
  return (
    <section data-testid="bf-hero" aria-labelledby="bf-title" className="bf-hero">
      <div className="bf-inner">
        <div className="bf-copy">
          <span data-testid="bf-label" className="bf-badge">
            {BF_COPY.label}
          </span>
          <h1 id="bf-title" data-testid="bf-title" className="bf-h1">
            <span data-testid="bf-accent" className="bf-accent">
              {BF_COPY.accent}
            </span>
            {BF_COPY.titleLines[0].slice(BF_COPY.accent.length)}
            <br />
            {BF_COPY.titleLines[1]}
          </h1>
          <div className="bf-one">
            <p data-testid="bf-lede">{BF_COPY.lede}</p>
            <span data-testid="bf-tag" className="bf-tag">
              {BF_COPY.tag}
            </span>
          </div>
          <div className="bf-calc">
            <div className="bf-row">
              <span className="bf-cur" aria-hidden="true">
                $
              </span>
              <input data-testid="bf-amount" aria-label="금액(달러)" inputMode="decimal" autoComplete="off" placeholder="장바구니 금액" value={calc.amount} onChange={calc.onAmount} />
              <select data-testid="bf-route" aria-label="통관 방식" value={calc.route} onChange={calc.onRoute}>
                <option value="us-list">{ROUTE_LABEL["us-list"]}</option>
                <option value="other">{ROUTE_LABEL.other}</option>
              </select>
            </div>
            <div className="bf-out" aria-live="polite">
              {r.kind === "idle" && (
                <span data-testid="bf-hint" className="bf-won bf-muted">
                  {r.hint}
                </span>
              )}
              {r.kind === "error" && (
                <span data-testid="bf-error" className="bf-won bf-muted">
                  {r.reason}
                </span>
              )}
              {r.kind === "ok" && (
                <>
                  <span data-testid="bf-krw" className="bf-won">
                    {r.krwText}
                  </span>
                  <span data-testid="bf-judge" className="bf-verdict" data-over={String(r.over)}>
                    {r.judge}
                  </span>
                </>
              )}
            </div>
            <div data-testid="bf-bar" className="bf-meter" data-over={String(r.kind === "ok" && r.over)}>
              <i style={{ width: `${r.kind === "ok" ? Math.min(100, r.ratio * 100) : 0}%` }} />
            </div>
            <div className="bf-fine">
              {r.kind === "ok" && (
                <p data-testid="bf-source" className="bf-source">
                  {rateLine(calc.perUsd, r.sourceLabel)}
                </p>
              )}
              <p data-testid="bf-note">{BF_COPY.note}</p>
            </div>
          </div>
        </div>
        <BfReceipt view={receipt} perUsd={calc.perUsd} />
      </div>
    </section>
  );
}

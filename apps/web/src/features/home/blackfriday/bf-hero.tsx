"use client";

// 블랙프라이데이 hero (작업 0381 · 시안 .tmp/hero 의 '블랙프라이데이') — 왼쪽 문구 · 계산기 · 오른쪽 감열지 영수증 · 기간 동안만 기본 hero 대신 보임(bf-hero.css 가 html data-hero 로 하나만 보이게 함)
//   그리기만 — 계산은 bf-calc · 기간은 bf-period · 모션은 use-bf-receipt · 입력값은 보내지 않고 저장하지 않음(IMP-01)
import type { FxRate } from "@hav/shared/fx";
import type { CustomsRate } from "@/shared/customs/customs-rate";
import { BF_COPY } from "./bf-copy";
import { heroDraw, TITLE_REST } from "./bf-hero-view";
import { BfReceipt } from "./bf-receipt-view";
import { receiptDraw } from "./bf-receipt";
import "./bf-hero.css";
import { useBfCalc } from "./use-bf-calc";
import { useBfPeriod } from "./use-bf-period";
import { useBfReceipt } from "./use-bf-receipt";

export function BfHero({ rates, customs }: { rates: FxRate[]; customs: Record<string, CustomsRate> | null }) {
  useBfPeriod();
  const calc = useBfCalc(rates, customs);
  const r = calc.result;
  const draw = heroDraw(r, calc.perUsd);
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
            {TITLE_REST}
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
              <input data-testid="bf-amount" aria-label="금액(달러)" aria-describedby="bf-route-note" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="장바구니 금액" value={calc.amount} onChange={calc.onAmount} onCompositionStart={calc.onCompositionStart} onCompositionEnd={calc.onCompositionEnd} />
              <span data-testid="bf-route" aria-hidden="true" className="bf-route">
                {BF_COPY.route}
              </span>
            </div>
            <span id="bf-route-note" className="sr-only">
              {BF_COPY.routeNote}
            </span>
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
            <div data-testid="bf-bar" className="bf-meter" data-over={String(draw.barOver)}>
              <i style={{ width: `${draw.barPct}%` }} />
            </div>
            <div className="bf-fine">
              {draw.source !== "" && (
                <p data-testid="bf-source" className="bf-source">
                  {draw.source}
                </p>
              )}
              <p data-testid="bf-note">{BF_COPY.note}</p>
            </div>
          </div>
        </div>
        <BfReceiptLive perUsd={calc.perUsd} />
      </div>
    </section>
  );
}

/** 영수증 모션 상태는 여기서만 가짐 — 영수증이 한 줄씩 찍혀도 위의 입력칸 · 글(BfHero)은 다시 그려지지 않음 (작업 0385) */
function BfReceiptLive({ perUsd }: { perUsd: number | null }) {
  const receipt = useBfReceipt();
  return <BfReceipt draw={receiptDraw(receipt, perUsd)} />;
}

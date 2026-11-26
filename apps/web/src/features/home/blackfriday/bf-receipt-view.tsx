// 블프 hero 영수증 그림 (작업 0381) — 그리기만 (시간표는 bf-receipt · use-bf-receipt) · 장식이라 화면 읽기에서는 빠짐 · 글자 · 여백은 모두 em 이고 카드 폭(cqw)이 글자 크기를 정함
import { BF_COPY } from "./bf-copy";
import { BF_ITEMS } from "./bf-calc";
import { BARCODE, RECEIPT_DATE, RECEIPT_LIMIT_USD, type ReceiptView, krwText, usdText } from "./bf-receipt";

export function BfReceipt({ view, perUsd }: { view: ReceiptView; perUsd: number | null }) {
  const over = view.usd > RECEIPT_LIMIT_USD;
  const rest = Math.abs(RECEIPT_LIMIT_USD - view.usd);
  return (
    <div data-testid="bf-receipt" className="bf-rcpt-wrap" aria-hidden="true">
      <div className="bf-rcpt bf-rcpt-back">
        <div className="bf-paper">
          <div className="bf-hd">
            <b>FLAPFX STORE</b>
          </div>
          <div className="bf-ln">
            <span>LEATHER BELT</span>
            <span>$42.00</span>
          </div>
          <div className="bf-ln">
            <span>SOCKS 3PK</span>
            <span>$18.00</span>
          </div>
        </div>
      </div>
      <div className="bf-rcpt bf-rcpt-front">
        <div className="bf-paper">
          <div className="bf-hd">
            <b>{BF_COPY.brand}</b>
            <span>{BF_COPY.sub}</span>
            <span className="bf-meta">
              <i>{RECEIPT_DATE}</i>
              <i>BLACK FRIDAY</i>
            </span>
          </div>
          <div className="bf-rule" />
          <div>
            {BF_ITEMS.slice(0, view.lines).map((it, i) => (
              <div key={it.name} data-testid="bf-receipt-item" className={i === view.lines - 1 ? "bf-ln bf-new" : "bf-ln"}>
                <span>{it.name}</span>
                <span>{usdText(it.usd)}</span>
              </div>
            ))}
          </div>
          <div className="bf-rule" />
          <div className="bf-ln bf-sm">
            <span>소계</span>
            <span>{usdText(view.usd)}</span>
          </div>
          <div className="bf-ln bf-sm">
            <span>면세 한도 (미국 목록통관)</span>
            <span>{usdText(RECEIPT_LIMIT_USD)}</span>
          </div>
          <div className="bf-ln bf-tot">
            <span>합계</span>
            <span>{usdText(view.usd)}</span>
          </div>
          <div className="bf-ln bf-sm">
            <span>원화 환산</span>
            <span>{krwText(view.usd, perUsd)}</span>
          </div>
          <div className="bf-lim">
            <i data-over={String(over)} style={{ width: `${Math.min(100, (view.usd / RECEIPT_LIMIT_USD) * 100)}%` }} />
          </div>
          <div className="bf-ln bf-sm bf-st" data-over={String(over)}>
            <span>{over ? "한도 초과" : "한도까지"}</span>
            <span>{usdText(rest)}</span>
          </div>
          <div className="bf-rule" />
          <div className="bf-bc">
            {BARCODE.map((w, i) => (
              <i key={i} style={{ width: `${w * 0.22}em`, marginRight: `${(i % 3 === 0 ? 2 : 1) * 0.12}em` }} />
            ))}
          </div>
          <div className="bf-bcn">1127 FLAPFX</div>
          <div data-testid="bf-receipt-note" className="bf-thanks">
            {BF_COPY.receiptNote}
          </div>
          <div key={view.stamped} data-testid="bf-receipt-stamp" className="bf-stamp" data-on={String(view.stamp !== null)} data-kind={view.stamp ?? ""}>
            {view.stamp ?? ""}
          </div>
        </div>
      </div>
    </div>
  );
}

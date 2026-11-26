// 블프 hero 영수증 그림 (작업 0381) — 그리기만 (글 · 값은 bf-receipt 의 receiptDraw · 시간표는 use-bf-receipt) · 장식이라 화면 읽기에서는 빠짐 · 글자 · 여백은 모두 em 이고 카드 폭(cqw)이 글자 크기를 정함
import { BF_COPY } from "./bf-copy";
import { RECEIPT_DATE, type ReceiptDraw } from "./bf-receipt";

export function BfReceipt({ draw }: { draw: ReceiptDraw }) {
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
            {draw.items.map((it) => (
              <div key={it.name} data-testid="bf-receipt-item" className={it.fresh ? "bf-ln bf-new" : "bf-ln"}>
                <span>{it.name}</span>
                <span>{it.usdText}</span>
              </div>
            ))}
          </div>
          <div className="bf-rule" />
          <div className="bf-ln bf-sm">
            <span>소계</span>
            <span>{draw.subText}</span>
          </div>
          <div className="bf-ln bf-sm">
            <span>면세 한도 (미국 목록통관)</span>
            <span>{draw.limitText}</span>
          </div>
          <div className="bf-ln bf-tot">
            <span>합계</span>
            <span>{draw.subText}</span>
          </div>
          <div className="bf-ln bf-sm">
            <span>원화 환산</span>
            <span>{draw.krw}</span>
          </div>
          <div className="bf-lim">
            <i data-over={String(draw.over)} style={{ width: `${draw.barPct}%` }} />
          </div>
          <div className="bf-ln bf-sm bf-st" data-over={String(draw.over)}>
            <span>{draw.statusLabel}</span>
            <span>{draw.statusText}</span>
          </div>
          <div className="bf-rule" />
          <div className="bf-bcrow">
            <div className="bf-bc">
              {draw.bars.map((b, i) => (
                <i key={`${i}-${b.width}`} style={{ width: b.width, marginRight: b.gap }} />
              ))}
            </div>
            <div key={draw.stampKey} data-testid="bf-receipt-stamp" className="bf-stamp" data-on={String(draw.stampOn)} data-kind={draw.stampKind}>
              {draw.stampText}
            </div>
          </div>
          <div className="bf-bcn">1127 FLAPFX</div>
          <div data-testid="bf-receipt-note" className="bf-thanks">
            {BF_COPY.receiptNote}
          </div>
        </div>
      </div>
    </div>
  );
}

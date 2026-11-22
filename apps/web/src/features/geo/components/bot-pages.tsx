"use client";

// 봇별 읽은 페이지 (작업 0226 → 작업 0303 어드민) — 봇마다 작은 판 · 세 칸 격자 · 전체 · AI 봇 · 검색 엔진으로 묶어 보기(카드가 움직여 자리를 찾음)
import { Bars } from "@hav/ui/admin/bars";
import { type BotKind, useBotKind } from "../hooks/use-bot-kind";
import type { BotPagesView } from "../lib/geo-bars";
import { KIND_TEXT } from "../lib/geo-view";

export function BotPages({ bots }: { bots: BotPagesView[] }) {
  const { kind, setKind, grid } = useBotKind();
  const shown = bots.filter((b) => (kind === "all" ? true : kind === "eng" ? b.kind === "engine" : b.kind !== "engine"));
  const btn = (id: BotKind, label: string) => (
    <button type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>
      {label}
    </button>
  );
  return (
    <>
      <div className="adm-seg" role="group" aria-label="봇 묶음">
        {btn("all", "전체")}
        {btn("ai", "AI 봇")}
        {btn("eng", "검색 엔진")}
      </div>
      <div ref={grid} className="adm-cards" style={{ marginTop: 12 }}>
        {shown.map((b) => (
          <section key={b.name} data-testid="bot-pages-bot" data-bot={b.name} className="adm-panel" aria-label={`${b.name} 읽은 페이지`}>
            <div className="adm-ph">
              <h3 className="mono" style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                {b.name}
              </h3>
              <span className="adm-stamp">
                {KIND_TEXT[b.kind]} · <span className="sr-only">{b.text}</span>
                <span aria-hidden>{b.text.replace(`${b.name} · `, "")}</span>
              </span>
            </div>
            <Bars rows={b.rows} />
            {b.rest ? (
              <p data-testid="bot-pages-rest" className="adm-note" style={{ padding: "0 20px 14px" }}>
                {b.rest.text}
              </p>
            ) : (
              <div style={{ height: 6 }} />
            )}
          </section>
        ))}
      </div>
    </>
  );
}

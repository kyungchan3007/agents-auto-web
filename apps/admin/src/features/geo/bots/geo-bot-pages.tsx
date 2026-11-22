// 봇별 읽은 페이지 판 (작업 0226 → 0303 어드민) — 카드 격자는 bot-pages.tsx
import type { GeoReport } from "@hav/shared/geo";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { botPagesView } from "../common/geo-bars";
import { EMPTY } from "../common/geo-table";
import { BotPages } from "./bot-pages";

export function GeoBotPages({ report }: { report: GeoReport }) {
  const bots = botPagesView(report.botPages);
  return (
    <Panel id="geo-bot-pages" testId="geo-bot-pages" title="봇별 읽은 페이지" meta={<Stamp>많이 읽은 상위 5곳 · 사람 유입 · 운영 확인 제외</Stamp>}>
      <div className="adm-pb">
        <p className="adm-note" style={{ marginBottom: 12 }}>
          봇마다 어떤 페이지를 몇 번 읽었는지 (Googlebot · bingbot 같은 검색 엔진 봇 포함)
        </p>
        {bots.length === 0 ? <p className="adm-empty" style={{ padding: 0 }}>{EMPTY}</p> : <BotPages bots={bots} />}
      </div>
    </Panel>
  );
}

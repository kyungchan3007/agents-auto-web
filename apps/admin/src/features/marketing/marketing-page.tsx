"use client";

// 알리기 (작업 0307) — Meta(인스타그램 · 페이스북) 광고 소재 초안을 날짜별로 · 문구 복사 · 소재 기준 · 광고 운영(아직 연결 안 함)
//   초안은 geo 가 docs/marketing/YYYY-MM-DD/ 에 쌓은 것만(빌드 때 읽음) · 올렸는지 · 반응 · 광고비는 저장소에 적지 않아 화면에도 없음
import { Flap } from "@/shared/ui/flap/flap";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { AdminNav } from "@/shared/nav/admin-nav";
import { type Draft, latestDay, shortDay } from "./drafts/drafts";
import { DraftCard } from "./drafts/draft-card";
import { MARKETING_RULES } from "./rules/marketing-rules";

export function MarketingPage({ drafts }: { drafts: Draft[] }) {
  const latest = latestDay(drafts);
  return (
    <AdminNav page="marketing">
      <div className="adm-top">
        <div>
          <p className="adm-eyebrow">알리기</p>
          <h1>Meta 광고로 이 사이트를 알립니다</h1>
          <p className="adm-lede">소재 초안은 geo 가 그날 사이트 숫자로 만들고, 계정 · 올리기 · 광고비는 사람이 정합니다.</p>
        </div>
        <Stamp>빌드 때 저장소에서 읽은 초안</Stamp>
      </div>
      <section className="adm-panel" aria-label="요약">
        <dl className="adm-stats">
          <div className="adm-stat">
            <dt>소재 초안</dt>
            <dd className="v">
              <Flap text={String(drafts.length)} />
              <small>개</small>
            </dd>
          </div>
          <div className="adm-stat">
            <dt>최근 초안</dt>
            <dd className="v">{latest ? <Flap text={shortDay(latest)} order={1} /> : "없음"}</dd>
            {latest && <dd className="s">{latest}</dd>}
          </div>
          <div className="adm-stat">
            <dt>올리는 곳</dt>
            <dd className="v" style={{ fontSize: 16, fontFamily: "inherit" }}>
              인스타그램 · 페이스북
            </dd>
          </div>
          <div className="adm-stat">
            <dt>소재 형식</dt>
            <dd className="v" style={{ fontSize: 16, fontFamily: "inherit" }}>
              세로 4:5
            </dd>
            <dd className="s">1080×1350 · 이미지 한 장</dd>
          </div>
        </dl>
      </section>
      <Panel id="marketing-drafts" testId="marketing-drafts" title="소재 초안" meta={<Stamp>최근 날부터</Stamp>}>
        {drafts.length === 0 ? (
          <p className="adm-empty">아직 초안이 없습니다. geo 가 docs/marketing/날짜/ 에 초안을 쌓으면 여기에 붙습니다</p>
        ) : (
          <div className="adm-cards adm-drafts">
            {drafts.map((d) => (
              <DraftCard key={d.key} d={d} />
            ))}
          </div>
        )}
      </Panel>
      <div className="adm-grid">
        <Panel id="marketing-rules" title="소재 기준" meta={<Stamp>.agents/orchestration/team.md geo 절</Stamp>}>
          <ul className="adm-note adm-pb" style={{ margin: 0, paddingLeft: 36, fontSize: 13, color: "var(--a-sub)" }}>
            {MARKETING_RULES.map((r) => (
              <li key={r} style={{ margin: "4px 0" }}>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel id="marketing-ads" testId="marketing-ads" title="광고 운영">
          <p className="adm-empty">Meta 광고 계정과 아직 연결하지 않았습니다. 광고 성과는 연결한 뒤 이 자리에 붙입니다</p>
        </Panel>
      </div>
    </AdminNav>
  );
}

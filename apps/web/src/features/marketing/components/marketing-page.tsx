"use client";

// 알리기 (작업 0307) — Meta(인스타그램 · 페이스북) 광고 소재 초안을 날짜별로 · 문구 복사 · 소재 기준 · 광고 운영(아직 연결 안 함)
//   초안은 geo 가 docs/marketing/YYYY-MM-DD/ 에 쌓은 것만(빌드 때 읽음) · 올렸는지 · 반응 · 광고비는 저장소에 적지 않아 화면에도 없음
import { Flap } from "@hav/ui/admin/flap";
import { Panel, Stamp } from "@hav/ui/admin/panel";
import { toast } from "@hav/ui/lib/admin-events";
import { AdminNav } from "@/shared/admin-nav";
import { type Draft, nextImage } from "../lib/drafts";

const RULES = [
  "이미지 한 장 · 세로 4:5(1080×1350) · 사이트 색과 글자판 · 탑승권 모양 · 사진은 쓰지 않습니다",
  "숫자는 그날 사이트 · 공개 API 에 있는 값만 쓰고, 받은 날짜를 함께 적습니다",
  "\"오를 것 · 내릴 것\" 같은 예측 · 투자 권유 문구는 쓰지 않습니다",
  "자료 제공처 설명은 문구에 넣지 않습니다",
  "계정 만들기 · 올리기 · 예산 · 유료 전환은 사람이 합니다. 팀은 초안까지 만듭니다",
];

// 그림이 안 열리면(R2 에 그날 파일이 없는 이전 묶음) 되돌림 주소(저장소 raw)로 · 그것도 없으면 "이미지 없음" 칸으로 (작업 0310 · 상태 없이 DOM 만 바꿈 — 서버 HTML 의 그림이 손잡이보다 먼저 실패해도 ref 에서 다시 봄)
function swapImage(el: HTMLImageElement, d: Draft) {
  const next = nextImage(el.getAttribute("src"), d);
  if (next) {
    el.src = next;
    return;
  }
  el.style.display = "none";
  const none = el.nextElementSibling;
  if (none instanceof HTMLElement) none.style.display = "";
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what}을 복사했습니다`);
  } catch {
    toast("복사하지 못했습니다. 글을 직접 골라 복사해 주세요");
  }
}

function DraftCard({ d }: { d: Draft }) {
  return (
    <article data-testid="marketing-draft" className="adm-panel adm-draft" data-cmd="소재 초안" data-cmd-label={`${d.day} 초안`}>
      <div className="adm-ph">
        <h3 className="mono" style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          {d.day}
        </h3>
        {d.link && (
          <a className="adm-link" href={d.link} target="_blank" rel="noreferrer">
            {d.link.replace(/^https?:\/\//, "")} ↗
          </a>
        )}
      </div>
      <div className="adm-draft-b">
        {d.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기 · R2 공개 주소(안 열리면 저장소 raw)를 그대로 (next/image 최적화 서버 없음) */}
            <img
              ref={(el) => {
                if (el && el.complete && el.naturalWidth === 0) swapImage(el, d);
              }}
              onError={(e) => swapImage(e.currentTarget, d)}
              src={d.image}
              alt={d.alt || `${d.day} 소재`}
              width={1080}
              height={1350}
              loading="lazy"
            />
            <div className="adm-draft-noimg" style={{ display: "none" }}>
              이미지 없음
            </div>
          </>
        ) : (
          <div className="adm-draft-noimg">이미지 없음</div>
        )}
        <div className="adm-draft-t">
          <p className="adm-draft-body">{d.body || "본문 없음"}</p>
          {d.tags && <p className="adm-note">{d.tags}</p>}
          <div className="adm-topr" style={{ marginTop: 4 }}>
            <button type="button" className="adm-btn" onClick={() => void copy([d.body, d.tags].filter(Boolean).join("\n\n"), "본문과 해시태그")} disabled={!d.body}>
              본문 복사
            </button>
            {d.alt && (
              <button type="button" className="adm-btn" onClick={() => void copy(d.alt, "이미지 대체 글")}>
                대체 글 복사
              </button>
            )}
          </div>
          {d.numbers.length > 0 && (
            <details className="adm-more" style={{ marginTop: 4 }}>
              <summary style={{ padding: "8px 0" }}>쓴 숫자와 받은 날짜</summary>
              <ul className="adm-note" style={{ margin: 0, paddingLeft: 16 }}>
                {d.numbers.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

export function MarketingPage({ drafts }: { drafts: Draft[] }) {
  const latest = drafts[0]?.day ?? null;
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
            <dd className="v">{latest ? <Flap text={latest.slice(5)} order={1} /> : "없음"}</dd>
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
              <DraftCard key={d.day} d={d} />
            ))}
          </div>
        )}
      </Panel>
      <div className="adm-grid">
        <Panel id="marketing-rules" title="소재 기준" meta={<Stamp>.agents/orchestration/team.md geo 절</Stamp>}>
          <ul className="adm-note adm-pb" style={{ margin: 0, paddingLeft: 36, fontSize: 13, color: "var(--a-sub)" }}>
            {RULES.map((r) => (
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

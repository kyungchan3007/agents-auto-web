"use client";

// 사이트 상태 (작업 0105 → 작업 0303 어드민) — 숫자 칸 4개: 오늘 환율 수집 · 사이트 빌드 · 자동 검사 (main) · 열린 작업
//   값은 API 가 준 것만 — 자동 검사 · 열린 작업은 이 사이트가 아직 받아 오지 않아 GitHub 로 연결 (숫자를 지어내지 않음)
//   5분마다 다시 받음(남은 시간 표시) · "사이트 상태 다시 받기"(R)로 바로 · 받는 동안 숫자 칸은 불러오는 모양 → 받으면 안내판처럼 다시 넘어감
import type { SiteStatus } from "@hav/shared/status";
import { Flap } from "@hav/ui/admin/flap";
import { IconRefresh } from "@hav/ui/admin/icons";
import { clockText } from "@hav/ui/hooks/use-refresh";
import { REPO_URL } from "../../../shared/site";
import { runSummary } from "../lib/run-summary";
import { headlineOf, timeText } from "../lib/status-text";
import type { useSiteStatus } from "../hooks/use-site-status";

/** "11-20 12:00 성공 · 공식 22개" → 큰 글자(시각) · 작은 글자(나머지) */
export function splitRun(text: string): { big: string; rest: string } {
  const m = /^((?:\d\d-\d\d )?\d\d:\d\d)\s*(.*)$/.exec(text);
  return m ? { big: m[1] ?? text, rest: m[2] ?? "" } : { big: text, rest: "" };
}

/** "11월 22일 20:31" → "11-22 20:31" (숫자 칸) */
const shortTime = (iso: string) => timeText(iso).replace(/(\d+)월 (\d+)일/, (_, m: string, d: string) => `${m.padStart(2, "0")}-${d.padStart(2, "0")}`);

export function RefreshButton({ busy, left, onClick }: { busy: boolean; left: number; onClick: () => void }) {
  return (
    <button type="button" className={`adm-btn${busy ? " busy" : ""}`} onClick={onClick} aria-busy={busy} data-key-r title="R">
      <IconRefresh />
      사이트 상태 다시 받기
      <span className="cd" aria-label={`자동으로 다시 받기까지 ${clockText(left)}`}>
        {clockText(left)}
      </span>
    </button>
  );
}

export function StatusBoard({ s, builtAt }: { s: ReturnType<typeof useSiteStatus>; builtAt: string }) {
  const f = s.data;
  return (
    <section data-testid="status-board" aria-labelledby="status-title" className="adm-panel" data-cmd="판" data-cmd-label="사이트 상태">
      <h2 id="status-title" className="sr-only">
        사이트 상태
      </h2>
      {!f.ok ? <p className="adm-empty">상태를 받지 못했습니다 ({f.reason})</p> : <Body st={f.data} builtAt={builtAt} round={s.round} busy={s.busy} />}
    </section>
  );
}

function Body({ st, builtAt, round, busy }: { st: SiteStatus; builtAt: string; round: number; busy: boolean }) {
  const h = headlineOf(st);
  const failed = h.tone === "bad" || st.lastRun?.status === "error";
  const run = splitRun(runSummary(st));
  const sub = [run.rest, h.tone === "ok" ? "" : h.text].filter(Boolean).join(" · ");
  return (
    <dl className={`adm-stats${busy ? " loading" : ""}`}>
      <div className="adm-stat">
        <dt>
          <i className={`adm-dot${failed ? " bad" : ""}`} aria-hidden />
          오늘 환율 수집
        </dt>
        <dd className={`v${failed ? " bad" : ""}`}>
          <Flap text={run.big} replay={round} />
        </dd>
        {sub && <dd className="s">{sub}</dd>}
      </div>
      <div className="adm-stat">
        <dt>사이트 빌드</dt>
        <dd className="v">
          <Flap text={shortTime(builtAt)} order={1} replay={round} />
        </dd>
        <dd className="s">하루 한 번 다시 빌드</dd>
      </div>
      <div className="adm-stat">
        <dt>자동 검사 (main)</dt>
        <dd className="v">
          <a href={`${REPO_URL}/actions/workflows/checks.yml?query=branch%3Amain`} target="_blank" rel="noreferrer">
            GitHub 에서 확인 ↗
          </a>
        </dd>
      </div>
      <div className="adm-stat">
        <dt>열린 작업</dt>
        <dd className="v">
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
            GitHub 에서 확인 ↗
          </a>
        </dd>
      </div>
    </dl>
  );
}


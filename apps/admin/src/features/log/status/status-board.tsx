"use client";

// 사이트 상태 (작업 0105 → 작업 0303 어드민) — 숫자 칸 4개: 오늘 환율 수집 · 사이트 빌드 · 자동 검사 (main) · 열린 작업
//   값은 API 가 준 것만 — 자동 검사 · 열린 작업은 이 사이트가 아직 받아 오지 않아 GitHub 로 연결 (숫자를 지어내지 않음)
//   5분마다 다시 받음(남은 시간 표시) · "사이트 상태 다시 받기"(R)로 바로 · 받는 동안 숫자 칸은 불러오는 모양 → 받으면 안내판처럼 다시 넘어감
//   보일 값은 status-view.ts (그리기만)
import type { SiteStatus } from "@hav/shared/status";
import { Flap } from "@/shared/ui/flap/flap";
import { IconRefresh } from "@/shared/ui/icons/icons";
import { REPO_URL } from "@/shared/site";
import { countdownText } from "@/shared/time/time-text";
import { statusBoardView, statusLinks } from "./status-view";
import type { useSiteStatus } from "./use-site-status";

const LINKS = statusLinks(REPO_URL);

export function RefreshButton({ busy, left, onClick }: { busy: boolean; left: number; onClick: () => void }) {
  return (
    <button type="button" className={`adm-btn${busy ? " busy" : ""}`} onClick={onClick} aria-busy={busy} data-key-r title="R">
      <IconRefresh />
      사이트 상태 다시 받기
      <span className="cd" aria-label={`자동으로 다시 받기까지 ${countdownText(left)}`}>
        {countdownText(left)}
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
  const v = statusBoardView(st, builtAt);
  return (
    <dl className={`adm-stats${busy ? " loading" : ""}`}>
      <div className="adm-stat">
        <dt>
          <i className={`adm-dot${v.failed ? " bad" : ""}`} aria-hidden />
          오늘 환율 수집
        </dt>
        <dd className={`v${v.failed ? " bad" : ""}`}>
          <Flap text={v.run} replay={round} />
        </dd>
        {v.sub && <dd className="s">{v.sub}</dd>}
      </div>
      <div className="adm-stat">
        <dt>사이트 빌드</dt>
        <dd className="v">
          <Flap text={v.built} order={1} replay={round} />
        </dd>
        <dd className="s">하루 한 번 다시 빌드</dd>
      </div>
      <div className="adm-stat">
        <dt>자동 검사 (main)</dt>
        <dd className="v">
          <a href={LINKS.checks} target="_blank" rel="noreferrer">
            GitHub 에서 확인 ↗
          </a>
        </dd>
      </div>
      <div className="adm-stat">
        <dt>열린 작업</dt>
        <dd className="v">
          <a href={LINKS.issues} target="_blank" rel="noreferrer">
            GitHub 에서 확인 ↗
          </a>
        </dd>
      </div>
    </dl>
  );
}

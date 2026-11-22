"use client";

// 만드는 방식 — 검색 · 자동완성 (작업 0306) · 왼쪽 설명(찾는 범위 · 순위 · 설계) · 오른쪽 직접 써 보기(사이트의 실제 검색 함수 · 실제 통화 목록)
import { IconSearch } from "../../../shared/ui/icons/icons";
import { Panel, Stamp } from "../../../shared/ui/panel/panel";
import { useSearchDemo } from "./use-search-demo";
import { REPO_BLOB } from "../common/how";

const RANKS: [string, string][] = [
  ["코드 앞글자", "JP → JPY"],
  ["통화 이름 앞글자", "엔 → 엔화"],
  ["나라 앞글자", "베트 → 베트남 동"],
  ["도시 앞글자", "다낭 → 동 · 베트남 다낭"],
  ["가운데 일치", "크푸 → 유로 · 독일 프랑크푸르트"],
];
const TRY = ["jp", "엔", "다낭", "프랑크", "런던"];

export function HowSearch() {
  const s = useSearchDemo();
  return (
    <Panel id="how-search" testId="how-search" title="검색 · 자동완성" meta={<Stamp>통화 목록 /currencies · 작업 0192</Stamp>}>
      <div className="adm-srch">
        <div className="adm-pb adm-srch-l">
          <p className="adm-fc-lead">통화 코드만 알아야 찾을 수 있으면 여행자에게 불편합니다. 그래서 통화 코드 · 통화 이름 · 나라 · 도시로 찾게 했습니다.</p>
          <h3>순위</h3>
          <ol className="adm-rank">
            {RANKS.map(([k, ex]) => (
              <li key={k}>
                <b>{k}</b>
                <span>{ex}</span>
              </li>
            ))}
          </ol>
          <p className="adm-note">같은 순위면 원래 목록 순서 · 띄어쓰기와 대소문자는 무시 · 제안은 최대 8줄</p>
          <h3>설계</h3>
          <ul className="adm-fc">
            <li>
              <b>서버를 부르지 않음</b> — 빌드 때 받은 통화 목록 안에서 브라우저가 바로 계산합니다. 계산은 순수 함수 하나라 단위 테스트로 순위를 고정했습니다.
            </li>
            <li>
              <b>키보드 · 화면 읽기</b> — WAI-ARIA 콤보박스 규격: 화살표로 고르고 Enter 로 이동, Esc 로 닫음, 고른 줄을 화면 읽기 프로그램에 알립니다.
            </li>
            <li>
              <b>결과 없음</b> — &ldquo;찾는 통화가 없습니다 · 고를 수 있는 통화 N개&rdquo;를 검색 칸 아래에 겹쳐 띄워 아래 내용이 밀리지 않게 했습니다(작업 0248).
            </li>
            <li>
              <b>어드민 찾기 창</b> — 같은 생각을 어드민에도: ⌘K 로 화면 · 판 · 규칙을 찾고, 한글 초성(ㄱㅅ → 관세)도 됩니다.
            </li>
          </ul>
          <a className="adm-link src" href={`${REPO_BLOB}packages/shared/src/domain/currency-search.ts`} target="_blank" rel="noreferrer">
            검색 계산 코드 보기 ↗
          </a>
        </div>
        <div className="adm-pb adm-srch-r">
          <p className="adm-note">직접 써 보기 · 사이트와 같은 검색 함수 · 통화 {s.total}개</p>
          <div className="adm-srch-try">
            <span className="adm-note">눌러 보기</span>
            {TRY.map((t) => (
              <button key={t} type="button" onClick={() => s.type(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="adm-srch-box">
            <label className="adm-search">
              <IconSearch />
              <input
                type="search"
                role="combobox"
                aria-label="통화 검색 예시"
                aria-autocomplete="list"
                aria-expanded={s.hits.length > 0}
                aria-controls={s.listId}
                aria-activedescendant={s.act >= 0 ? s.optId(s.act) : undefined}
                placeholder="통화 · 나라 · 도시 검색"
                autoComplete="off"
                value={s.q}
                onChange={(e) => s.type(e.target.value)}
                onKeyDown={s.onKeyDown}
              />
            </label>
            {s.hits.length > 0 && (
              <ul id={s.listId} className="adm-srch-list" role="listbox" aria-label="통화 제안">
                {s.hits.map((h, i) => (
                  <li
                    key={h.code}
                    id={s.optId(i)}
                    role="option"
                    aria-selected={i === s.act}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      s.choose(i);
                    }}
                  >
                    <span className="c">{h.code}</span>
                    <span>{h.name}</span>
                    {h.where && <span className="w">· {h.where}</span>}
                    <span className="rk">{h.rank}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.empty && <p className="adm-srch-empty">찾는 통화가 없습니다 · 고를 수 있는 통화 {s.total}개</p>}
          </div>
          <p className="adm-note adm-srch-picked" aria-live="polite">
            {s.picked}
          </p>
        </div>
      </div>
    </Panel>
  );
}

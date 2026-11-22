"use client";

// 이름 바꾼 날 전후 — 일반 질문 표 (작업 0205 → 작업 0303 어드민) · 걸러 보기(낱자 · 초성 · / 단축키) · 정렬(기본 · 가나다 · 오래 잰 것) · 줄이 미끄러져 자리를 찾음
//   찾기 창에서 질문을 고르면(adm-pick) 그 질문으로 걸러 보고 줄을 잠깐 강조
import { IconSearch } from "@hav/ui/admin/icons";
import { pieces } from "@hav/ui/lib/match";
import { type QuestionRow, type QuestionSort, useQuestionTable } from "../hooks/use-question-table";
import type { AnswerCount } from "../lib/rename-compare";

export type { QuestionRow };

const answerText = (c: AnswerCount) => (c.measured === 0 ? "측정 기록 없음" : `찾음 ${c.found} · 인용 ${c.cited} / ${c.measured}회`);

export function QuestionsTable({ rows, before, after }: { rows: QuestionRow[]; before: string; after: string }) {
  const { q, setQ, sort, setSort, hit, list, body } = useQuestionTable(rows);
  const sortBtn = (id: QuestionSort, label: string) => (
    <button type="button" aria-pressed={sort === id} onClick={() => setSort(id)}>
      {label}
    </button>
  );
  return (
    <>
      <div className="adm-tools">
        <label className="adm-search">
          <IconSearch />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && q) {
                e.stopPropagation();
                setQ("");
              }
            }}
            placeholder="질문 걸러 보기 · 초성도 됩니다"
            aria-label="질문 걸러 보기"
            autoComplete="off"
            data-key-slash
          />
          <kbd>/</kbd>
        </label>
        <div className="adm-seg" role="group" aria-label="정렬">
          {sortBtn("base", "기본 순서")}
          {sortBtn("name", "가나다")}
          {sortBtn("long", "오래 잰 것")}
        </div>
        <span className="adm-count" aria-live="polite">
          {q ? `${list.length} / ${rows.length}개` : `${rows.length}개`}
        </span>
      </div>
      <div className="adm-tw">
        <table>
          <caption className="sr-only">찾음 = 검색 결과에 나옴 · 인용 = 답의 출처에 나옴 · 응답을 받은 측정 횟수 기준</caption>
          <thead>
            <tr>
              <th>질문</th>
              <th className="n">{before}</th>
              <th className="n">{after}</th>
            </tr>
          </thead>
          <tbody ref={body}>
            {list.map(({ r, m }) => (
              <tr key={r.question} data-q={r.question} data-cmd="AI 답변 질문" data-cmd-label={r.question} className={hit === r.question ? "hit" : undefined}>
                <td>
                  {pieces(r.question, m?.hits ?? []).map(([t, on], k) =>
                    // biome-ignore lint/suspicious/noArrayIndexKey: 조각 순서가 곧 키
                    on ? <mark key={k}>{t}</mark> : <span key={k}>{t}</span>,
                  )}
                </td>
                <td className={`n${r.before.measured === 0 ? " m" : ""}`}>{answerText(r.before)}</td>
                <td className={`n${r.after.measured === 0 ? " m" : ""}`}>{answerText(r.after)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="m" style={{ textAlign: "center", padding: 20 }}>
                  맞는 질문이 없습니다. 다른 낱말이나 초성(예: ㄱㅅ)으로 찾아 보세요
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// 일반 질문 표 — 걸러 보기 · 정렬 · 개수 글 (작업 0303 · 0312 에 use-question-table.ts · questions-table.tsx 에서 옮김) · 순수 함수
import { match } from "@/shared/search/match";
import type { AnswerCount } from "./rename-model";

export type QuestionRow = { question: string; before: AnswerCount; after: AnswerCount };
export type QuestionSort = "base" | "name" | "long";

/** 낱자 · 초성으로 거르고(맞은 조각 m 을 함께) 정렬 — 기본 순서 · 가나다 · 오래 잰 것(바꾸기 전 기록이 없는 질문은 뒤로) */
export function filterSortQuestions(rows: QuestionRow[], q: string, sort: QuestionSort) {
  const found = rows.map((r, i) => ({ r, i, m: match(r.question, q) })).filter((x) => x.m !== null);
  if (sort === "name") return [...found].sort((a, b) => a.r.question.localeCompare(b.r.question, "ko"));
  if (sort === "long") return [...found].sort((a, b) => (a.r.before.measured === 0 ? 1000 : 0) + a.i - ((b.r.before.measured === 0 ? 1000 : 0) + b.i));
  return found;
}

/** "3 / 12개" (거를 때) · "12개" */
export const countText = (q: string, shown: number, total: number) => (q ? `${shown} / ${total}개` : `${total}개`);

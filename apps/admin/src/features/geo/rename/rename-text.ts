// 이름 바꾼 날 전후 비교 문구 (작업 0205 · 0303 · 0312 에 rename-compare.tsx · questions-table.tsx 에서 옮김) · 순수 함수 · 자료가 없으면 "아직 없음" · "기록 없음"
import { numberText } from "@hav/shared/format";
import { type AnswerCount, type BrandSummary, type Period, perDayText, type renameCompare } from "./rename-model";

export const NONE = "아직 없음";

type Compare = ReturnType<typeof renameCompare>;

/** "하루 3.2회 (합계 45회)" */
export const periodText = (p: Period | null) => (p ? `하루 ${perDayText(p.perDay)}회 (합계 ${numberText(p.total)}회)` : "기록 없음");

/** "찾음 2 · 인용 1 / 5회" — 측정이 없으면 "측정 기록 없음" */
export const answerText = (c: AnswerCount) => (c.measured === 0 ? "측정 기록 없음" : `찾음 ${c.found} · 인용 ${c.cited} / ${c.measured}회`);

/** 브랜드 질문 시기 한 줄 — "3일 측정 (11-18 ~ 11-20) · 찾음 … " */
export const brandText = (b: BrandSummary | null) => (b ? `${b.days}일 측정 (${b.first} ~ ${b.last}) · ${answerText(b)}` : "측정 기록 없음");

/** 표 머리 — "바꾸기 전 12일" · "바꾼 뒤 6일" */
export const periodLabels = (c: Pick<Compare, "beforeDays" | "afterDays">) => ({ before: `바꾸기 전 ${c.beforeDays}일`, after: `바꾼 뒤 ${c.afterDays}일` });

/** AI 서비스 유입 줄 + 맨 아래 합계 줄 */
export const referralRows = (r: NonNullable<Compare["referrals"]>) => [...r.rows.map((x) => ({ name: x.name, before: x.before, after: x.after })), { name: "합계", before: r.sum.before, after: r.sum.after }];

/** 옛 속성 검색 노출 한 줄 */
export const oldSearchText = (old: Compare["search"]["old"]) => (old ? `노출 ${numberText(old.impressions)}회 · 클릭 ${numberText(old.clicks)}회 (${old.range})` : NONE);

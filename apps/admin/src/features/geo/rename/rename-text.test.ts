// 이름 바꾼 날 전후 문구 · 막대 좌표 · 질문 거르기 (작업 0312 — 화면 파일에 있던 계산을 순수 함수로)
import { describe, expect, it } from "vitest";
import { dayBarsView } from "./day-bars-view";
import { countText, filterSortQuestions } from "./questions-view";
import { answerText, brandText, oldSearchText, periodLabels, periodText, referralRows } from "./rename-text";

describe("이름 바꾼 날 전후 문구", () => {
  it("기간 · 답 · 브랜드 · 머리 · 검색", () => {
    expect(periodText(null)).toBe("기록 없음");
    expect(periodText({ days: 10, total: 1234, perDay: 123.44 })).toBe("하루 123.4회 (합계 1,234회)");
    expect(answerText({ measured: 0, found: 0, cited: 0 })).toBe("측정 기록 없음");
    expect(answerText({ measured: 5, found: 2, cited: 1 })).toBe("찾음 2 · 인용 1 / 5회");
    expect(brandText(null)).toBe("측정 기록 없음");
    expect(brandText({ days: 3, first: "11-18", last: "11-20", measured: 6, found: 1, cited: 0 })).toBe("3일 측정 (11-18 ~ 11-20) · 찾음 1 · 인용 0 / 6회");
    expect(periodLabels({ beforeDays: 12, afterDays: 6 })).toEqual({ before: "바꾸기 전 12일", after: "바꾼 뒤 6일" });
    expect(oldSearchText(null)).toBe("아직 없음");
    const p = { days: 1, total: 1, perDay: 1 };
    expect(referralRows({ rows: [{ name: "ChatGPT", before: p, after: null }], sum: { before: p, after: null } } as never).map((r) => r.name)).toEqual(["ChatGPT", "합계"]);
  });

  it("날짜별 막대 — 없으면 null · 이름 바꾼 날 점선 위치", () => {
    expect(dayBarsView("GPTBot", [], "2026-11-17")).toBeNull();
    const v = dayBarsView("GPTBot", [{ day: "2026-11-16", hits: 2 }, { day: "2026-11-17", hits: 4 }], "2026-11-17");
    expect(v?.markX).toBe(50);
    expect(v?.bars.map((b) => b.after)).toEqual([false, true]);
    expect(v?.label).toBe("GPTBot 날짜별 방문: 11-16 2회, 11-17 4회 (2026-11-17 이름 바꾼 날)");
  });

  it("질문 거르기 · 정렬 · 개수", () => {
    const c = (measured: number) => ({ measured, found: 0, cited: 0 });
    const rows = [{ question: "환율 언제", before: c(0), after: c(1) }, { question: "가방 직구", before: c(2), after: c(1) }];
    expect(filterSortQuestions(rows, "", "name").map((x) => x.r.question)).toEqual(["가방 직구", "환율 언제"]);
    expect(filterSortQuestions(rows, "", "long").map((x) => x.r.question)).toEqual(["가방 직구", "환율 언제"]);
    expect(filterSortQuestions(rows, "직구", "base").map((x) => x.r.question)).toEqual(["가방 직구"]);
    expect(countText("직구", 1, 2)).toBe("1 / 2개");
    expect(countText("", 2, 2)).toBe("2개");
  });
});

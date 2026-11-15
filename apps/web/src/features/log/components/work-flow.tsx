// 작업 흐름 — 시안: 흰 카드 안 남색 테두리 칩 + 화살표 · "자동 검사 통과"만 노랑 (작업 0170 · Figma 06) · 완료의 기준은 자동 검사 통과
import { WORK_FLOW } from "../lib/team";

export function WorkFlow() {
  return (
    <section aria-label="작업 흐름" className="mt-6 rounded-card bg-card px-5 py-4">
      <ol data-testid="work-flow" className="flex flex-wrap items-center gap-x-3 gap-y-3 text-small text-fg">
        {WORK_FLOW.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span className={`rounded-pill border-2 px-4 py-1.5 ${step === "자동 검사 통과" ? "border-sun bg-sun font-semibold text-pin-ink" : "border-cheap"}`}>{step}</span>
            {i < WORK_FLOW.length - 1 && (
              <span aria-hidden className="text-fg-2">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

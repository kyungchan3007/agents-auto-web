// 작업 흐름 — 시안 A(작업 0214): 흰 카드 안 번호 글줄 + 화살표 (알약 띠 없음) · "자동 검사 통과"만 노랑 (작업 0170 · Figma 06) · 완료의 기준은 자동 검사 통과
import { WORK_FLOW } from "../lib/team";

export function WorkFlow() {
  return (
    <section aria-label="작업 흐름" className="mt-4 rounded-card bg-card px-6 py-5">
      <ol data-testid="work-flow" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-fg">
        {WORK_FLOW.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span className={step === "자동 검사 통과" ? "rounded-pill bg-sun px-3 py-0.5 font-semibold text-pin-ink" : ""}>
              {i + 1}. {step}
            </span>
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

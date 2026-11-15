// 작업 흐름 — 요청 원문 보관 → 계획 → 테스트 먼저 → 구현 → 자동 검사 통과 → PR · 사람 머지 (작업 0170 · Figma 06) · 완료 기준은 자동 검사 통과
import { WORK_FLOW } from "../lib/team";

export function WorkFlow() {
  return (
    <section aria-labelledby="flow-title" className="mt-16">
      <h2 id="flow-title" className="font-display text-city font-normal tracking-tight">
        작업 흐름
      </h2>
      <ol data-testid="work-flow" className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3 text-small font-semibold text-fg">
        {WORK_FLOW.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-pill bg-foam px-3 py-1">{step}</span>
            {i < WORK_FLOW.length - 1 && (
              <span aria-hidden className="text-fg-2">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-small text-fg-2">완료의 기준은 자동 검사 통과입니다 · 머지는 사람이 합니다</p>
    </section>
  );
}

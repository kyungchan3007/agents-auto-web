// "이 사이트를 어떻게 만들었나" 요약 — 작업실 맨 위 (작업 0172) · 글은 lib/story.ts 의 STORY_STEPS 만 그림 (화면에 글을 직접 박지 않음)
// 새 디자인 그대로: 하늘 종이 바탕 · 큰 제목(font-display) · 단계 번호 · 위 선 하나 · 상자 · 그림자 · 바다 띠 없음
import { STORY_STEPS } from "../lib/story";

export function StorySection() {
  return (
    <section data-testid="site-story" aria-labelledby="story-title" className="mt-12">
      <h2 id="story-title" className="font-display text-city font-normal tracking-tight">
        이 사이트를 어떻게 만들었나
      </h2>
      <ol className="mt-8 space-y-10">
        {STORY_STEPS.map((step, i) => (
          <li key={step.id} data-testid="story-step">
            <div aria-hidden className="h-0.5 bg-cheap" />
            <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
              <div className="flex items-baseline gap-3">
                <span aria-hidden className="font-display text-city font-normal text-figure tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-city font-normal">{step.title}</h3>
              </div>
              <ul className="space-y-2 text-body text-fg">
                {step.bullets.map((b) => (
                  <li key={b.text} className="flex gap-2">
                    <span aria-hidden className="text-fg-2">
                      ·
                    </span>
                    <span>
                      {b.text} <span className="text-small text-fg-2">(근거 {b.source})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// "이 사이트를 어떻게 만들었나" 요약 — 작업실 맨 위 (작업 0172) · 글은 lib/story.ts 의 STORY_STEPS 만 그림 (화면에 글을 직접 박지 않음)
// 시안 A(작업 0214): 단계마다 흰 카드 하나 · 2열 격자(홀수 마지막 단계는 가로 전체) · 그림자 · 바다 띠 없음 · 다른 구간도 같은 카드 모양
// 근거는 PR · 작업 번호만 GitHub 링크로 (파일 경로는 처음 보는 사람에게 내부 용어라 화면에서 뺌)
import { SectionTitle } from "@hav/ui/text/heading";
import { REPO_URL } from "@/shared/site";
import { STORY_STEPS, sourceLinks } from "../lib/story";

export function StorySection() {
  return (
    <section data-testid="site-story" aria-labelledby="story-title" className="mt-10">
      <SectionTitle id="story-title" className="text-[1.625rem] leading-tight text-cheap">
        이 사이트를 어떻게 만들었나
      </SectionTitle>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2">
        {STORY_STEPS.map((step, i) => (
          <li key={step.id} data-testid="story-step" className={`rounded-card bg-card px-6 py-5 ${i === STORY_STEPS.length - 1 && STORY_STEPS.length % 2 === 1 ? "sm:col-span-2" : ""}`}>
            {/* 번호는 줄바꿈 없이 한 덩어리 · 긴 제목은 제목만 줄바꿈 */}
            <div className="flex items-baseline gap-3">
              <span aria-hidden className="shrink-0 text-city font-bold whitespace-nowrap text-figure tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <SectionTitle as="h3" className="min-w-0 text-city">{step.title}</SectionTitle>
            </div>
            <ul className="mt-3 space-y-2 text-small text-fg sm:text-body">
              {step.bullets.map((b) => {
                const links = sourceLinks(b.source, REPO_URL);
                return (
                  <li key={b.text} className="flex gap-2">
                    <span aria-hidden className="text-fg-2">
                      ·
                    </span>
                    <span>
                      {b.text}
                      {links.length > 0 && (
                        <span className="text-small text-fg-2">
                          {" "}
                          (근거{" "}
                          {links.map((l, k) => (
                            <span key={l.href}>
                              {k > 0 && " · "}
                              <a href={l.href} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                                {l.label}
                              </a>
                            </span>
                          ))}
                          )
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

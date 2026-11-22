// "이 사이트를 어떻게 만들었나" (작업 0172 → 작업 0303 어드민 맨 아래) — 글은 story.ts 의 STORY_STEPS 만 그림 (번호 · 링크는 storyView)
// 근거는 PR · 작업 번호만 GitHub 링크로
import { REPO_URL } from "@/shared/site";
import { Panel } from "@/shared/ui/panel/panel";
import { storyView } from "./story";

const STEPS = storyView(REPO_URL);

export function StorySection() {
  return (
    <Panel id="log-story" testId="site-story" title="이 사이트를 어떻게 만들었나">
      <ol className="adm-story">
        {STEPS.map((step) => (
          <li key={step.id} data-testid="story-step">
            <h3>
              <span className="num" aria-hidden>
                {step.num}
              </span>
              {step.title}
            </h3>
            <ul>
              {step.bullets.map((b) => (
                <li key={b.text}>
                  {b.text}
                  {b.links.length > 0 && (
                    <span className="adm-ref">
                      {" "}
                      근거{" "}
                      {b.links.map((l, k) => (
                        <span key={l.href}>
                          {k > 0 && " · "}
                          <a href={l.href} target="_blank" rel="noreferrer">
                            {l.label}
                          </a>
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

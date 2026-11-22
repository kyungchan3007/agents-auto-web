// "이 사이트를 어떻게 만들었나" (작업 0172 → 작업 0303 어드민 맨 아래) — 글은 lib/story.ts 의 STORY_STEPS 만 그림
// 근거는 PR · 작업 번호만 GitHub 링크로
import { REPO_URL } from "@/shared/site";
import { Panel } from "../../../shared/ui/panel/panel";
import { STORY_STEPS, sourceLinks } from "./story";

export function StorySection() {
  return (
    <Panel id="log-story" testId="site-story" title="이 사이트를 어떻게 만들었나">
      <ol className="adm-story">
        {STORY_STEPS.map((step, i) => (
          <li key={step.id} data-testid="story-step">
            <h3>
              <span className="num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              {step.title}
            </h3>
            <ul>
              {step.bullets.map((b) => {
                const links = sourceLinks(b.source, REPO_URL);
                return (
                  <li key={b.text}>
                    {b.text}
                    {links.length > 0 && (
                      <span className="adm-ref">
                        {" "}
                        근거{" "}
                        {links.map((l, k) => (
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
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

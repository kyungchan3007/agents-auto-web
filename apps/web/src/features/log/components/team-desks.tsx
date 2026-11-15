// 팀 책상 — lead · builder · test · geo 네 역할과 맡은 일 (작업 0170 · Figma 06)
// 역할 설명은 .agents/orchestration/team.md 와 같은 뜻 · "지금 맡은 일"은 실제 기록에서만 보여 주는 칸이라 기록을 받기 전에는 비워 둠 (지어내지 않음)
import { TEAM_DESKS } from "../lib/team";

export function TeamDesks() {
  return (
    <section aria-labelledby="team-title" className="mt-16">
      <h2 id="team-title" className="font-display text-city font-normal tracking-tight">
        팀 책상
      </h2>
      <ul data-testid="team-desks" className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM_DESKS.map((d) => (
          <li key={d.id} className="border-t-2 border-cheap pt-3">
            <p className="font-display text-city font-normal text-figure">{d.id}</p>
            <p className="mt-1 text-body text-fg">{d.duty}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// 팀 책상 — 시안: 남색 테두리 카드 4개 (lead · builder · test · geo · 맡은 일) (작업 0170 · Figma 06)
// 역할 설명은 .agents/orchestration/team.md 와 같은 뜻 · "지금 맡은 일"은 실제 기록에서만 보여 주는 칸이라 기록을 받기 전에는 비워 둠 (지어내지 않음)
import { TEAM_DESKS } from "../lib/team";

export function TeamDesks() {
  return (
    <section aria-label="팀 책상" className="mt-6">
      <ul data-testid="team-desks" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM_DESKS.map((d) => (
          <li key={d.id} className="rounded-card border-2 border-cheap px-5 py-4">
            <p className="font-display text-[1.75rem] leading-tight font-normal text-cheap">{d.id}</p>
            <p className="mt-1 text-small text-fg-2">{d.duty}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

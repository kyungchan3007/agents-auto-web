// 팀 책상 — 시안 A(작업 0214): 같은 흰 카드 4개 (테두리 없음) (lead · builder · test · geo · 맡은 일) (작업 0170 · Figma 06)
// 역할 설명은 .agents/orchestration/team.md 와 같은 뜻 · "지금 맡은 일"은 실제 기록에서만 보여 주는 칸이라 기록을 받기 전에는 비워 둠 (지어내지 않음)
import { SectionTitle } from "@hav/ui/text/heading";
import { TEAM_DESKS } from "../lib/team";

export function TeamDesks() {
  return (
    <section aria-label="팀 책상" className="mt-4">
      <ul data-testid="team-desks" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM_DESKS.map((d) => (
          <li key={d.id} className="rounded-card bg-card px-6 py-5">
            <SectionTitle as="p" className="text-[1.75rem] leading-tight text-cheap">{d.id}</SectionTitle>
            <p className="mt-1 text-small text-fg-2">{d.duty}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

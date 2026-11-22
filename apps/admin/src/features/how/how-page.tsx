"use client";

// 만드는 방식 (작업 0303 · 시안 Version 6) — 리뷰어가 한 화면에서 이해하도록: 소개 · 숫자 → 작업 하나가 지나가는 길(자리 누르면 설명 · 따라가기)
//   → 도구 3(명령 보기) → Herdr 모습 → 규칙 12(묶음 · 펼치기 · 원본 링크) → 궁금한 것(골라 보기 · 화살표)
//   글은 common/how.ts 하나에서 · 숫자는 빌드 때 저장소에서 센 값만(못 세면 칸을 뺌) · 판마다 하위 폴더 (작업 0312)
import { AdminNav } from "@/shared/nav/admin-nav";
import { Flap } from "@/shared/ui/flap/flap";
import { Stamp } from "@/shared/ui/panel/panel";
import { HowFaq } from "./faq/how-faq";
import { HowFlow } from "./flow/how-flow";
import { HowFocus } from "./focus/how-focus";
import { HowHerdr } from "./herdr/how-herdr";
import type { HowCounts } from "./repo-counts/repo-counts";
import { HowRules } from "./rules/how-rules";
import { HowSearch } from "./search/how-search";
import { howStats } from "./stats/how-stats";
import { HowTools } from "./tools/how-tools";
import { HowTrials } from "./trials/how-trials";
import "./how.css";

export function HowPage({ counts }: { counts: HowCounts }) {
  const stats = howStats(counts);
  return (
    <AdminNav page="how">
      <div className="adm-top">
        <div>
          <p className="adm-eyebrow">만드는 방식</p>
          <h1>사람 한 명과 에이전트 다섯이 이 사이트를 만듭니다</h1>
          <p className="adm-lede">사람은 기획 · 설계와 디자인 방향 · 레퍼런스를 정하고, 시안을 고르고, 머지를 결정합니다. 계획 · 구현 · 테스트 · 측정 · 점검은 OpenRig 로 묶은 에이전트 팀이 맡고, 규칙과 자동 검사가 그 사이를 지킵니다.</p>
        </div>
        <Stamp>빌드 때 저장소에서 센 값</Stamp>
      </div>
      <section className="adm-panel" aria-label="숫자">
        <dl className="adm-stats" style={{ ["--n" as string]: stats.length }}>
          {stats.map((x, i) => (
            <div key={x.k} className="adm-stat">
              <dt>{x.k}</dt>
              <dd className="v">
                <Flap text={x.v} order={i} />
                <small>{x.unit}</small>
              </dd>
              <dd className="s">{x.s}</dd>
            </div>
          ))}
        </dl>
      </section>
      <HowFocus />
      <HowSearch />
      <HowFlow />
      <HowTools />
      <HowHerdr />
      <HowRules />
      <HowFaq />
      <HowTrials />
    </AdminNav>
  );
}

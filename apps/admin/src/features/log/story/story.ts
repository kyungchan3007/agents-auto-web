// 작업실 맨 위 "이 사이트를 어떻게 만들었나" 요약의 글 (작업 0172) — 화면은 이 상수만 그림
// 숫자 · 사건은 docs/project-facts.md 에 있는 것만 · 각 불릿 옆에 근거(PR · 작업 번호 · 문서 경로)를 데이터로 둠
// 글 원칙: 불릿 위주 · 한 줄 짧게 · 표 없음 · 내부 용어 대신 풀어 쓴 말 · 자기 평가 · 한계 항목 없음 · 측정하지 않은 효과를 성과로 쓰지 않음 · "~합니다" 체
export type StoryBullet = { text: string; source: string };
export type StoryStep = { id: string; title: string; bullets: readonly StoryBullet[] };

export const STORY_STEPS: readonly StoryStep[] = [
  {
    id: "problem",
    title: "문제 정의",
    bullets: [
      { text: "여행 · 직구 전에 오늘 환율이 싼 편인지 한눈에 알려 줍니다.", source: "docs/architecture.md" },
      { text: "환율 · 물가 공개 자료를 하루 한 번 받아 정리합니다.", source: "docs/architecture.md" },
      { text: "받지 못한 값은 지어내지 않고 '자료 없음'으로 표시합니다.", source: "docs/domain/fx.md" },
    ],
  },
  {
    id: "apis",
    title: "외부 공공 API 연결",
    bullets: [
      { text: "한국수출입은행 환율을 평일 12:00에 받고, 실패하면 13:30 · 15:00에 다시 받습니다.", source: "docs/domain/fx.md" },
      { text: "관세청 과세환율은 주 1회 받고, 이미 받은 주는 건너뜁니다.", source: "#178" },
      { text: "통계청 항공료 · 단체여행 지수와 한국은행 수입물가지수는 매달 최근 24개월을 다시 받습니다.", source: "#179 · #181" },
      { text: "세계은행 물가 지표가 API에서 빠져 계산식을 바꿨습니다.", source: "apps/api/src/features/prices/worldbank.ts" },
      { text: "받은 응답은 형식을 검사해 짐바브웨 물가 0.0003 오류를 걸러 냈습니다.", source: "작업 0035" },
    ],
  },
  {
    id: "operate",
    title: "구현 · 운영",
    bullets: [
      { text: "에이전트 팀이 계획 · 구현 · 테스트 · 검색 노출 측정으로 역할을 나눕니다.", source: ".agents/orchestration/team.md" },
      { text: "모든 작업의 요청 원문을 그대로 보관합니다.", source: ".agents/specs/" },
      { text: "완료의 기준은 자동 검사 통과이고, 머지는 사람이 합니다.", source: ".agents/checks.sh" },
      { text: "작업마다 허점을 기록하고, 반복된 허점은 테스트로 막습니다.", source: ".agents/specs/" },
    ],
  },
  {
    id: "incidents",
    title: "사고 대응",
    bullets: [
      { text: "2026년 10월 29일 데이터베이스 하루 읽기 한도 500만 줄을 넘었습니다.", source: "작업 0077" },
      { text: "원인은 기본 키 순서였고, (통화, 날짜) 색인으로 한 통화 1년 조회를 약 245줄로 줄였습니다.", source: "#78" },
      { text: "응답 캐시를 더해 같은 날 같은 응답은 한 줄만 읽습니다.", source: "#85" },
      { text: "수출입은행 연결 오류로 영업일 4일 동안 예비 값만 저장됐습니다.", source: "#128" },
      { text: "예비 값을 '오늘 값 있음'으로 봐 재시도를 건너뛴 탓이라, '공식 값이 있는가'로 판단합니다.", source: "#125" },
    ],
  },
  {
    id: "results",
    title: "결과 측정",
    bullets: [
      { text: "질문 24개를 직접 검색해 노출 · 인용을 기록합니다.", source: "docs/geo-measurement.md" },
      { text: "측정한 회차 모두 노출 0 · 인용 0입니다.", source: "apps/api/data/geo-answers" },
      { text: "구글 검색 노출 3회 · 클릭 0회였습니다.", source: "#157" },
      { text: "사이트맵 29개 주소는 모두 정상인데 구글은 '가져올 수 없음'으로 표시합니다.", source: "#157" },
    ],
  },
];

/**
 * 화면에 보여 줄 근거 링크 — PR 번호(#78)는 그 PR 로, 작업 번호(작업 0077)는 그 번호로 시작하는 PR 검색으로 (GitHub)
 * 파일 · 문서 경로는 처음 보는 사람에게 내부 용어라 화면에서 뺌 (데이터의 source 값은 그대로)
 */
export function sourceLinks(source: string, repoUrl: string): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  for (const m of source.matchAll(/#(\d+)|작업 (\d{3,4})/g)) {
    if (m[1]) out.push({ label: `#${m[1]}`, href: `${repoUrl}/pull/${m[1]}` });
    else out.push({ label: `작업 ${m[2]}`, href: `${repoUrl}/pulls?q=${encodeURIComponent(`is:pr "작업 ${m[2]}"`)}` });
  }
  return out;
}

/** 화면에 그릴 단계 — 두 자리 번호 · 불릿마다 근거 링크 (작업 0312 에 story-section.tsx 에서 옮김) */
export const storyView = (repoUrl: string) =>
  STORY_STEPS.map((step, i) => ({
    ...step,
    num: String(i + 1).padStart(2, "0"),
    bullets: step.bullets.map((b) => ({ text: b.text, links: sourceLinks(b.source, repoUrl) })),
  }));

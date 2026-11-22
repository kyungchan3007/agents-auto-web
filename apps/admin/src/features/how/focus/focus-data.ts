// 만드는 방식 — 세 칸: 데이터 흐름 · 상태 관리 · 에이전트 최적화 (작업 0306 · 0312 에 trials/story.ts 에서 나눔)
export const HOW_FOCUS: { title: string; lead: string; points: string[]; source: string }[] = [
  {
    "title": "데이터 흐름",
    "lead": "받은 값만 보여 주고, 못 받은 값은 비워 둡니다",
    "points": [
      "공공 API → Worker 예약 수집 → D1 → API Worker → 사이트 BFF → 정적 빌드 + 브라우저에서 한 번 더",
      "외부 응답은 형식 검사를 지나야 저장 · 받지 못한 숫자는 지어내지 않고 \"자료 없음\"",
      "공식 값과 예비 값(Frankfurter)을 구분해 저장 · 화면 바닥에 출처를 함께 적음"
    ],
    "source": "docs/architecture.md"
  },
  {
    "title": "상태 관리",
    "lead": "빌드 때 값을 먼저, 브라우저가 새 값을 덧입힙니다",
    "points": [
      "빌드 때 받은 값으로 첫 화면을 그리고 브라우저가 다시 받음 · 실패하면 빌드 때 값을 그대로",
      "상태판은 탭이 보일 때만 5분마다 · 같은 날 같은 응답은 D1 에서 한 줄만 읽는 응답 캐시",
      "화면은 그리기만 · 상태와 효과는 훅으로 · 계산은 순수 함수로 (코드 역할 검사가 막음)"
    ],
    "source": "apps/admin/src/shared/live/use-live.ts"
  },
  {
    "title": "에이전트 최적화",
    "lead": "규칙은 문서보다 검사로 지킵니다",
    "points": [
      "자리마다 역할 · 고칠 수 있는 파일을 나누고, 판단은 Opus · 실행은 Sonnet",
      "완료 = PR 최신 커밋 CI gate 하나 · 보호 파일은 사람 승인 없이 통과 안 됨",
      "반복된 실수는 훅으로: 한국어 답 · 작업 폴더 밖 쓰기 · 로컬 전체 e2e"
    ],
    "source": ".agents/orchestration/team.md"
  }
];

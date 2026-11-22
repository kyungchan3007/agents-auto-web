// 만드는 방식 — 세 칸 · 시행착오 자료 (작업 0306 · 시안 Version 10)
//   시행착오는 작업 문서 · PR · 이슈로 확인한 사실만 · 숫자는 문서에 있는 실측만 · 아직 끝나지 않은 일은 done: false
export type TrialCat = "데이터" | "테스트" | "에이전트 운영" | "배포" | "검색" | "화면";
export type Trial = { day: string; cat: TrialCat; title: string; what: string; why: string; fix: string; result: string; refs: { label: string; href: string }[]; done: boolean };

export const TRIAL_CATS: TrialCat[] = ["데이터", "테스트", "에이전트 운영", "배포", "검색", "화면"];

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
    "source": "packages/ui/src/hooks/use-live.ts"
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

export const HOW_TRIALS: Trial[] = [
  {
    "day": "2026-10-29",
    "cat": "데이터",
    "title": "DB 하루 읽기 한도 초과로 API 500",
    "what": "운영 API 의 D1 읽기 경로가 모두 500 을 냈습니다. 24시간 동안 8,165,004줄을 읽어 무료 한도 500만 줄을 넘었습니다.",
    "why": "기본 키가 (날짜, 통화)라 한 통화 1년치를 찾을 때 모든 통화 약 5,400줄을 읽었고, 그날 빌드를 수십 번 했습니다.",
    "fix": "(통화, 날짜) 색인을 더하고, 같은 날 같은 응답은 한 줄만 읽는 응답 캐시를 D1 에 두었습니다.",
    "result": "한 통화 1년 조회 약 5,400줄 → 약 245줄 · 같은 날 두 번째 빌드부터 요청마다 한 줄.",
    "refs": [
      {
        "label": "작업 0077",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0077-fx-index/plan.md"
      },
      {
        "label": "작업 0083",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0083-api-cache/plan.md"
      },
      {
        "label": "#78",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/78"
      },
      {
        "label": "#85",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/85"
      }
    ],
    "done": true
  },
  {
    "day": "2026-10-29",
    "cat": "배포",
    "title": "운영 빌드 지킴이 작동하지 않아 \"자료 없음\" 배포",
    "what": "API 가 500 인 동안 운영 사이트가 \"자료 없음\"으로 덮였습니다.",
    "why": "빌드 도구(turbo)가 운영 환경 변수를 걸러 내서, 운영 빌드를 멈추는 지킴이 운영 빌드를 알아보지 못했습니다. 실제 빌드 경로로 확인하지 않았습니다.",
    "fix": "환경 변수를 통과시키고, \"운영 동작은 실제와 같은 명령으로 확인\"을 허점 기록에 남겼습니다.",
    "result": "고치기 전에는 API 500 인데 빌드 성공 → 고친 뒤에는 \"운영 빌드 멈춤\"으로 실패.",
    "refs": [
      {
        "label": "작업 0078",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0078-turbo-env/plan.md"
      },
      {
        "label": "#80",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/80"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-02",
    "cat": "데이터",
    "title": "예비 값을 \"오늘 값 있음\"으로 봐 재시도를 건너뜀",
    "what": "수출입은행 수집이 간헐적으로 실패해 영업일 4일 내내 예비 출처 값만 저장됐습니다. 통화가 22개에서 21개로 줄었는데 화면은 정상으로 보여 4일 동안 아무도 몰랐습니다.",
    "why": "12:00 수집이 실패하면 예비 값을 \"오늘 값 있음\"으로 판단해 13:30 · 15:00 재시도를 모두 건너뛰었습니다.",
    "fix": "재시도 기준을 \"공식 값이 있는가\"로 바꾸고, 상태판이 예비 값만 있는 날 경고하게 하고, 같은 회차 안에서 30초 · 90초 뒤 다시 시도하게 했습니다.",
    "result": "11-09 13:30 자동 재시도로 공식 값 22개 회복 · 실패의 근본 원인은 아직 확인하지 못했습니다.",
    "refs": [
      {
        "label": "작업 0121",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0121-official-retry/plan.md"
      },
      {
        "label": "작업 0145",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0145-status-retry/plan.md"
      },
      {
        "label": "#125",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/125"
      },
      {
        "label": "이슈 #128",
        "href": "https://github.com/kyungchan3007/agents-auto-web/issues/128"
      },
      {
        "label": "#151",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/151"
      },
      {
        "label": "#165",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/165"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-06",
    "cat": "데이터",
    "title": "금요일마다 예약 수집이 돌지 않음",
    "what": "금요일 12:00 · 13:30 · 15:00 수집이 두 주 연속 돌지 않았습니다.",
    "why": "Cloudflare 예약 실행은 요일 숫자 1 을 일요일로 셉니다. \"1-5\"가 일~목이었고, 확인 스크립트는 일반 규칙(1=월요일)으로 계산해 놓쳤습니다.",
    "fix": "요일을 MON-FRI 글자로 바꾸고, 숫자 요일을 쓰면 실패하는 테스트를 넣었습니다.",
    "result": "두 번째 누락까지 원인을 \"배포 직후\"로 잘못 짚었다는 것도 허점에 남겼습니다.",
    "refs": [
      {
        "label": "작업 0138",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0138-cron-weekday/plan.md"
      },
      {
        "label": "#144",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/144"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-10",
    "cat": "테스트",
    "title": "테스트는 통과했지만 실행되지 않은 스크립트",
    "what": "AI 답변 측정 스크립트가 머지 뒤 실행하자마자 멈췄습니다.",
    "why": "순수 함수 테스트만 돌리고 스크립트를 실제로 한 번도 실행하지 않았고, 스크립트 폴더는 타입 검사 대상이 아니었습니다.",
    "fix": "스크립트도 타입 검사에 넣고, 실행 환경이 지원하지 않는 문법을 막는 설정을 켰습니다.",
    "result": "키 없이 실행하면 정상 종료.",
    "refs": [
      {
        "label": "작업 0148",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0148-geo-ask-strip/plan.md"
      },
      {
        "label": "#155",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/155"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-10",
    "cat": "검색",
    "title": "검색 노출 0 · 사이트맵 \"가져올 수 없음\"",
    "what": "질문 24개 모두에서 검색 노출 0 이었고, Search Console 의 사이트맵은 계속 \"가져올 수 없음\"이었습니다. 이름을 바꾼 뒤 새 속성으로 옮기며 다시 0 부터 시작했습니다.",
    "why": "확정되지 않았습니다. 사이트맵 파일은 정상(29개 주소 모두 200)이고, 구글이 아직 가져가지 않은 것으로 봅니다.",
    "fix": "바뀐 페이지를 IndexNow 로 알리고, 사이트맵 원인을 조사하고, 새 속성(flapfx.com)으로 옮겨 사이트맵을 다시 제출했습니다(성공).",
    "result": "아직 해결되지 않았습니다. 이슈를 열어 두고 매일 조사 기록을 남깁니다.",
    "refs": [
      {
        "label": "이슈 #157",
        "href": "https://github.com/kyungchan3007/agents-auto-web/issues/157"
      },
      {
        "label": "작업 0161",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0161-sitemap-investigation/plan.md"
      },
      {
        "label": "작업 0206",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0206-gsc-flapfx/plan.md"
      },
      {
        "label": "#150",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/150"
      },
      {
        "label": "#175",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/175"
      },
      {
        "label": "#244",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/244"
      }
    ],
    "done": false
  },
  {
    "day": "2026-11-19",
    "cat": "테스트",
    "title": "게이트 결과를 잘못 읽고 \"통과\" 보고",
    "what": "모션 작업에서 결과를 잘못 보고한 일이 네 번 있었습니다. 미리보기 빌드 통과만 보고 게이트 실패를 놓치거나, 로그 끝 몇 줄만 읽어 앞쪽 실패를 놓치거나, 진행 중인 실행을 통과로 셌습니다.",
    "why": "\"통과\"라고 말하는 기준이 하나로 정해져 있지 않았습니다.",
    "fix": "판정 규칙을 하나로: PR 최신 커밋의 CI gate 가 끝나고 성공일 때만 완료 · 로그 전체에서 실패 표시 개수 확인 · 보고 형식 고정. 절대 규칙 1 도 이것으로 바꿨습니다.",
    "result": "",
    "refs": [
      {
        "label": "작업 0232",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0232-gate-verdict/plan.md"
      },
      {
        "label": "작업 0239",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0239-team-rules/plan.md"
      },
      {
        "label": "#280",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/280"
      },
      {
        "label": "#287",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/287"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-20",
    "cat": "테스트",
    "title": "자주 흔들리는 e2e",
    "what": "재시도 뒤에야 통과하는 테스트가 여러 개 나왔고, 운영 반영 PR 에서도 휴대폰 테스트가 한 번 실패한 뒤 통과했습니다.",
    "why": "화면이 이어받기(하이드레이션)나 최종 배치를 마치기 전에 값을 한 번만 읽었습니다.",
    "fix": "재시도 횟수를 늘리지 않고, 이어받기를 기다리고 최종 모양이 될 때까지 다시 읽게 했습니다.",
    "result": "CPU 6배 느린 환경에서 실패 33건 → 0건 · 5번 반복 585 통과 · 흔들림 0. 몇 개는 아직 흔들릴 수 있어 남은 문제로 기록했습니다.",
    "refs": [
      {
        "label": "작업 0242",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0242-flaky-e2e/trace.md"
      },
      {
        "label": "작업 0262",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0262-flaky-rename-compare/plan.md"
      },
      {
        "label": "#290",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/290"
      },
      {
        "label": "#314",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/314"
      }
    ],
    "done": false
  },
  {
    "day": "2026-11-20",
    "cat": "에이전트 운영",
    "title": "항공권 가격 0건인 채 머지",
    "what": "항공권 출발일 달력 작업이 머지된 직후 운영 자료가 0건이었고, 팀보다 사용자가 먼저 봤습니다. 수출입은행 실패도 늦게 잡힌 일이었습니다.",
    "why": "수집원이 환율 · 과세환율 · 물가지표 · 항공권으로 늘었는데 실패와 이상 값을 알아채는 자리가 없었습니다.",
    "fix": "수집 상태를 지키는 data 자리를 새로 두고, 점검 방법 · 자료별 기준 · 기록을 한 문서에 모았습니다.",
    "result": "첫 점검 날 336줄(공항 8곳 × 42일)을 확인했습니다.",
    "refs": [
      {
        "label": "작업 0237",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0237-team-geo-data/plan.md"
      },
      {
        "label": "#285",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/285"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-20",
    "cat": "테스트",
    "title": "전체 게이트가 22분",
    "what": "전체 게이트가 약 22분 걸렸고 대부분이 e2e 였습니다. 병렬화 뒤에도 작업 PR 마다 고른 e2e 로 게이트 5~8분이 걸렸습니다.",
    "why": "테스트 병렬 설정이 없었고, 작업 PR 마다 e2e 를 돌렸습니다.",
    "fix": "CI 병렬을 4 로 늘리고, 작업 PR(develop)은 빌드까지만 · 전체 e2e 는 하루 한 번 main 으로 가는 PR 에서만 돌게 했습니다.",
    "result": "e2e 17.1분 → 11.3분 · 전체 약 18분 → 12.9분 · 작업 PR 게이트는 2분 남짓.",
    "refs": [
      {
        "label": "작업 0238",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0238-e2e-parallel/trace.md"
      },
      {
        "label": "작업 0295",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0295-develop-no-e2e/plan.md"
      },
      {
        "label": "#286",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/286"
      },
      {
        "label": "#346",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/346"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-22",
    "cat": "에이전트 운영",
    "title": "지시 문구 탓에 builder 가 테스트까지",
    "what": "lead 가 builder 지시에 빌드 · 단위 테스트 확인을 붙여, builder 와 test 가 같은 확인을 두 번 했습니다.",
    "why": "팀 규칙(\"확인은 test 가 이어받음\")과 지시문이 어긋났습니다.",
    "fix": "builder 는 구현과 푸시 전 타입 검사 · 바꾼 파일 lint 만, 나머지 확인은 모두 test. 타입 · lint 를 builder 에 둔 것은 test 로 넘겼다 돌아오는 왕복을 줄이려는 것입니다.",
    "result": "",
    "refs": [
      {
        "label": "작업 0284",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0284-builder-checks/plan.md"
      },
      {
        "label": "#337",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/337"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-22",
    "cat": "에이전트 운영",
    "title": "규칙이 있어도 로컬에서 전체 e2e",
    "what": "\"로컬 전체 e2e 금지\" 규칙이 있었는데도 지시하는 쪽이 범위를 덧붙여 사실상 전체를 돌렸습니다.",
    "why": "규칙이 문서에만 있어서, 지시에 덧붙인 범위가 규칙을 이겼습니다.",
    "fix": "명령 실행 직전에 검사하는 훅을 넣어, 이 작업에서 바꾼 spec 밖의 로컬 e2e 를 막았습니다.",
    "result": "",
    "refs": [
      {
        "label": "작업 0294",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0294-e2e-guard/plan.md"
      },
      {
        "label": "#344",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/344"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-22",
    "cat": "테스트",
    "title": "모양만 바꿔도 새 테스트",
    "what": "모서리 · 투명도 · 문구처럼 모양만 바뀌는 작업에도 새 테스트를 쓰느라 시간이 들었습니다.",
    "why": "\"요구마다 테스트를 하나 이상\" 규칙이 작업 종류와 상관없이 적용됐습니다.",
    "fix": "작업을 세 종류로 나눠, 숫자 · 동작이 바뀌거나 새 조건이 붙을 때만 새 테스트를 씁니다.",
    "result": "",
    "refs": [
      {
        "label": "작업 0297",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0297-design-test-scope/plan.md"
      },
      {
        "label": "작업 0301",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0301-copy-no-test/plan.md"
      },
      {
        "label": "#348",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/348"
      },
      {
        "label": "#354",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/354"
      }
    ],
    "done": true
  },
  {
    "day": "2026-11-22",
    "cat": "화면",
    "title": "홈 3D 인트로가 레티나에서 버벅임",
    "what": "같은 코드로 재 보니 화면 배율 1 은 60fps, 배율 2(레티나)는 29fps 였습니다.",
    "why": "화면 전체 후처리(GTAO 샘플 16)와 배율 2 의 4배 픽셀이 곱해졌습니다.",
    "fix": "배율이 1 보다 클 때만 그림자 후처리를 절반 해상도로, 후처리 버퍼의 MSAA 를 끕니다. 배율 1 화면은 그대로입니다.",
    "result": "배율 2 에서 29 → 60fps · 프레임당 11.9 → 4.3ms.",
    "refs": [
      {
        "label": "작업 0300",
        "href": "https://github.com/kyungchan3007/agents-auto-web/blob/main/.agents/specs/0300-intro-perf/plan.md"
      },
      {
        "label": "#357",
        "href": "https://github.com/kyungchan3007/agents-auto-web/pull/357"
      }
    ],
    "done": true
  }
];

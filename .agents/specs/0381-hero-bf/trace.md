# Trace: 과정 기록

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 계획 | request · prd · sdd · task.md 고정 | 기간 고르기는 인라인 스크립트 + CSS(깜빡임 없음) · 사용자 추가 지시로 블프 먼저 · origin/develop 기준(0380 에 기대지 않음) · develop 머지 뒤 바로 main · 릴리스 없음 |

| 2 | 구현 · 확인 | builder 구현 → test 확인: 영수증 앞 장 mask 로 안 그려짐 · 도장 위치 · 320px 글자 8.3px → 고침 | DOM 검사만으로는 그림이 안 보이는 것을 못 잡음 · 화면 확인이 잡음 |
| 3 | gate | 규칙 검사 3개 실패(tsx 계산 · 기능 폴더 가져오기 · color-scheme) → lib · src/shared/customs · 삭제 | gate ALL PASS (full) 123ff75c |

## 허점
- builder 가 구현 전에 role-boundary · light-only 규칙을 확인하지 않아 gate 한 번 실패. 홈 · 계산 같은 기능을 엮는 작업은 sdd 에 "함께 쓰는 것은 src/shared" 를 먼저 적을 것.
- 기간이 끝나면(12-01 17:00 뒤) blackfriday 폴더 · 자리 바꿈 · head 스크립트 · e2e default-hero 도우미를 지우는 작업이 필요(이번 범위 밖).

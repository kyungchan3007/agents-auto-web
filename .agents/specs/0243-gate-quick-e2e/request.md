# 요청 원문

> 2026-11-20 · 사용자 → claude-desktop → lead. 팀 튜닝 작업서(.tmp/task-team-tuning-1120.md) D 절과 11:22Z 전달을 받은 그대로 붙인다.

## 작업서 D 절

### D. Quick PR 도 CI 에서 e2e 를 돌린다 (보호 파일 · 사용자 승인 필요)
- 사용자 원문: "퀵에서도 PR 에사도 e2e 를 돌리는게 맞지"
- 지금: checks.sh 가 Quick 이면 build · test:e2e 를 건너뛴다(FULL_SCRIPTS 는 MODE=full 일 때만).
- 바꿀 것: CI(PR)에서는 Quick 이라도 build + e2e 를 돌린다. 단, 화면에 영향이 없는 PR(바뀐 파일이 .agents/** · docs/** · *.md · apps/api/data/** 뿐)은 건너뛴다 — 0236 · 0237 같은 문서 · 측정 PR 까지 20분 걸리지 않게.
- 바뀌는 파일 .agents/checks.sh(또는 .agents/scripts/**)는 보호 파일이다. PR 을 연 뒤 사용자가 harness-approved 라벨을 단다. 팀은 라벨을 달지 않는다.
- 주의: 빌드마다 운영 D1 을 읽는다(하루 읽기 한도). Quick PR 도 푸시마다 빌드하게 되니, 푸시를 묶어서 한다(고칠 것을 모아 한 번에 푸시).
- A(병렬) 다음에 한다. A 로 e2e 시간이 줄어야 Quick PR 이 덜 무겁다. 로컬 규칙(B-1)의 "Quick 은 바뀐 화면 spec 만 로컬" 은 그대로 두고, 전체는 CI 가 본다.


## 11:22Z 전달 (그대로)

[claude-desktop] 사용자 "머지해" → #286(0238 · workers 4) rebase 머지했습니다. 다음: ① 흔들리는 e2e 고치기를 새 작업으로 test 에게 — currency-chart.spec:146 · detail-design.spec:90 · prices-route.spec:94 · prices-route.spec:80(휴대폰) · pages.spec:342. 고정 대기 대신 움직임이 끝날 때까지 기다리도록. ② 그다음 D(0242, Quick PR 도 CI e2e · 작업 기록 검사를 게이트 앞쪽으로 · 게이트는 harness-approved 라벨에만 반응). main CI gate 는 제가 확인합니다.

> 번호: 전달문의 'D(0242)' 는 ① 이 0242 를 받아 D 가 0243 이 됨 (lead).

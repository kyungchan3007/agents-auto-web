# 계획

## 무엇을 · 왜
- 어드민 /geo 둘째 adm-grid 줄에서 오른쪽 칸(검색 노출 1074 + AI 봇이 읽은 페이지 372 + AI 서비스 유입 98)이 왼쪽 브랜드 질문 표(1204)보다 약 380px 길어 왼쪽 아래가 비어 보임(1024px 폭에서 잼).
- 둘째 줄 오른쪽 칸은 GeoSearch + GeoReferrals 만 남김(약 1190px).
- GeoPages 는 아래 geo-grid 안 GeoBotPages 바로 위로 옮겨 화면 폭 전체로 둠(전체 → 봇별 순서).
- 패널을 빼거나 합치지 않음 · 패널 내용 · 모양 그대로 · 첫 줄 그대로.
- 파일 맨 위 순서 주석도 새 순서로.
- 작업 종류 ②(위치) · 새 테스트 없음. 기존 geo-bot-pages e2e 의 폭 비교(geo-pages · geo-grid)는 새 배치에서도 성립해야 함. 바꾼 spec 이 없으면 로컬 e2e 없음.
- 어드민 화면이라 .changeset 없음.

## 파일 계획
- apps/admin/src/features/geo/report/geo-report.tsx
- .agents/specs/0378-geo-layout/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- 없음. geo-grid 에 adm-col 을 더함(옮긴 패널 사이 간격 20px · 같은 파일).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 1440 · 1024 · 375 폭에서 둘째 줄 높이 차이 · 순서 확인
- [ ] develop 머지 뒤 develop → admin fast-forward
- [ ] 그다음 develop → main 반영 PR (운영 반영 2026-11-26)

## 허점
- 어드민 미리보기를 팀이 열 수 없어(토큰 · 다른 브랜치 빌드 끔) 운영 자료 높이로 빈 공간이 줄었는지는 재지 못함. 순서 · 간격 20px · 가로 넘침 0 은 로컬 빌드 + 가짜 자료로 1440 · 1024 · 375 확인.

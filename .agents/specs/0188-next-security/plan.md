# 계획

## 무엇을 · 왜
- next 16.4.3 → 16.4.6, eslint-config-next 16.4.3 → 16.4.6 (#205)
- 이유: npm audit moderate — GHSA-mfr8-8qww-v76h (16.3.0 ~ 16.4.4, `use cache` 함수를 unstable_cache() 로 부를 때 root params 정보 노출)
- 이 사이트 코드에는 `use cache` · `unstable_cache` 가 없어 실제 영향은 없음 — 그래도 점검 경고를 없애고 패치 버전을 따라감

## 애매한 곳
- 16.4.5 가 아니라 16.4.6 (가정: 같은 16.4 의 최신 패치 · 고친 버전 이상)

## 파일 계획
- apps/web/package.json
- package-lock.json
- .agents/specs/0188-next-security/**

## 계획 밖 변경 이유
- package-lock.json 은 보호 파일 — PR 에 사람이 harness-approved 라벨을 달아야 게이트가 통과함

## 완료 기준
- [x] bash .agents/checks.sh PASS (보호 파일 package-lock.json 은 harness-approved 라벨로 승인 — 로컬에서는 이 항목만 FAIL)
- [x] npm audit 에 next 항목이 없음 (found 0 vulnerabilities)
- [x] 빌드 · e2e 통과 (프레임워크 버전이 바뀌므로 Quick 이어도 e2e 까지) — LOOP=full 로 build PASS · e2e 233 passed

## 허점
- 매일 보안 점검 이슈(#205)에 "앱 예약이 이 이슈를 보고 고칩니다"라고 적혀 있지만, 그 뒤 고치는 PR 이 나오지 않았음 — 고치는 쪽 예약이 도는지 따로 확인 필요
- 플랜 파일 계획 줄에 괄호 설명을 붙이면 범위 검사가 경로로 인식하지 못함 — 경로만 적음

# 계획

## 무엇을 · 왜
- 보안 점검을 Claude 없이 GitHub Actions 로 — 매일 npm audit · 고칠 것이 있으면 이슈로 알림 · 없어지면 이슈를 닫음
- 앱 예약(저장소 밖 설정)은 그 이슈만 확인: 없으면 바로 끝 · 있으면 고쳐서 머지 → 사용량을 고칠 게 있는 날만 씀
- 작업실 안내 글을 실제와 맞춤 (버그 점검은 빠짐)

## 애매한 곳
- 고칠 기준: 서비스 의존성은 전부 · 개발 도구는 높음 이상 (이전 패치 기준 그대로) (가정)
- 점검 시각 한국 05:30 — GitHub 예약이 늦을 수 있어 앱 예약(07:05)보다 넉넉히 앞 (가정)
- 앱이 계속 켜져 있으면 07:05, 꺼져 있었으면 다음에 켤 때 돎 — 켤 때마다 도는 것은 아님 (앱 예약 동작)

## 파일 계획
- .github/workflows/security-audit.yml (보호 파일 · harness-approved)
- .agents/scripts/audit-report.mjs · harness.test.mjs (보호 파일)
- apps/web/src/features/log/patch-log.tsx
- docs/domain/build-log.md · README.md
- .agents/specs/0118-security-audit/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 머지 뒤 security-audit 를 실제로 돌려 통과

## 허점
-

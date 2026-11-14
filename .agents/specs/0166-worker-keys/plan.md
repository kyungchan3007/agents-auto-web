# 계획

## 무엇을 · 왜
- 사용자가 GitHub Secrets 에 넣은 `KCS_KEY` · `KOSIS_KEY` · `ECOS_KEY` 를 API 배포(`deploy-api.yml`) 때 Worker secret 으로 넣는다. 수집(관세청 · KOSIS · ECOS)은 Worker 크론에서 돌기 때문이다.
- 처음에는 작업 0163 PR(#178)에 넣었으나, 사용자 지시로 별도 작업 · PR 로 옮겼다.

## 설계
- job env 에 세 키를 secrets 에서 받는다.
- `wrangler deploy` 뒤 키마다: 값이 있으면 `printf '%s' "$값" | npx wrangler secret put 이름` (매번 덮어씀 — 사용자가 방금 발급 · 교체도 반영), 없으면 건너뜀. 값은 로그에 나오지 않게 하고 요약에는 "넣음/없음"만.
- **변경 감지에 `.github/workflows/deploy-api.yml` 경로를 더한다.** 지금은 `apps/api` · `packages/shared` · `package-lock.json` 이 바뀐 머지만 배포하므로, 이 PR 만 머지하면 키 단계가 돌지 않는다. 경로를 더하면 이 PR 머지 때 배포가 돌고 키가 들어간다.

## 애매한 곳
- 키가 이미 있어도 덮어씀 (확인됨: 요청 원문 "새 값으로 덮어써도 됩니다")
- 워크플로 파일이 바뀐 머지도 API 를 배포함 (가정 · 배포 방식이 바뀐 것이므로 배포해 확인하는 게 맞음 · 예약 직전 대기 단계는 그대로 적용)

## 담당
- builder: 워크플로 수정 (보호 파일 · 이 작업에 한해 lead 허용 · PR 에 사람 승인 필요 표시)

## 파일 계획
- .agents/specs/0166-worker-keys/**
- .github/workflows/deploy-api.yml

## 계획 밖 변경 이유

## 완료 기준
- [ ] 세 키가 값이 있을 때만 Worker secret 으로 들어가고 값은 로그에 나오지 않는다
- [ ] 이 PR 만 머지해도 배포 · 키 단계가 돈다
- [ ] bash .agents/checks.sh — 보호 파일 검사 외 PASS (보호 파일은 사람 승인 대기)

## 허점
- 처음에 사용자에게 묻지 않고 0163 PR 에 넣었다가 별도 PR 로 옮겼다. 보호 파일이 걸린 일은 따로 내는 게 승인하기 쉽다.

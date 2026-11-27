# 계획

## 무엇을 · 왜
- 빌드 때 API 를 못 읽거나 값이 비면 "아직 받지 못했습니다" 화면이 그대로 운영에 나감 → 빌드 끝에 데이터 검사, 깨졌으면 빌드를 실패로 끝내 Workers Builds 가 배포하지 않게(어제 정상 화면 유지).
- 1) 데이터 검사(`apps/web/scripts/check-build-data.*` · apps/web package.json 의 build 끝에 연결 · turbo.json 은 보호 파일이라 건드리지 않음):
  - 기준은 **빌드가 실제로 받은 값**(빌드 응답 캐시 또는 만들어진 out/ HTML) — 검사 때 새로 받아 덮어 보지 않음.
  - 실패 조건(최소): 오늘 환율(fx latest) 받기 실패 · 통화 0개 · 빌드가 받은 기준일이 검사 시점 API /fx/latest 기준일보다 오래됨(주말 · 공휴일은 API 가 준 날짜끼리 비교하므로 직전 영업일이면 통과 · 날짜를 지어내지 않음). 첫 페이지의 신호 · 항공료 지수는 받기 실패면 경고만(sdd 판단: 환율이 사이트 핵심 · 지수는 월 단위라 하루 늦어도 화면이 깨지지 않음).
  - 실패면 이유 한 줄 출력 · 0 이 아닌 코드. 운영 빌드(Workers Builds 브랜치 환경 변수가 main)에서만 막고, 그 밖(브랜치 미리보기 · 로컬 · CI gate)에서는 경고만.
  - 판정은 순수 함수(lib)로 떼어 단위 테스트.
- 2) 실패 알림: 검사 출력이 Workers Builds 빌드 기록에 남음. 더 나아가 rebuild-site 워크플로가 배포 결과를 확인해 Actions 요약 · 이슈 댓글로 알리는 것은 `.github/workflows/**` 보호 파일이라 이번에 만들지 않음 → docs 에 초안 · Cloudflare 빌드 실패 알림(대시보드 Notifications · 무료) 설정 방법을 적고 사람이 승인 · 설정.
- 3) 다시 시도: 이미 있음 — API 가 오늘 환율을 새로 저장하면 사이트 다시 빌드 후크를 부름(평일 12:00 예약 · ensure-fx 보충 10·40분 03~08 UTC). 검사로 막힌 날도 보충 수집이 값을 채우는 순간 다시 빌드됨. 추가 예약(05:30 UTC rebuild)은 워크플로 보호 파일이라 초안만.
- 하지 않음: 수집 · 빌드 때 점검 화면 · 받지 못한 숫자 지어내기.

## 파일 계획
- builder: apps/web/scripts/check-build-data.* · (판정 lib 위치는 builder 판단 · apps/web/scripts 안) · apps/web/package.json(build 끝에 검사) · docs/data-health.md(막힌 날 확인 · 알림 설정 · 워크플로 초안)
- test: 판정 lib 단위 테스트(정상 · 환율 받기 실패 · 통화 0개 · 기준일 오래됨 · 주말 직전 영업일 통과 · 미리보기는 경고만)
- .agents/specs/0388-build-guard/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- 빌드 시작 때 apps/web/.next/cache/fetch-cache 지우기(새 스크립트 · build 앞): test 확인 결과 next build 가 fetch-cache 의 옛 응답(revalidate 1년)을 다시 써서 사이트가 어제 환율로 만들어짐(로컬 재현 · 캐시 지우면 오늘 값). Workers Builds 가 .next/cache 를 되살리면 운영도 낡은 값으로 빌드되고 이 검사가 매일 막음 → 늘 새로 받게 함. D1 은 API 응답 캐시가 막아 줌.

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate) · CI gate 의 빌드가 검사 때문에 막히지 않음(경고만)
- [ ] develop 머지까지 · 운영 Worker 건드리지 않음 · 릴리스 없음

## 허점

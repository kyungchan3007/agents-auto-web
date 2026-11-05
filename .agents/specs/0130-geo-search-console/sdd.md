# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- `.github/workflows/gsc-sync.yml` (매일 한국 04:20 · 손으로) → `apps/api/scripts/gsc-sync.ts` → `.tmp/gsc.sql` → `wrangler d1 execute` (sync-tasks 와 같은 방식)
- 인증: 서비스 계정 JSON 으로 RS256 JWT → OAuth 토큰 · 범위 `webmasters.readonly` · 토큰 주소는 코드에 고정
- 조회: 지난 28일 날짜별 · 검색어 상위 · 페이지 상위 ([Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query))
- 저장: `gsc_daily` · `gsc_top` · `gsc_sync` (통째로 바꿈)
- 읽기: `GET /geo` 의 `search` 칸 (1시간 구간 캐시) · 화면 `features/geo`

## 대안 · 트레이드오프
- Worker 예약으로 가져오기: 비밀값을 Worker 에 또 넣어야 하고 예약이 놓친 적이 있음 → Actions
- 날짜별 그래프: 수치가 쌓인 뒤 판단 · 지금은 합계와 표

## 파일 계획
- .github/workflows/gsc-sync.yml (보호 파일)
- apps/api/** (schema · 마이그레이션 보호 파일)
- packages/shared/src/geo.ts
- apps/web/src/features/geo/**
- README.md · docs/**
- .agents/specs/0130-geo-search-console/**

## 계획 밖 변경 이유

## 위험
- 권한 반영 지연 · 자료 없음: 작업은 빈 값으로 성공 · 화면은 "자료 없음"
- 표 추가 전 조회: deploy-api 뒤에 실행 · API 는 표가 없으면 search 를 null 로

## 검증 계획
- 단위 테스트 · 게이트 Full · 머지 뒤 workflow_dispatch 실행 · /geo 확인

## 계획과 달라진 점
<!-- 구현하며 바뀐 결정과 이유 (끝나고 채움) -->

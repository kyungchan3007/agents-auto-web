# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
| 옮기는 것 | 위치 |
| --- | --- |
| 한국 시각 (`kstDate` · `kstNow`) | `@hav/shared/date` |
| 환율 신선도 판단 | `@hav/shared/freshness` |
| 국기 · 날짜 · 신선도 안내 · 1년 그래프 · 3D 로더 | `@hav/ui/*` |
| 주소 값 · 신선도 훅 | `@hav/ui/hooks/*` |
| 지역 단추 · 단위 입력 칸 · 자료 없음 칸 · 꼬리말 · 글 링크 · 제목 · 숫자 칸 | `@hav/ui/*` |
| 신호 색 | `@hav/ui/signal-badge` |

의존 방향: `@hav/shared` ← `@hav/ui` ← `apps/*`. API 는 `@hav/ui` 를 쓰지 않음.

앱에 남기는 것(이 사이트 고유): `api` · `site` · `site-nav` · `sitemap-entries` · `outage*`

## 대안 · 트레이드오프
- `@hav/ui` 가 `@hav/shared` 를 모르게 유지: 국기 · 신선도 안내를 앱에 둬야 해 요청과 어긋남 → 한 방향 의존을 허용
- 문구가 든 부품을 별도 패키지로: 앱 하나에 패키지만 늘어남 → 만들지 않음
- 카드 배경(`rounded-card bg-surface-2`): 쓰임마다 안쪽 구성이 달라 부품이 옵션 묶음이 됨 → 승격하지 않음

## 파일 계획
- packages/shared/**
- packages/ui/**
- apps/web/src/**
- apps/web/e2e/**
- apps/api/src/**
- package-lock.json (보호 파일 · harness-approved)
- docs/architecture.md
- .agents/specs/0126-monorepo-promote/**

## 계획 밖 변경 이유

## 위험
- 패키지 경로 변경으로 빌드 실패 → 게이트 build
- `@hav/ui` 안의 클래스가 CSS 에서 빠짐 → globals.css `@source` 가 이미 포함

## 검증 계획
- 게이트 Full · 반응형 점검 · 운영 확인

## 계획과 달라진 점
<!-- 구현하며 바뀐 결정과 이유 (끝나고 채움) -->

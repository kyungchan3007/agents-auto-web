# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
| 새 위치 | 대체한 곳 |
| --- | --- |
| `@hav/shared/format` numberText · signedPct · monthDayText · stripNumberText | 숫자 표기 · 변화율 3곳 · 월일 2곳 · 입력 정리 3곳 |
| `@hav/shared/date` isoDaysBefore · kstMonthDay | 환율 라우트 2곳 + 기간 자르기 · 작업 · 패치 2곳 · 직접 쓴 한국 날짜 계산 |
| `@hav/shared/fetched` Fetched · fetchJson · pickLive | `apps/web` 받기 로직 (주소 · 경로는 앱에 남김) |
| `@hav/ui/hooks/use-live` · `use-visible-interval` · `use-browser-value` | 상태 · 작업 · GEO · 실시간 기록 훅 · 신선도 · 주소값 |
| `@hav/ui/data-table` · `page-section` · `panel` · `link-row` · `heading` SubTitle · `field` FieldLabel | 표 3종 · 페이지 머리 4곳 · 패널 2곳 · 링크 줄 2곳 · 구역 제목 · 입력 이름표 4곳 |

## 대안 · 트레이드오프
- 새 패키지 분리: 공통 코드가 적고 의존 방향(shared ← ui ← apps)이 이미 있어 고르지 않았습니다.
- 값 줄(calc-result · status-board Row): 모양이 달라 옵션이 늘어나므로 합치지 않았습니다.
- 수집 출처 3곳의 fetch: 오류 종류와 응답 처리가 달라 합치지 않았습니다.

## 파일 계획
- packages/shared/**
- packages/ui/src/**
- apps/web/src/**
- apps/api/src/features/fx/routes.ts
- apps/api/src/features/fx/ensure.ts
- apps/api/src/features/status/status.ts
- docs/architecture.md
- .agents/specs/0136-package-common/**

## 계획 밖 변경 이유

## 위험
- 표 머리글이 전부 줄바꿈 없음으로 통일되고 마지막 칸 오른쪽 여백이 0 이 됩니다 (표 3종의 차이를 없앰).
- 훅의 `base` 인자를 없앴습니다. 쓰는 곳이 없었습니다.

## 검증 계획
- 전체 게이트(Full) · 로컬 화면에서 표 · 페이지 머리 · 받기 요청 확인

## 계획과 달라진 점

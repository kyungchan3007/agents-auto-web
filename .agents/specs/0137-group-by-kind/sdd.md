# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
| 위치 | 묶음 |
| --- | --- |
| `apps/web/src/features/<기능>/` | `components/` 화면 · `hooks/` use-* · `lib/` 계산 |
| `packages/ui/src/components/` | `layout` · `text` · `form` · `data` · `feedback` · `motion` |
| `packages/ui/src/three/` | `characters` · `objects` · `scene` · `lib` |
| `packages/ui/src/lib/` | chart · contrast (공개 이름 유지) |
| `packages/shared/src/` | `contracts` 스키마 · `domain` 업무 규칙 · `utils` 공통 도구 (공개 이름 유지) |
| `apps/api/src/features/fx/` | `sources/` 외부 출처 · `collect/` 수집 |

- `@hav/ui` 는 import 경로에 묶음 이름이 드러납니다 (`@hav/ui/text/heading`).

## 대안 · 트레이드오프
- `@hav/ui` 공개 이름 유지: 파일마다 exports 를 적어야 해 고르지 않았습니다.

## 파일 계획
- apps/web/src/**
- apps/web/e2e/**
- apps/api/src/features/fx/**
- apps/api/src/index.ts
- apps/api/src/index.test.ts
- packages/ui/**
- packages/shared/**
- docs/architecture.md
- docs/design.md
- .agents/specs/0137-group-by-kind/**

## 계획 밖 변경 이유

## 위험
- `.agents/scripts/activity.mjs` 주석의 옛 경로는 보호 파일이라 고치지 않았습니다. 동작에는 영향이 없습니다.

## 검증 계획
- 전체 게이트(Full) · 운영 배포 뒤 화면 확인

## 계획과 달라진 점

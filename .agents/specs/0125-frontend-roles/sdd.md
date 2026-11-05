# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
| 역할 | 위치 | 하는 일 |
| --- | --- | --- |
| 화면 | `*.tsx` | props 와 훅 결과로 그리기만 |
| 커스텀 훅 | `use-*.ts` | 상태 · 효과 · 이벤트 · 브라우저 API |
| 순수 로직 | `*.ts` | 계산 · 가공 · 문구 (React 없음 · 테스트) |
| 라우트 | `app/**/page.tsx` | 데이터 받아 조립 |
| 공용 | `shared/` · `packages/*` | 두 기능 이상이 쓰는 것 |

- `role-boundary.test.ts` 로 강제: `.tsx` 의 React 상태 훅 · motion 훅 · next/navigation 직접 사용 금지 · 기능 폴더끼리 import 금지
- 슬라이스 안에서 나눔 (architecture.md VSA): 공용 service 계층을 새로 만들지 않음

## 대안 · 트레이드오프
- eslint `no-restricted-imports`: `../*` 패턴이 `../../shared` 까지 막혀 정확히 표현하기 어려움 → 기존 client-boundary 테스트와 같은 방식
- 기능별 PR 분리: 검토는 쉽지만 머지마다 Pages 빌드로 D1 을 읽음 → PR 하나

## 파일 계획
- apps/web/src/features/**
- apps/web/src/shared/**
- apps/web/src/app/about/page.tsx
- docs/architecture.md
- apps/web/e2e/features.spec.ts
- .agents/specs/0125-frontend-roles/**

## 계획 밖 변경 이유

## 위험
- 훅으로 옮기며 서버 그림과 브라우저 그림이 달라지는 것 (하이드레이션) → e2e 가 오류를 검사
- 서버 파일이 "use client" 값 사용 → client-boundary 테스트

## 검증 계획
- 게이트 Full · 반응형 점검 · 운영 배포 뒤 e2e 항목 눈으로 확인

## 계획과 달라진 점
- e2e 탭 제목 기대값 수정 — #118 에서 제목을 바꿨는데 Quick 루프라 e2e 가 돌지 않아 남아 있었음 (이번 리팩터링과 무관)
- 면세 한도 숫자가 화면에 있던 것을 rules 값으로 교체 (값은 같음)

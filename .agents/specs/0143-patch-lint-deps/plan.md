# 계획

## 무엇을 · 왜
- 보안 점검 이슈 #143: `npm audit` moderate 12개. 원인은 두 가지다
  - `@typescript-eslint/typescript-estree@8.72.1` 이 쓰는 `minimatch@10.2.6` (서비스 거부 취약점 · 11.0.1 에서 고쳐짐)
  - `drizzle-kit` → `@esbuild-kit/core-utils` 가 쓰는 `esbuild@0.18.20` (개발 서버 요청 취약점 · 0.25 에서 고쳐짐)
- `npm audit fix` 가 제안하는 방법은 `eslint-config-next` · `drizzle-kit` 을 낮은 메이저로 내리는 것이라 쓰지 않는다
- 루트 `package.json` 의 `overrides` 로 그 두 곳만 고쳐진 버전으로 덮어쓴다 (`minimatch ^11.0.1` · `esbuild ^0.25.4`). `esbuild ^0.25.4` 는 drizzle-kit 이 자기 자신에게 쓰는 범위와 같다

## 애매한 곳
- 바꾸는 패키지가 모두 개발 도구(린트 · 마이그레이션 생성)라 사이트 · API 동작에는 영향이 없다 (확인됨: `npm ls`)
- package-lock.json 은 보호 파일 → 사람 승인(`harness-approved`) 필요

## 파일 계획
- package.json
- package-lock.json
- .agents/specs/0143-patch-lint-deps/**

## 계획 밖 변경 이유

## 완료 기준
- [x] `npm audit` found 0 vulnerabilities
- [x] `npm ls` 에서 invalid 없음 · 린트 통과 · `drizzle-kit generate` 정상 ("No schema changes")
- [ ] bash .agents/checks.sh PASS (보호 파일 승인 뒤)

## 허점
- 잠금 파일 항목을 손으로 지우는 방법은 필요한 패키지까지 빠지게 했다 (`typescript-estree` 가 설치되지 않음). overrides 뒤에는 `npm update <패키지>` 로 다시 맞춰야 한다
- 앱 예약 작업(tripfx-daily-patch)은 `npm audit fix` 만 시도해서, 이 방법을 찾지 못하고 "메이저 업그레이드 필요"로 보고했다

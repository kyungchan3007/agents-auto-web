# 계획

## 무엇을 · 왜
- 운영 사이트(`@hav/web`)의 기능 · 디자인이 바뀔 때만 버전을 올리고, main 에 올라가면 GitHub 릴리스로 남긴다. 어드민 · 자료(geo · 알리기) · 평일 다시 빌드로는 버전이 오르지 않는다.
- 방식: Changesets(변경 기록 파일이 있을 때만 버전이 오름) + GitHub 릴리스(`web-v<버전>` 태그 · 글은 CHANGELOG 의 그 버전 칸)
- 처음 버전은 운영 1.0.0 (지금 운영 화면 기준)

## 애매한 곳
- 태그 이름 → (가정) `web-v1.0.0` 꼴 · 나중에 어드민도 버전을 매기면 `admin-v…` 로 같은 규칙
- 버전 올리는 때 → (가정) 하루 마무리 PR 을 열기 전 develop 에서 `npm run release:version` — 기본 흐름인 "Version Packages PR 자동 생성"은 develop → main fast-forward 흐름과 겹쳐 쓰지 않음
- 게이트 → (가정) 운영 화면 코드가 바뀌었는데 변경 기록이 없으면 경고만(막지 않음) — 화면이 안 바뀌는 리팩터링도 있어서

## 파일 계획
<!-- 보호 파일: package-lock.json(@changesets/cli 설치) · .github/workflows/release-web.yml(태그 · 릴리스) · .agents/checks.sh · .agents/scripts/**(게이트 경고 · 검사) -->
- .agents/specs/0313-changesets/**
- .agents/orchestration/TASKS.md
- .agents/orchestration/team.md
- .changeset/**
- package.json
- package-lock.json
- apps/web/package.json
- apps/web/CHANGELOG.md
- scripts/changelog-ko.mjs
- scripts/release-notes.mjs
- .github/workflows/release-web.yml
- .agents/scripts/changeset-check.mjs
- .agents/scripts/harness.test.mjs
- .agents/checks.sh
- README.md

## 계획 밖 변경 이유
- Quick 기준(파일 10개)을 넘음: 버전 관리는 설정 · 명령 · 워크플로 · 게이트 · 문서가 한 묶음이라 나누면 반쯤 동작하는 상태가 생김 — 화면 코드는 바꾸지 않아 Quick 으로 둠

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 시험용 변경 기록으로 `changeset version` 을 돌리면 운영만 오르고 어드민 · 패키지는 그대로 (로컬 확인 · 되돌림)
- [ ] main 에 올라가면 `web-v1.0.0` 릴리스가 생김

## 허점
- Changesets 3판은 대화형 `init` 이 비대화형 셸에서 멈춤 — 설정 파일을 손으로 씀
- `changeset version` 이 쓰는 제목이 영어("Minor Changes") — `scripts/changelog-ko.mjs` 로 바꿈

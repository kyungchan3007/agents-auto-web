# 변경 기록 (Changesets · 작업 0313)

운영 사이트(`@hav/web`)의 버전만 이 폴더로 관리한다. 어드민(`@hav/admin`) · API(`@hav/api`)는 버전 관리 대상이 아니다(`config.json` 의 `ignore`).

## 언제 쓰나
- 운영 화면의 기능이나 디자인이 바뀌는 PR — `apps/web/src` · `packages/ui` · `packages/shared` 를 바꿔 운영 화면이 달라질 때
- 쓰지 않는 PR: 자료(geo 측정 · 알리기 초안) · 문서 · 어드민 · 테스트만 바뀌는 PR · 평일 다시 빌드

## 쓰는 법
```bash
npx changeset          # 대화형 — @hav/web 고르고 patch / minor 고르고 한 줄 설명
```
또는 이 폴더에 파일을 직접 만든다 (이름은 아무거나 · 예: `0313-price-route.md`):
```md
---
"@hav/web": minor
---

여행 물가 노선에 다른 나라 보기 단추를 더함
```
- minor: 기능이 생기거나 바뀜 · patch: 디자인 수정 · 버그 수정 · major: 크게 갈아엎음
- 설명은 방문자가 읽어도 알 수 있게 한국어 한 줄 (내부 용어 · 작업 번호 없이)

## 버전 올리기 → 릴리스 (하루 마무리 때)
1. develop 에서 `npm run version` — 쌓인 파일을 모아 `apps/web/package.json` 버전을 올리고 `apps/web/CHANGELOG.md` 를 씀 · 파일은 지워짐
2. 그 커밋을 develop 에 올린 뒤 main 으로 fast-forward
3. main 에 올라가면 `.github/workflows/release-web.yml` 이 `web-v<버전>` 태그와 GitHub 릴리스를 만듦 (글은 CHANGELOG 의 그 버전 칸)

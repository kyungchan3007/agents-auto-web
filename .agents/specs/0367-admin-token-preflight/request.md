# 요청 원문

<!-- 사용자·이슈의 요청을 그대로 붙여 넣는다. 요약·정리하지 않는다. -->

(claude-desktop: "회사 링크를 만들기 전에 이 상태를 확인하고 운영 버전으로 맞춰 주는 단계를 admin:token 명령에 넣으면 … lead 에게 이 작업을 넘기겠습니다") "응 그거 리드한테 넘기구"

## 함께 온 작업서 (claude-desktop → dev-lead@hav · 2026-11-25 · qitem-20261125144653-c7823cd052be6d4e)

## 배경
- develop · task 브랜치에 커밋이 올라올 때마다 Workers Builds 가 flapfx-admin 에 미리보기 버전을 올립니다. 그러면 `wrangler secret put ADMIN_TOKENS` 가 "latest version isn't deployed" 로 실패합니다(11-23 · 11-25 두 번).
- 0329 에서 한국어 안내 · `--versions` 는 넣었지만, 사용자가 매번 버전 배포 명령을 따로 쳐야 합니다.

## 만들 것
- `admin:token add | remove | init` 이 비밀값을 넣기 전에 어드민(필요하면 API) Worker 의 최신 버전과 운영 배포 버전이 같은지 확인.
- 다르면: 최신 버전의 어드민 코드가 운영과 같은지 판단할 방법을 정하고(예: 운영 배포 버전에 비밀값을 넣는 다른 경로, 또는 `wrangler versions secret put` 뒤 그 새 버전만 배포 등), 사용자가 한 번의 명령으로 끝나게 함. 운영 코드가 바뀌는 배포는 하지 않음(코드가 다르면 멈추고 한국어로 안내).
- 비밀값 · 토큰 값은 출력 · 파일 · 로그에 남기지 않음(지금처럼 링크만 한 번 출력).
- 주의: 버전마다 비밀값 묶음이 따로 있습니다. 오래된 버전을 배포하면 최근에 넣은 ADMIN_TOKENS 가 되돌아갈 수 있으니, 배포할 버전이 최신 비밀값을 가진 것인지 꼭 확인.

## 진행
- Quick Loop(scripts/admin-token.mjs · scripts/admin-token-lib.ts · 단위 테스트 · docs 사용법). 보호 파일 필요 없음(필요해지면 만들지 말고 알림).
- 실제 Cloudflare 에 대고 돌려 보지 않음(사용자 비밀값 · 운영). 단위 테스트로 판정 · 인자만 확인.
- gate 통과 → 바로 --rebase 머지 → 어드민 쪽이라 main fast-forward(목록 확인).
- 긴 줄표 "—" 쓰지 않음.


# 사이트 점검 화면

사고가 났을 때 명령 하나로 운영 사이트(flapfx.com · www)에 "잠시 점검 중입니다" 화면(503)을 띄웁니다. 사이트 빌드 · 데이터 · D1 · API 와 따로 서 있어서 사이트가 어떻게 깨져도 뜹니다.

## 언제 켜나
- 사이트가 깨진 화면이나 오류를 내보내고 있고, 고치는 동안 방문자에게 보이고 싶지 않을 때.
- 데이터가 잘못 나가고 있어 잠시 막아야 할 때.

## 켜기
```bash
npm run maintenance:on
```
- 대상은 기본 운영 Worker(`agents-auto-web`)입니다. 운영이면 "운영 Worker 에 점검 화면을 켭니다" 확인을 묻고, `네` 를 입력해야 진행합니다. 사고 때 빠르게 하려면 `npm run maintenance:on -- --yes`.
- 켜기 전에 지금 배포된 버전 ID 를 화면에 찍고 `.tmp/maintenance-prev.txt` 에 남깁니다. 끄기가 이 ID 로 되돌립니다.
- 이미 켠 기록이 있으면 멈춥니다. 기록이 낡았으면 `-- --force`.
- 다른 이름의 Worker 에 시험하려면 `npm run maintenance:on -- --name flapfx-maint-test` (또는 환경 변수 `MAINTENANCE_WORKER`).
- 도메인 연결(routes)은 건드리지 않아 붙은 도메인은 그대로입니다. 사이트 `wrangler.jsonc` 도 쓰지 않습니다. 설정 없이 `wrangler deploy` 인자(`--name` · `--compatibility-date`)만으로 올립니다.

## 끄기
```bash
npm run maintenance:off
```
- 켤 때 남긴 버전 ID 로 `wrangler rollback` 합니다. 남긴 ID 가 없으면 "바로 전 배포로 되돌립니다" 하고 확인을 묻습니다.
- 켠 대상과 다른 이름이면 멈춥니다. `-- --name <이름>` 으로 맞추세요.

## 확인
```bash
curl -I https://flapfx.com/
curl -I https://flapfx.com/robots.txt
```
- 켜져 있으면 둘 다 `503` · `Retry-After: 3600` · `Cache-Control: no-store`.
- 끈 뒤에는 `200`.

## 주의
- 켜 둔 동안 `main` 에 푸시하면 Workers Builds 가 정상 사이트를 다시 배포해 점검 화면이 내려갑니다. 사이트 데이터 다시 만들기(평일 예약)도 같습니다. 켜 둘 동안에는 `main` 푸시를 멈추세요.
- 점검 화면이 올라가면 사이트의 정적 파일 · 서비스 연결(API · D1)이 그 버전에서 빠집니다. 끄면(rollback) 이전 버전 그대로 돌아옵니다.
- 켜고 끄는 명령은 사람이 맥에서 실행합니다. wrangler 로그인이 되어 있어야 하고, 이 저장소에는 토큰 · 비밀값을 쓰지 않습니다.

## 휴대폰에서 켜기 (초안 · 사람 승인 뒤 따로)
`.github/workflows/**` 는 보호 파일이라 이번에 만들지 않았습니다. 필요하면 사람이 승인한 뒤 아래 초안으로 만듭니다.

필요한 것:
- Cloudflare API 토큰을 GitHub Secret(`CLOUDFLARE_API_TOKEN`)으로. 권한은 해당 계정의 Workers 편집(Workers Scripts: Edit).
- 계정 ID Secret(`CLOUDFLARE_ACCOUNT_ID`).

```yaml
name: maintenance
on:
  workflow_dispatch:
    inputs:
      mode:
        description: on(점검 켜기) 또는 off(끄기)
        type: choice
        options: [on, off]
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: node apps/web/maintenance/maintenance.mjs ${{ inputs.mode }} --yes
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```
- 주의: 실행 서버의 `.tmp/maintenance-prev.txt` 는 실행이 끝나면 사라져 끄기가 ID 를 모릅니다. 휴대폰용은 끄기 단계에서 `wrangler deployments list` 로 점검 직전 버전을 고르도록 따로 손봐야 합니다.

## 파일
- `apps/web/maintenance/index.html` — 점검 화면(외부 파일 없음)
- `apps/web/maintenance/worker.ts` — 모든 경로에 점검 응답
- `apps/web/maintenance/respond.ts` — 응답 만드는 순수 함수
- `apps/web/maintenance/maintenance.mjs` · `maintenance-lib.ts` — 켜기 · 끄기

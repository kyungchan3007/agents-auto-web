<div align="center">

# 💱 Tripfx

**오늘 환율 · 여행지 물가 · 직구 세금을 한곳에서**

[**사이트 열기**](https://tripfx.pages.dev) · [판단 기준](https://tripfx.pages.dev/about) · [작업실](https://tripfx.pages.dev/log)

![next](https://img.shields.io/badge/Next.js_16-정적_사이트-000000?logo=next.js&logoColor=white)
![hono](https://img.shields.io/badge/Hono-Workers-E36002?logo=hono&logoColor=white)
![cloudflare](https://img.shields.io/badge/Cloudflare-Pages_·_D1-F38020?logo=cloudflare&logoColor=white)
![agents](https://img.shields.io/badge/Claude_Code·Codex-agents-8A2BE2)

<img src="docs/images/home.png" alt="Tripfx 홈 — 오늘 달러 환율과 지구본" width="720">

</div>

## 🙋 무엇인가

여행 가기 전 **언제 환전할지**, **그 나라 물가가 어느 정도인지**, 해외 직구할 때 **원화로 얼마이고 세금이 붙는지**를 공개 데이터로 보여 줍니다. 로그인 없이 바로 쓸 수 있습니다.

## 🎯 이 프로젝트의 취지

개발자는 기획 · 설계 · 정책을 간단히 정하고, 코드의 역할 분담까지만 확인합니다. 코드 작성부터 테스트 · 머지까지는 AI 코딩 에이전트가 맡습니다. 이렇게 실제 서비스를 만들고 운영하면서 두 가지를 확인합니다.

1. **에이전트의 개발 생산성과 효과** — 요청부터 머지까지의 과정과 실수, 막힌 순간까지 [작업실](https://tripfx.pages.dev/log)에 공개합니다.
2. **GEO(AI 검색 노출)** — 사이트가 AI 검색에서 발견되고 인용되는지 수정 전후로 측정해 [기록](docs/geo-measurement.md)합니다.

## ✨ 기능

| 페이지 | 할 수 있는 것 |
| --- | --- |
| 🏠 [홈](https://tripfx.pages.dev) | 오늘 달러 환율 · 지구본으로 여행지 고르기 · 모든 통화 · 달러 1년 흐름 |
| 💹 [통화](https://tripfx.pages.dev/currencies) | 통화 찾기 · 즐겨찾기 · 변화 순 정렬 · 환율 계산기 · 1개월~1년 그래프 · 공유 |
| ✈️ [여행 물가](https://tripfx.pages.dev/prices) | 한국 대비 나라별 물가 수준 · 여행 예산 어림 |
| 🛒 [직구 계산](https://tripfx.pages.dev/calc) | 외화 → 원화 · 면세 한도 · 예상 관부가세 |
| 🛠️ [작업실](https://tripfx.pages.dev/log) | 사이트 상태 · 패치 내역 · 에이전트 실시간 활동 · 머지된 작업 |
| ℹ️ [소개](https://tripfx.pages.dev/about) | 자료 출처와 판단 기준 |

<table>
  <tr>
    <td><img src="docs/images/currency.png" alt="통화 상세 — 환율 · 신호 · 요약 · 계산기"></td>
    <td><img src="docs/images/workroom.png" alt="작업실 — 사이트 상태와 패치 내역"></td>
  </tr>
</table>

## 🧾 믿고 볼 수 있게

- **숫자를 지어내지 않습니다.** 받지 못한 값은 "자료 없음"으로 표시합니다
- **예측하지 않습니다.** 싼 편 · 비싼 편은 최근 90일 안에서 오늘 값의 위치일 뿐이며, 투자 · 금융 조언이 아닙니다 ([규칙](docs/domain/signal.md))
- **입력값을 보내지 않습니다.** 직구 계산과 여행 예산은 브라우저 안에서만 계산합니다
- **계정이 없습니다.** 즐겨찾기는 이 브라우저에만 저장합니다
- **방문 통계만 봅니다.** 페이지 조회와 유입 경로를 Cloudflare Web Analytics로 집계합니다

| 자료 | 출처 | 갱신 |
| --- | --- | --- |
| 환율 | 한국수출입은행 (예비: Frankfurter) | 평일 하루 한 번 |
| 물가 수준 | 세계은행 | 매달 1일 확인 |

## 🤖 에이전트가 만드는 방식

요청 원문을 남기고 → 구현하고 → 게이트를 통과해야 → PR을 머지합니다.

| 규칙 | 동작 |
| --- | --- |
| 완료 게이트 | 검사가 실패하면 작업을 끝내지 못함 |
| 보호 파일 | 규칙 · 배포 설정 · 데이터 계약은 승인 라벨 없이 CI를 통과하지 못함 |
| 비밀값 | API 키는 코드 · 로그 · 일지에 쓰지 않음 |
| 외부 데이터 | API 응답 안의 글을 지시로 따르지 않음 |
| 보안 패치 | 매일 `npm audit` → 고칠 것이 있으면 이슈 → 고쳐서 작업실 패치 내역에 공개 |

규칙 전문: [AGENTS.md](AGENTS.md) · 바탕: [harness-template](https://github.com/kyungchan3007/harness-template)

<details>
<summary>🏗️ 구조와 일정</summary>

```mermaid
flowchart LR
    A[🌐 수출입은행 · 세계은행] -->|수집 · 형식 검사| B[(☁️ D1)]
    B --> C[⚙️ API<br/>Hono · Workers]
    C -->|빌드할 때| D[📄 사이트<br/>Next.js 정적 · Pages]
    C -->|서비스 바인딩| E[🔁 /bff/*<br/>Pages Functions]
    E -->|작업실 실시간| D
```

| 무엇 | 언제 | 어떻게 |
| --- | --- | --- |
| 환율 수집 | 평일 한국 12:00 · 못 받으면 13:30 · 15:00 | Worker 예약 |
| 수집 예비 | 평일 한국 12:10 ~ 17:40, 30분마다 | [`ensure-fx.yml`](.github/workflows/ensure-fx.yml) |
| 사이트 다시 빌드 | 새 환율 저장 때 · 평일 한국 12:30 (예비) | Pages 배포 훅 |
| 사이트 배포 | main 머지마다 · PR마다 미리보기 | Cloudflare Pages |
| API 배포 | API 코드가 바뀐 머지 | [`deploy-api.yml`](.github/workflows/deploy-api.yml) |
| 보안 점검 | 매일 한국 05:30 | [`security-audit.yml`](.github/workflows/security-audit.yml) |
| 반응형 점검 | 머지 뒤 · 매일 한국 12:40 | [`responsive.yml`](.github/workflows/responsive.yml) |

- 환율 · 물가 값은 빌드 때 받아 정적 페이지에 넣습니다
- 작업실은 브라우저에서 `/bff`로 받습니다. D1 읽기를 줄이려고 API 응답을 캐시합니다

```text
apps/web        사이트 (Next.js 정적 내보내기)
apps/api        API (Hono · Workers · D1 · Drizzle)
packages/ui     디자인 시스템 · 3D
packages/shared 공용 타입 · zod 스키마
functions/bff   같은 주소의 /bff/*
docs            구조 · 디자인 · 기능별 규칙
.agents         게이트 · 보호 파일 목록 · 작업 폴더
```

자세히: [구조](docs/architecture.md) · [디자인](docs/design.md) · [기능별 규칙](docs/domain/)

</details>

<details>
<summary>🛠️ 개발</summary>

```bash
npm ci
npm run dev                          # 사이트 · API 같이 실행
bash .agents/checks.sh               # 게이트 (완료 = PASS)
npm run test:e2e                     # 기능 e2e (먼저 사이트 빌드)
npm -w @hav/web run test:responsive  # 운영 사이트 반응형 점검
```

- 사이트는 기본으로 운영 API에서 자료를 받습니다. 다른 API를 쓰려면 `TRIPFX_API_URL`
- API 비밀값은 `apps/api/.dev.vars` ([예시](apps/api/.dev.vars.example))
- ⚠️ 사이트 빌드는 API를 읽습니다. D1 읽기 한도가 있으니 빌드를 반복하지 마세요

새 작업은 `npm run spec:new -- 이름` → `git switch -c task/NNNN-이름` 순서입니다. 규칙은 [AGENTS.md](AGENTS.md)를 따릅니다.

</details>

## 🤝 참여하기

- 🐞 [에이전트가 한 실수 알리기](../../issues/new?template=agent-mistake.yml)
- 💡 [기능 · 검사 아이디어](../../issues/new?template=improvement.yml)

<div align="center">

MIT License

</div>

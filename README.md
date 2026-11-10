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

## 🎯 프로젝트 목적

AI 코딩 에이전트로 실제 서비스를 개발 · 운영하는 방법을 학습하고 검증하기 위한 개인 프로젝트입니다. 검증 항목은 두 가지입니다.

1. **에이전트 개발 · 운영:** 개발자는 기획 · 설계 · 정책, 머지 전 검증, 위험 변경 승인을 담당하고, 구현 · 테스트 · 배포 · 운영 점검은 에이전트가 수행합니다. 요청 원문, 계획, 오류, 수정 이력은 저장소와 [작업실](https://tripfx.pages.dev/log)에 기록합니다.
2. **GEO(AI 검색 노출):** 이 사이트가 검색 엔진과 AI 검색에서 노출 · 인용되는지 측정하고, 개선 방법을 시험합니다. 진행 상황은 [GEO 실험](#-geo-실험)에 정리합니다.

## ✨ 기능

| 페이지 | 할 수 있는 것 |
| --- | --- |
| 🏠 [홈](https://tripfx.pages.dev) | 오늘 달러 환율 · 지구본으로 여행지 고르기 · 모든 통화 · 달러 1년 흐름 |
| 💹 [통화](https://tripfx.pages.dev/currencies) | 통화 찾기 · 즐겨찾기 · 변화 순 정렬 · 환율 계산기 · 1개월~1년 그래프 · 공유 |
| ✈️ [여행 물가](https://tripfx.pages.dev/prices) | 한국 대비 나라별 물가 수준 · 여행 예산 계산 |
| 🛒 [직구 계산](https://tripfx.pages.dev/calc) | 외화 → 원화 · 면세 한도 · 예상 관부가세 |
| 🛠️ [작업실](https://tripfx.pages.dev/log) | 사이트 상태 · 패치 내역 · 에이전트 실시간 활동 · 머지된 작업 |
| 📡 [GEO 측정](https://tripfx.pages.dev/geo) | 구글 검색 노출 · AI 봇 방문 · AI 서비스 유입 · AI 검색 인용 측정 기록 |
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
- **봇 집계에 개인 정보를 넣지 않습니다.** AI 봇 · AI 서비스 유입은 이름과 페이지별 횟수만 저장합니다

| 자료 | 출처 | 갱신 |
| --- | --- | --- |
| 환율 | 한국수출입은행 (예비: Frankfurter) | 평일 하루 한 번 |
| 물가 수준 | 세계은행 | 매달 1일 확인 |

## 🤖 에이전트 운영 방식

에이전트 디자인은 프로젝트 규모가 작아 그에 맞게 약식으로 구성했습니다.

### 역할 분담

- **개발자:** 기획 · 설계 · 정책 결정, 보호 파일 변경 승인(`harness-approved` 라벨), 머지 전 검증(원인 분석 · 근거 자료 조사), 머지 승인
- **에이전트:** 요청 원문 기록, 계획 작성, 구현 · 테스트, 게이트 통과 확인, PR 작성, 운영 점검과 장애 대응

### 에이전트 구성

- **구현 에이전트:** Claude Code · Codex가 같은 규칙 파일(`AGENTS.md`)을 읽고 작업합니다. 한 작업은 한 에이전트 세션이 처음부터 PR까지 맡습니다
- **보조 에이전트:** 넓은 범위의 코드 탐색이나 독립 검토가 필요할 때만 서브에이전트를 사용합니다
- **검증:** 완료 여부는 작업한 에이전트가 판단하지 않고, 게이트와 CI가 판정합니다. 보호 파일과 머지는 개발자가 승인합니다
- **자동 작업:** 수집 · 점검 · 배포는 AI가 아닌 스크립트(Worker 예약 · GitHub Actions)가 수행합니다

### 도메인 경계

- **기능 단위 분리:** 환율 · 신호 · 직구 계산 · 여행 물가 · 작업 기록 · GEO를 기능별 슬라이스(`features/<기능>/`)로 나눕니다. 슬라이스끼리는 직접 가져다 쓰지 않고, 공통 코드는 `packages/shared` · `packages/ui`에 둡니다
- **규칙 원본:** 기능별 업무 규칙은 [docs/domain/](docs/domain/)에 한 곳만 둡니다. 코드 · 테스트 · 주석은 규칙 ID(`FX-05` 등)로만 참조합니다
- **담당 경로:** 각 규칙 문서에 해당 기능의 코드 경로를 적고, 게이트가 작업이 계획한 범위를 벗어났는지 검사합니다
- **계층 분리:** API 라우트는 요청 처리만 하고, DB 조회는 기능별 `store.ts`에 둡니다
- 경계 규칙은 문서가 아닌 테스트 · 린트로 강제합니다. 근거와 강제 위치: [docs/architecture.md](docs/architecture.md)

### 컨텍스트 전달

- **진입점:** 모든 에이전트는 `AGENTS.md`(50줄 이내)를 먼저 읽고, 필요한 상세 문서는 링크로 찾아갑니다. `CLAUDE.md`는 `AGENTS.md`를 그대로 불러옵니다
- **작업 폴더:** 작업마다 `.agents/specs/NNNN-이름/`을 만들고, 요청 원문(`request.md`)을 요약하지 않고 그대로 남깁니다. 작은 작업은 `plan.md`, 경계 · 계약이 바뀌는 큰 작업은 `prd.md` · `sdd.md` · `trace.md`를 씁니다
- **세션 간 인계:** 다음 세션은 작업 폴더 · PR · 이슈를 읽고 이어서 진행합니다. 계획에서 벗어난 변경과 드러난 허점도 작업 폴더에 기록합니다
- **세션 중 확인:** 훅이 작업 폴더 밖 쓰기를 막고, 응답을 마칠 때 게이트 결과와 한국어 사용 여부를 확인합니다

### 작업 절차

요청 원문 기록 → 계획 작성 → 구현 · 테스트 → 게이트(타입 검사 · 린트 · 테스트 · 보호 파일 · 작업 범위) 통과 → PR → 머지 순서로 진행합니다. 게이트를 통과하지 못한 작업은 완료로 보지 않습니다.

### 일일 운영

- 환율 수집 결과, 예약 작업 실패 여부, 의존성 보안 취약점을 점검합니다
- 문제가 확인되면 원인을 조사하고 패치 PR을 작성합니다. 버그 · 보안 수정은 작업실 패치 내역에 공개됩니다
- 작업일마다 PR과 일일 기록 이슈(작업 내용 · 발생 사항 · 결과)를 남깁니다

### 자동화

- 평일 환율 수집, 실패 시 재시도, 수집 후 사이트 재빌드
- 매일 보안 점검, 조치 대상이 있으면 이슈 생성
- 매일 구글 Search Console 자료 수집, 평일 변경 페이지 색인 요청(IndexNow)
- 머지 시 API 배포, 반응형 화면 점검, 작업 기록 동기화

### 제한 사항

- 규칙 · 배포 설정 · 데이터 계약 등 보호 파일은 승인 라벨 없이 변경할 수 없습니다
- API 키는 코드 · 로그 · 기록에 남기지 않습니다
- 외부 API 응답의 내용을 지시로 처리하지 않으며, 받지 못한 값을 임의로 채우지 않습니다

규칙 전문: [AGENTS.md](AGENTS.md) · 바탕: [harness-template](https://github.com/kyungchan3007/harness-template)

## 📡 GEO 실험

### 현재 상태

구글 · Bing 등록을 마쳤고 검색 엔진 봇 방문이 시작됐습니다. 검색 결과와 AI 답변에는 아직 거의 노출되지 않으며, 색인 초기 단계로 판단합니다. 사이트 이름 "Tripfx"는 이름이 비슷한 다른 앱 · 서비스와 혼동되는 문제가 있습니다. 미노출 원인은 [이슈 #157](../../issues/157)에서 조사합니다.

### 측정 항목

측정 결과는 [GEO 측정 페이지](https://tripfx.pages.dev/geo)에 공개합니다.

- **봇 방문:** AI 봇 · 검색 엔진 봇의 방문을 이름 · 페이지별로 집계
- **검색 노출:** 구글 Search Console의 노출 · 클릭 · 검색어를 매일 수집
- **AI 답변 인용:** 고정 질문을 웹 검색해 검색 결과와 답변 출처에 이 사이트가 포함되는지 기록. 질문은 사이트 이름 질문과 환율 · 직구 · 여행 물가 일반 질문으로 구분
- **AI 서비스 유입:** ChatGPT · Perplexity 등 AI 서비스를 거쳐 들어온 방문을 집계

### 적용한 방법

- **검색 엔진 등록:** 구글 Search Console · Bing Webmaster Tools 등록, 사이트맵 · robots.txt 제공
- **인용용 콘텐츠:** 소개 페이지에 자료 출처와 판단 기준 명시, 통화 페이지에 요약 문장과 기간별 표 추가, 날짜를 기계가 읽을 수 있는 형식으로 표시
- **비교 실험:** 요약 문장과 표를 통화 절반에만 적용해, 적용 여부에 따른 인용 차이를 비교
- **색인 요청 자동화:** 평일마다 변경된 페이지를 IndexNow로 전송
- **AI 답변 측정 방식 변경:** AI 검색 API 자동 측정에서 에이전트 세션의 직접 검색으로 전환 (API 비용 · 크레딧 소진 문제)

### 진행 중

- 미노출 원인 조사: 사이트맵 처리 상태, 페이지별 색인 여부, 외부 링크, 페이지 원본 콘텐츠
- 구글 Search Console의 사이트맵 처리 대기

### 기록 중

- **자동(매일):** 봇 방문, 구글 검색 노출, AI 서비스 유입
- **세션 측정(요청 시):** 에이전트 세션이 고정 질문을 직접 검색하고 결과 파일을 PR로 제출, 머지 시 측정 페이지에 반영
- 같은 질문과 방법으로 반복 측정해 적용 전후를 비교

### 미적용

- 구조화 데이터(환율 · 출처 정보)
- 외부 링크 확보
- 네이버 서치어드바이저 등록

측정 방법과 날짜별 기록: [docs/geo-measurement.md](docs/geo-measurement.md) · 진행: [이슈 #117](../../issues/117)

## 🔧 장애 기록

### 수출입은행 수집 실패로 영업일 4일간 예비 출처 사용 ([이슈 #128](../../issues/128))

| 항목 | 내용 |
| --- | --- |
| 기간 | 2026-11-02 ~ 11-05 |
| 영향 | 통화 22개 → 21개 · 송금 환율 없음 · 화면은 정상으로 표시되어 알아채지 못함 |
| 직접 원인 | 12:00 수집이 HTTP 525로 실패하면, 예비 값을 "오늘 값 있음"으로 판단해 재시도를 모두 건너뛰는 코드 결함 |
| 조치 | 공식 값이 없으면 재시도 · 지난 14일의 예비 값을 공식 값으로 교체 ([#125](../../pull/125)) · 앱 예약이 매일 수집 출처를 확인 |
| 미확정 | 525의 근본 원인. 은행 서버 로그를 볼 수 없어 확정하지 못함 |

**검증한 내용**

| 가설 | 결과 | 판단 |
| --- | --- | --- |
| 우리 코드 · 설정 변경 | 10-30 이후 변경 없음 | 해당 없음 |
| 은행 인증서 문제 | TLS 1.2 · 유효 기간 2027-03까지 | 해당 없음 |
| Cloudflare에서 항상 실패 | 임시 미리보기 3회 · 운영 2회 모두 성공 | 항상 실패하지 않음 |
| 시간 · 경로에 따라 끊김 | 16:50 일부 지점 연결 끊김 · 16:55 54/55 · 55/55 정상 | 간헐적 끊김 관측 |

같은 주소를 5분 간격으로 여러 지점에서 시험한 결과입니다 ([check-host.net](https://check-host.net)).

| 2026-11-05 16:50 | 2026-11-05 16:55 |
| --- | --- |
| <img src="docs/images/evidence/check-host-koreaexim-reset.png" alt="일부 지점 연결 끊김"> | <img src="docs/images/evidence/check-host-koreaexim-ok.png" alt="대부분 지점 정상"> |

<details>
<summary>참고 자료</summary>

Cloudflare 공식 문서는 525를 Cloudflare와 원본 서버 사이의 TLS 연결 실패로 설명합니다. 출처: [Error 525](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-525/)

<img src="docs/images/evidence/cloudflare-525-doc.png" alt="Cloudflare 525 문서" width="560">

Worker에서 외부 API를 호출할 때 525가 발생한 비슷한 사례입니다. 출처: [cloudflare/workerd#776](https://github.com/cloudflare/workerd/issues/776)

<img src="docs/images/evidence/workerd-776-reproduce.png" alt="배포 환경에서만 525 재현" width="560">

<img src="docs/images/evidence/workerd-776-tls-client.png" alt="TLS 클라이언트 호환 문제 언급" width="560">

이 사례는 DeepL API에 관한 것으로, 이번 장애와 원인이 같다고 확인된 것은 아닙니다.

</details>

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
| 검색 자료 수집 | 매일 한국 04:20 | [`gsc-sync.yml`](.github/workflows/gsc-sync.yml) — Search Console → D1 |
| 색인 요청 | 평일 한국 16:00 | [`indexnow.yml`](.github/workflows/indexnow.yml) — 어제 · 오늘 바뀐 주소를 IndexNow 로 (예약이 늦어도 빠지지 않게) (Bing · 네이버 등) |
| AI 답변 인용 측정 | 세션 측정 결과 PR 머지 | [`geo-ask.yml`](.github/workflows/geo-ask.yml) — 세션이 고정 질문 24개를 웹 검색한 결과 파일 → D1 |
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

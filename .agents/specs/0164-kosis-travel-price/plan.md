# 계획

## 무엇을 · 왜
- 통계청 KOSIS 소비자물가지수 중 여행 품목 **국제항공료 · 해외단체여행비** 월별 지수를 받아 저장하고, /prices 화면에 보여 준다.
  - 작년 같은 달 대비(%) · 최근 몇 년 평균으로 "몇 월이 싼 편인지" 차트
  - 원/달러 환율(월평균, 기존 fx_rates)과 나란히 비교
- 여행 품목 영역에 **3D 비행기**(사용자 추가 요청)를 넣는다 — packages/ui 의 three/objects/plane.tsx (동전과 같은 방식 · 같은 라이브러리 · 코드 도형).
- 0163 이 만든 공용 시계열 테이블 `indicator_points` 위에 쌓는다 (보호 파일 변경 없음).

## 추가: 비행기를 3D 모델 파일로 (사용자 결정 2026-11-15)
- 코드 도형 대신 glTF 모델: "Airplane" by Poly by Google · CC-BY 4.0 · https://poly.pizza/m/8ciDd9k8wha · 236,520 바이트
- 파일은 `.tmp/model-trial/plane.glb` 를 `apps/web/public/models/plane.glb` 로 복사 (다시 내려받지 않음). 주소는 사이트가 넘기고 `packages/ui` 컴포넌트는 `url` prop 으로 받음 (지구 사진과 같은 방식)
- 불러오기: drei `useGLTF` (새 의존성 없음) · 크기 · 가운데 맞추기 · ACES 톤매핑 (참고: `.tmp/model-trial/tpl.html`)
- 조명: three 의 `RoomEnvironment` 환경 조명 + 사이트 오로라 점광(청록 · 보라 · 분홍). drei `Environment preset` 은 HDR 을 외부에서 받아 오므로 쓰지 않음 (가정)
- 움직임 줄이기 · 화면 밖이면 그리지 않기(Stage) · 늦게 불러오기(PlaneLazy) 유지 · `PLANE_PARTS` 삭제
- 출처 표시: 여행 물가 영역 출처 문단에 "3D 비행기: Airplane · Poly by Google (CC-BY 4.0)" + 원본 링크
- 고양이 · 동전은 그대로
- 밝은 화면에서 안 보임(사용자 피드백) → 오로라 색 옅은 원형 배경판 · drei ContactShadows 그림자 · 크기 키우기(모바일 제목 밀지 않게) · 밝은 테마에서 몸체를 옅은 회청색(파란 꼬리 유지) · 두 테마를 미리보기 배포 캡처로 확인

## 공식 명세 (확인: 2026-11-15, lead 조사)
- 출처: 통계자료 가이드 https://kosis.kr/openapi/devGuide/devGuide_0201List.do · 개발가이드 PDF https://kosis.kr/openapi/file/openApi_manual_v1.0.pdf · 통계표설명(메타) https://kosis.kr/openapi/devGuide/devGuide_060104List.do
- 요청(통계표선택 방식): `GET https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList`
  - `apiKey` · `orgId=101` · `tblId=DT_1J22001`(지출목적별 소비자물가지수(품목포함, 2020=100)) · `itmId=T` · `objL1=T10`(전국) · `objL2=G03302`(국제항공료) / `I06102`(해외단체여행비) · `prdSe=M` · `startPrdDe` · `endPrdDe`(YYYYMM) 또는 `newEstPrdCnt` · `format=json` · **`jsonVD=Y`**
  - 코드는 메타 API(getMeta type=ITM) 실제 응답으로 확인함. 두 품목은 품목별로 따로 요청한다 (`+` 구분자 인코딩 동작 미확인 → 피함).
- 응답: 정상은 **배열** `[{ORG_ID, TBL_ID, C1, C1_NM, C2, C2_NM, ITM_ID, ITM_NM, UNIT_NM, PRD_SE, PRD_DE, DT, ...}]` · `DT` 는 **문자열** · `PRD_DE` 월은 YYYYMM
  - 오류는 HTTP 200 + **객체** `{"err":"30","errMsg":"데이터가 존재하지 않습니다."}` (10 키 누락 · 11 키 만료 · 20/21 변수 · 30 없음 · 31 초과 · 40 분당 200건 · 50 서버)
  - `jsonVD` 가 없으면 키에 따옴표가 없어 JSON 파싱 실패 → 반드시 붙임
  - 필드가 빠질 수 있음(UNIT_ID · LST_CHN_DE) → 필요한 필드(PRD_DE · DT)만 검사
- 키: KOSIS 회원가입 → 활용신청 → 자동 발급 (기간 만료 있음, 연장 가능)
- 한도: 요청당 4만 셀 이하 · 분당 200건
- 기준: 2020=100 · 2026-10 자료가 2026-11-03 에 올라옴. 기준연도 개편(2025=100) 때 tblId 가 바뀔 수 있음.
- 실제 키로 월별 응답을 받아 보지 못함 → **키 발급 후 확인 필요** (월별 PRD_SE 값 · C2 필드)

## 설계
- series: `kosis-cpi:air-fare` · `kosis-cpi:package-tour` · period `YYYY-MM` · source `kosis`
- API `apps/api/src/features/indicators/kosis.ts` (파싱 · 오류 구분) · collect 에 KOSIS 수집 추가 · 키 없으면 건너뜀
- 일정: 매달 1일 회차(pricesMonthly)에서 세계은행 수집과 **따로** (실패 분리). 최근 24개월을 다시 받아 덮어씀 (고침 반영 · 발표가 늦은 달 채우기)
- 화면 /prices (기존 travel-price 슬라이스 · 기존 차트 · 색): 두 품목 지수 차트 + 작년 대비 + 달별 평균(싼 달 표시) + 원/달러 월평균 나란히. 자료 없으면 "준비 중"
- 3D 비행기: `packages/ui/src/three/objects/plane.tsx` — Stage · tokenColor 재사용, 코드 도형(몸통 · 날개 · 꼬리), 천천히 떠다님. prefers-reduced-motion 이면 멈춘 그림, 모바일은 기존 lazy 로딩 · 낮은 해상도 규칙 따름. 외부 모델 파일 없음.

## 애매한 곳 (사용자가 자는 중 — 판단해서 정함)
- 통계표 DT_1J22001 사용 (가정 · 품목포함 표, 메타로 코드 확인)
- 3D 비행기를 이 PR 에 함께 넣음 (가정 · 여행 품목 화면에 붙는 것이라 따로 나누면 빈 자리만 생김)
- "싼 달" = 최근 3년 같은 달 지수 평균이 가장 낮은 달 (가정)
- 월 자료는 1일 회차에서만 받으므로 KOSIS 는 최대 약 한 달 늦게 반영 (가정 · wrangler 변경 금지 조건)

## 담당
- test: 완료 기준마다 테스트 먼저 (fixture 는 문서 예제 응답 형식으로 만든 CPI 월별 모양 · 오류 객체)
- builder: 구현

## 파일 계획
- .agents/specs/0164-kosis-travel-price/**
- .agents/orchestration/TASKS.md
- apps/api/src/features/indicators/**
- apps/api/src/index.ts
- apps/api/src/env.ts
- apps/api/.dev.vars.example
- apps/api/src/scheduled-kosis.test.ts
- apps/web/src/features/travel-price/**
- apps/web/src/app/prices/page.tsx
- apps/web/src/shared/api.ts
- apps/web/src/bff/**
- packages/ui/src/three/objects/plane.tsx
- packages/ui/src/three/scene/lazy.tsx
- apps/web/public/models/plane.glb
- packages/ui/src/three/lib/plane.ts
- packages/ui/src/three/lib/plane.test.ts
- packages/shared/src/**
- docs/domain/travel-price.md
- docs/design.md

## 계획 밖 변경 이유
<!-- 게이트는 main 과 비교하므로, 이 브랜치의 base 인 작업 0163(PR #178)의 변경(schema.ts · 0010 마이그레이션 · import-calc · packages/shared/package.json 등)이 계획 밖 · 보호 파일로 함께 잡힌다. 0163 이 머지되면 사라진다. -->
- packages/ui/src/three/scene/lazy.tsx: PlaneLazy 추가 — 다른 3D 장면과 같은 늦게 불러오기 방식 (파일 계획에 빠뜨림)
- apps/web/src/features/travel-price/lib/plane-model.ts: 모델 주소 · 출처 상수 (apps/web/src/features/travel-price/** 안 · 테스트가 정한 이름)
- apps/api/src/log.ts: 로그에서 KOSIS 주소의 apiKey= 값 가리기 (인증키가 주소에 들어감 · 규칙 6)
- (그 밖의 계획 밖 목록은 0163 변경이 base 에 섞여서 나타남 — 이 작업의 변경 아님)

## 완료 기준
- [ ] 정상 배열 응답에서 (YYYY-MM, 지수) 를 얻고 숫자 아닌 DT 는 버린다
- [ ] 오류 객체(err) 응답은 오류로 기록하고 저장하지 않는다
- [ ] 키가 없으면 건너뛰고 저장하지 않는다
- [ ] KOSIS 수집이 실패해도 세계은행 물가 수집은 그대로다
- [ ] 작년 같은 달 대비 % 계산 · 작년 값이 없으면 빈 값
- [ ] 달별 평균으로 싼 달을 고른다 · 자료가 모자라면 고르지 않는다
- [ ] 자료가 없으면 화면은 "준비 중"
- [ ] 비행기: 움직임 줄이기 설정이면 움직이지 않는다
- [ ] 비행기: 밝은 · 어두운 화면 모두에서 형체가 보인다 (미리보기 캡처로 확인)
- [ ] 비행기: 모델 주소를 url prop 으로 받고 도형 목록(PLANE_PARTS)이 없다 · 출처(CC-BY) 문구가 화면에 있다
- [ ] bash .agents/checks.sh PASS

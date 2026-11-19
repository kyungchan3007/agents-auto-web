# 계획

## 무엇을 · 왜
- 2026-11-19 AI 답변 세션 측정 결과를 남긴다. 질문 3판(`apps/api/src/features/geo/questions.ts`, 24개 · 브랜드 b14~b21)의 두 번째 측정이다.
- 질문마다 세션 웹 검색(WebSearch standard)을 한 번씩 하고, found(검색 결과에 flapfx.com 주소) · cited(답의 출처로 씀)를 기록한다.
- #157 검색 노출 조사를 11-18 과 비교해 이어 간다.

## 애매한 곳
- 형식은 2026-11-18.json 과 같다(`edition: 3` 포함). 질문 순서는 `QUESTIONS` 순서(확인됨: 어제 파일과 질문 순서 일치 검사).
- 검색이 실패한 질문은 실패로 기록하고 값을 지어내지 않는다. 이번에는 24개 모두 검색에 성공했다.
- Search Console 새 속성(sc-domain:flapfx.com)은 계정 작업이라 직접 열지 않고, 공개 /geo 의 `gsc-sync` 결과로만 확인한다.

## 파일 계획
- apps/api/data/geo-answers/2026-11-19.json
- .agents/specs/0225-geo-answers-1119/**
- .tmp/ 의 PR 본문 · #157 댓글 초안 (커밋하지 않음)

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] 질문 24개 모두 기록 (실패한 질문은 실패로)
- [x] PR 본문 · #157 댓글에 어제와 비교한 소견
- [x] 지난 측정 결과 파일은 고치지 않음

## 허점
- found 는 검색 결과 목록의 주소만 보고 판정한다(결과 본문은 보지 않음). 목록에 flapfx.com 이 없으면 false.
- 검색 엔진 한 곳(세션 웹 검색) · 질문마다 한 번이라 결과가 날마다 달라질 수 있다.

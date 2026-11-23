# 계획

## 무엇을 · 왜
- 입력에 따라 바뀌는 큰 제목 두 곳에서 숫자만 카운트업하고, 여행 물가는 노란 밑줄을 다시 그린다 (모션 추가 · 빼지 않음)
- 작업 종류 ③(숫자 동작) — 요구마다 기능 테스트
- 운영 화면 모션이 바뀜 → .changeset `"@hav/web": patch` 한 줄 (builder) · develop 머지까지 (main 반영은 하루 마무리)

## 요구
1. 직구(/calc): 물건 값을 바꾸면 제목의 금액 숫자만 직전에 보이던 값 → 새 값으로 카운트업. 나머지 문장은 바로 바뀜
2. 여행 물가(/prices): 나라를 바꾸면 퍼센트 숫자가 직전 값 → 새 값으로 카운트업 + 노란 밑줄이 다시 그어짐. 나라 이름 · "높습니다/낮습니다" 는 바로 바뀜
3. 카운트 중에 값이 또 바뀌면 그 순간 보이던 값에서 새 값으로 이어 감 (튀지 않음)
4. 서버 첫 그림 · 자바스크립트 없음 · 움직임 줄이기 설정 = 최종 값 그대로 (크롤러가 읽는 글 그대로)
5. 숫자 형식 그대로 — 직구 쉼표 · "원", 여행 물가 "%" · tabular-nums 로 글자 폭 흔들림 없음
6. 숫자 없는 문장(면세 한도 안 등)으로 바뀌면 모션 없이 바로
7. 문장 · 글자색 · 밑줄 모양 · 처음 들어올 때 모션은 그대로

## 구현 방향 (작업서 · 코드 구조 기준)
- 이미 있는 CountUp(packages/ui/src/components/motion/count-up.tsx · hooks/motion/use-count-up.ts 의 from)을 쓴다 — 새로 만들지 않음
- EmphText(packages/ui/src/components/text/emph.tsx)가 숫자 조각을 CountUp 으로 그릴 수 있게(선택 옵션) · underline 은 값이 바뀌면 밑줄 애니메이션이 다시 재생되게(지금은 key 가 조각 순서라 span 이 재사용됨)
- 로직은 훅 · lib 에 · tsx 는 그리기만

## 애매한 곳
- 없음 (해석은 사용자 승인)

## 파일 계획
- packages/ui/src/components/text/emph.tsx · packages/ui/src/lib/text/emphasis.ts · packages/ui/src/components/motion/count-up.tsx · packages/ui/src/hooks/motion/** (builder)
- apps/web/src/features/import-calc/** · apps/web/src/features/prices/** (builder)
- .changeset/*.md (builder)
- 위 옆 *.test.ts(x) · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0321-headline-countup/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 요구 1 ~ 6 기능 테스트
- [ ] 미리보기 주소 + 볼 경로 회신 (/calc 물건 값 바꾸기 · /prices 나라 바꾸기)

## 허점
- 

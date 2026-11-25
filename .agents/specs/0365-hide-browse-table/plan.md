# 계획

## 무엇을 · 왜
- 통화 상세(/currencies/[code]) 맨 아래 "둘러보기" 표가 자주 묻는 질문 아래에 있어 어색하다는 지적 → 통화 상세에서 표 구간을 화면에서 뺀다. 페이지는 자주 묻는 질문 → 출처 줄로 끝남.
- 통화 링크(/currencies/XXX 22개)는 HTML 에 남긴다. 끝까지 숨긴 표가 아니라 "다른 나라 통화 보기" 사이드바 목록을 서버 첫 그림 HTML 에 미리 그려 두고 버튼을 누르면 보이게(닫힌 동안은 접근성 트리에서 빠짐 · 두 번 읽히지 않음).
- 자바스크립트가 없을 때 버튼은 /currencies 통화 목록 페이지 링크.
- 다른 화면(예: /currencies 목록 페이지)에서 쓰는 표 구간은 그대로. 통화 상세에서만 뺌.
- 작업 종류 ③(링크 · 동작): 요구마다 기능 테스트. 이 표를 보던 기존 테스트는 "표가 화면에 없음 · 사이드바 목록 링크가 HTML 에 있음"으로 고침(test).

## 애매한 곳
- 표가 layout 에 있어 통화 상세에서만 빼려면 경로 구분이 필요(builder 판단 · 0345 에서 질문 칸 위치 때문에 확인한 구조).

## 파일 계획
- apps/web/src/app/currencies/** · apps/web/src/features/currencies/**
- packages/ui/src/components/layout/side-panel.tsx · packages/ui/src/hooks/side-panel/** (닫힌 상태로 미리 그리기가 필요하면)
- .changeset/*.md (patch)
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0365-hide-browse-table/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] /currencies/MYR 정적 HTML 에 /currencies/XXX 링크 22개 · 화면에 둘러보기 표 없음

## 허점
-

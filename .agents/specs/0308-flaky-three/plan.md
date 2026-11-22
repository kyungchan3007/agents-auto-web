# 계획 (Quick)

> 요청 원문: [request.md](request.md)

## 원인 · 고침 (CI 로그 run 45032152627 · 45028362375 로 확인)
- admin.spec "메뉴로 다른 화면에 감": 화면을 옮긴 직후 스타일이 붙기 전 휴대폰 · 넓은 화면 메뉴가 둘 다 보여 링크가 2개로 잡힘(strict mode) → 화면 폭에 맞는 메뉴(aside · header) 하나로 찾음
- currency-chart:163 기간 버튼: 하이드레이션 전에 눌러 누름이 무시됨(aria-pressed false) → 이어받은 뒤에 누름(hydrated)
- currency-chips:248: 저장값이 있는데 기본 칩 줄이 잠깐 보임 — 로컬(CPU 6 · 12 · 20배)에서 재현 안 됨 · 코드에서 원인 경로를 찾지 못함 → 실패 메시지에 그 순간의 준비 표시 · html 표시 · 칩 줄 수 · 저장값을 남겨 다음 실패에서 원인을 확인 (조건은 그대로)

## 작업 종류
- 테스트만 고침 · 확인 조건은 그대로

## 파일 계획
- apps/web/e2e/admin.spec.ts · currency-chart.spec.ts · currency-chips.spec.ts · .agents/specs/0308-flaky-three/**

## 확인
- 로컬: 세 spec 을 세 번씩(--repeat-each 3) 270 통과

# 계획 — 작업 0267 · 소개 본문을 문장으로 다시 쓰고 두 칸 더하기 (Quick · 평소 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (시안 41 · 여덟 칸 글 표).

## 무엇을
- `features/about/lib/criteria.ts` 의 `ABOUT_CARDS` 를 작업서 표의 여덟 칸 글로(4 · 5 새로) · 8번 "작업실"은 /log 링크
- 배치(두 칸 격자 · 카드 모양 · 간격) 그대로 · 휴대폰은 한 줄에 한 칸
- 페이지 설명글(메타 · 구조화 자료)이 본문을 쓰면 함께

## 결정 (lead)
- **사실 대조를 먼저.** builder 가 구현 전에 표의 글을 코드 · `docs/domain/` 과 대조해 lead 에게 보고(특히 2번 30% · 90일, 1번 받는 시각, 6번 주마다 고시, 4 · 5번 자료 설명). 맞지 않으면 고치지 않고 claude-desktop 에 알려 사용자 확인을 받는다.
- `lib/` 파일이라 평소 PR(design 라벨 없음).
- 항공권 제공처 이름은 넣지 않음.

## 누가
- builder — 사실 대조 보고 → (맞으면) 구현 한 커밋 · 푸시
- test — criteria.test.ts 등 깨진 테스트 · 여덟 칸 · 링크 확인 · 보고
- lead — 대조 결과 전달 · PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/about/lib/criteria.ts
- apps/web/src/features/about/components/** (8번 링크 · 칸 수가 화면에 묶여 있으면)
- apps/web/src/app/about/** (메타 · 구조화 자료가 본문을 쓰면)
- apps/web/src/features/about/**/*.test.ts(x) · apps/web/e2e/** (test)
- .agents/specs/0267-about-rewrite/** · .agents/orchestration/TASKS.md

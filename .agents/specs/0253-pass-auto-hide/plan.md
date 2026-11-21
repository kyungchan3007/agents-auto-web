# 계획 — 작업 0253 · 홈 탑승권 상자 3초 뒤 사라짐 (Quick)

요구 · 기준 원본: [handoff.md](handoff.md) (항목 그대로 — 220ms 올라오며 나타남 · 3초 뒤 0.5초 내려가며 흐려짐 · 올려 두면 멈추고 떼면 3초 다시 · 다시 누르면 닫힘 · 여행지 바꾸면 3초 다시 · 움직임 줄이기는 흐려지기만).

## 결정 (lead)
- 0251 · 0252 와 따로 연다(파일 겹침 없음 · 홈만).
- 3초 타이머 · 올려 둠 · 다시 세기는 상태가 필요하다. 화면 .tsx 는 상태 · 효과 훅을 직접 쓰지 않으므로(role-boundary) `usePickedDestination`(hooks) 쪽에 두는 것이 자연스럽다 → 그러면 **평소 PR**(design 라벨 없음 · @design 실패도 막음). CSS 애니메이션 + 이벤트만으로 요구를 모두 맞출 수 있으면 디자인 PR 로 둔다 — builder 가 동작이 맞는 쪽을 고르고 보고에 적는다.
- 상자가 떠 있는 것을 보는 표시 없는 테스트는 "누르면 뜬다 · 3초 뒤 없다 · 다시 누르면 뜬다"로(가짜 시계 권함) — test.

## 누가
- builder — 구현 한 커밋 · 푸시
- test — 깨진 기능 테스트 고침 · 새 동작 테스트 · 로컬 확인 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/home/components/ticket.tsx
- apps/web/src/features/home/hooks/** (usePickedDestination 이 있는 파일)
- apps/web/src/features/home/**/*.test.ts(x) · apps/web/e2e/** (test)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0253-pass-auto-hide/** · .agents/orchestration/TASKS.md

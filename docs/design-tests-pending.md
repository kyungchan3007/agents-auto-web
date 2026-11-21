# 미뤄 둔 디자인 테스트

- 디자인 PR 에서 `@design` 테스트가 실패해도 막지 않고 이 파일에 목록으로 쌓는다(규칙: .agents/orchestration/verdict.md "디자인 PR 판정").
- AI 티 걷어 내기가 끝나면 작업 한 건으로 비운다. 전부 되살리지 않고, 크게 깨지는 것(요소 겹침 · 화면 밖으로 나감 · 주요 구역이 안 보임)만 잡도록 줄인다. 여백 · 좌표 · 색 · 모서리의 정확한 값을 고정하는 검사는 없앤다.
- 기한 알림은 두지 않는다. 하루 마무리 PR 본문에 "미뤄 둔 디자인 테스트 N개" 한 줄로 개수만 적는다.

## 쌓는 형식
작업마다 아래 한 묶음을 맨 아래에 더한다.

```
### 작업 NNNN · YYYY-MM-DD
| 테스트(파일 › 이름) | 무엇이 달라졌나 |
| --- | --- |
| apps/web/e2e/example.spec.ts › 제목 글자 크기 @design | 기대 56px · 지금 48px |
```

## 쌓인 목록
### 작업 0248 · 2026-11-21
| 테스트(파일 › 이름) | 무엇이 달라졌나 |
| --- | --- |
| apps/web/src/shared/prices-title.test.ts › 여행 물가 예산 카드 — 시안 B 위치 · 크기 › 넓은 화면 카드: 폭 28.25rem · 아래로 내림 · … @design | 기대 `lg:translate-y-[150px]` · `lg:mb-10` · `lg:pt-[calc(150px+…)]` · 지금 `lg:translate-y-9` · `lg:-mb-20` · `lg:pt-[calc(7rem+4rem)]` (3번: 카드 위 끝을 제목 첫 줄에 맞춤) |
| apps/web/src/shared/redesign-foundation.test.ts › 장식을 걷어 냄 (R9) › 공통 컴포넌트(packages/ui/src/components)에 그림자(shadow) · 그라데이션이 없음 @design | 기대 위반 파일 없음 · 지금 `packages/ui/src/components/form/pick-trip.tsx` 에 그림자 (3번: 여행지 고르기 팝업 그림자는 사용자가 고른 모양) — 팝업 그림자는 사용자 결정으로 유지 — 정리 때 이 검사는 팝업을 예외로 |
| apps/web/e2e/prices-redesign.spec.ts › 새 /prices — 예산 카드 위치 · 크기 › 넓은 화면 — 카드 폭 · 제목보다 아래에서 시작 · … @design | 기대 카드 위 끝이 제목 첫 줄 위 끝보다 80px 이상 아래 · 지금 −4px (카드가 제목과 같은 줄에서 시작 · 3번) |
| apps/web/e2e/prices-redesign.spec.ts › 새 /prices — 예산 · 자 · 표 › 나라 더 보기 — 표 아래 왼쪽 밑줄 글자 링크 · … 접기 버튼은 눈에 띄는 알약 + 화면 아래에 붙음 @design | 기대 접기 띠 position `sticky` · 지금 `static` (4번: 펼친 뒤 접기를 목록 끝 왼쪽에 둠) |
| apps/web/e2e/prices-route.spec.ts › 여행 물가 — 스크롤로 떠나는 물가 노선 › 예산 카드 아래 끝 → 노선 제목(h2) 위 끝 간격 … @design | 기대 넓은 화면 140px(±2) · 지금 높이 720 에서 약 97px (3번: 카드가 파랑 밖으로 나온 만큼 아래 여백을 줄임) |
| apps/web/e2e/detail-design.spec.ts › 여행 물가 › 통화 목록 알약은 '환율' 로 시작하지 않음 — 물가 알약과 구분 @design | 기대 통화 목록 칸에 알약(`span.rounded-pill`) 있음 · 지금 알약 없음 — 조용한 글자로 바뀜 (17번 · 둘러보기 격자) |

### 작업 0249 · 2026-11-21
| 테스트(파일 › 이름) | 무엇이 달라졌나 |
| --- | --- |
| apps/web/src/shared/number-emphasis.test.ts › Emph · EmphText 공통 부품 › 하늘 종이 위: 해 노랑(sun) 형광펜 띠 — 그라데이션이 글자 높이 아래 40~50% @design | 기대 형광펜 그라데이션 `transparent 50~60%` 에서 시작 · 지금 `transparent 64%` ~ `90%` 구간만 (24번: 글자 위쪽 64~90% · 폭에 맞춤) |
| apps/web/e2e/calc-gap.spec.ts › 직구 입력 안내 아래 빈칸 › 물건 값 안내 문구 아래 ~ 보내는 곳 사이 간격이 20px 이하 · 안내 자리는 한 줄 높이 @design | 기대 안내 아래 ~ 보내는 곳 20px 이하 · 지금 약 52.7px (2번: 직구 카드 높이 맞춤) |

- 작업 0248 줄에 이어진 변화(새 테스트 아님): `redesign-foundation.test.ts` 그림자 검사의 위반 파일이 `pick-trip.tsx`(팝업 · 유지) 외에 `packages/ui/src/components/data/flag.tsx` 하나 더(18번: 국기 옅은 테두리 `shadow-[0_0_0_1px_…]`) · `prices-route.spec.ts` 예산 카드 아래 간격은 지금 높이 720 에서 약 129px(6번: 구간 사이 간격 통일).

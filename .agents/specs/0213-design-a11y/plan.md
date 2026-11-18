# 계획

## 무엇을 · 왜
- 접근성 · 기본기 6가지 (#252).
- 섹션 제목(SectionTitle)이 실제 제목 태그(h2)로 그려지는지 확인하고, 제목 태그가 아닌 섹션 제목(destinations · budget-planner · converter · customs · story 등)을 제목 태그로.
- 본문 바로가기 링크: 첫 Tab 에서 "본문 바로가기"가 보이고 누르면 main 으로(평소엔 숨김).
- 버튼 눌림(:active) 상태 (packages/ui form/button.tsx).
- 탭 밑줄 이동을 left · width 대신 transform 으로 (packages/ui form/tabs.tsx · 모션 줄이기 존중).
- html · body `overflow-x: clip` (globals.css) — 가로 넘침 방지.
- 경고 이모지 ⚠ → 그림(SVG) 아이콘 (shared/outage-notice.tsx · ui feedback/freshness-note.tsx) · 이모지는 윈도우에서 모양이 다름.

## 애매한 곳
- 제목 단계: 페이지마다 h1 하나 · 섹션 h2 · 그 안 h3 — 화면 모양(크기 · 색)은 바꾸지 않음 (가정)
- 바로가기 글: "본문 바로가기" (가정)
- 아이콘은 새 의존성 없이 SVG 직접 (가정)

## 파일 계획
- packages/ui/src/**
- apps/web/src/shared/**
- apps/web/src/app/globals.css
- apps/web/src/app/layout.tsx
- apps/web/src/features/**
- apps/web/e2e/**
- .agents/specs/0213-design-a11y/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
(없음 — 바뀐 파일은 모두 파일 계획 안: packages/ui · apps/web/src/shared · app/globals.css · app/layout.tsx · features · e2e)

## 완료 기준
- [x] bash .agents/checks.sh PASS (Quick)
- [x] 모든 페이지 제목 구조: h1 하나 · 섹션 제목이 h2 (e2e 로 페이지마다 확인)
- [x] 첫 Tab = 본문 바로가기 · Enter 로 main 초점 (e2e)
- [x] 버튼 :active 스타일 · 탭 밑줄 transform (단위 또는 e2e)
- [x] ⚠ 이모지 글자 없음 · svg 아이콘 (e2e · 검사)
- [ ] 화면 모양은 그대로 (미리보기 캡처 비교 · lead)

## 허점
- 파일 수가 10개를 넘음(코드 24개 안팎) — 여섯 가지가 서로 다른 곳(제목 · 바로가기가 모든 페이지의 main · 버튼 · 탭 · 전역 CSS · 경고 아이콘)이라 한 번에 고쳐야 했음. 단계마다 한 커밋.
- 제목: 이미 SectionTitle 은 기본 h2 · destinations · budget · converter · customs · story 등 섹션 제목은 모두 제목 태그였음(e2e 로 확인). 빠진 곳은 /flights 뿐(h1 만 있고 h2 없음) → 화면에 안 보이는(sr-only) h2 두 개를 넣음 — 모양 그대로. 제목 칸(aria-labelledby)이 가리키는 요소가 모두 제목 태그인지, 단계 건너뜀이 없는지를 모든 페이지 e2e 가 확인.
- 바로가기: layout 맨 앞에 "본문 바로가기"(sr-only · 초점에서만 보임) · 홈에는 main 이 없어 추가 · 나머지 페이지 main 에 id="main" tabIndex=-1. main:focus 는 둘레 선 없음.
- 버튼 :active: 세 모양 모두 + 살짝 눌림(translate-y-px · 움직임 줄이기면 없음). 이 부품은 현재 화면에서 거의 안 쓰여 눈에 보이는 변화는 적음(고르기 버튼 등 직접 만든 버튼은 그대로).
- 탭 밑줄: transform 으로 이동(폭은 바로 바뀜 — left 와 translate 만 애니메이션). 이 부품도 현재 화면에서 안 쓰임(디자인 시스템 부품) — 구조 검사로만 확인.
- overflow-x: clip — sticky 는 그대로(통화 목록 e2e) · 모든 페이지 가로 넘침 없음.
- 경고 아이콘: 새 ui 부품 warn-icon(svg 직접 · 의존성 없음) · 장애 안내 · 환율 기준일 글이 씀. 이 두 곳은 평소 안 보이는 안내(장애 없음 · 오늘 값)라 e2e 로 화면 확인은 못 하고 구조 검사(⚠ 글자가 소스에 없음 · svg 아이콘을 씀)로 확인.
- 빌드 1번 · 전체 e2e 380개 통과.

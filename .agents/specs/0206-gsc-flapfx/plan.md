# 계획

## 무엇을 · 왜
- 매일 검색 노출 동기화(gsc-sync)가 아직 지운 옛 주소 속성(`https://tripfx.pages.dev/`)을 봅니다.
- 사용자가 Search Console 에 **도메인 속성 `sc-domain:flapfx.com`** 을 만들고(인증된 소유자 · 2026-11-18), 서비스 계정 tripfx-gsc 를 "제한적" 권한으로 추가했습니다.
- 동기화가 새 속성을 보게 바꿉니다.
  - API 호출에 쓰는 속성 이름: `sc-domain:flapfx.com`
  - 페이지 주소를 경로로 줄일 때 받는 주소: `https://flapfx.com/` · `https://www.flapfx.com/` (도메인 속성이라 www 도 섞여 옴)

## 애매한 곳
- 동기화는 매번 표를 비우고 새로 넣습니다(`DELETE FROM gsc_daily`). 그래서 옛 속성 숫자(11-03 ~ 11-14 노출 3 · 클릭 0)는 다음 동기화부터 사라집니다. 이 숫자는 #157 · 측정 문서에 이미 기록돼 있습니다 (가정: 따로 보관하지 않음 · 전후 비교 #243 에서는 "옛 속성 기록"으로 문서 값 표시).

## 파일 계획
- apps/api/src/features/geo/gsc.ts
- apps/api/src/features/geo/gsc.test.ts
- apps/api/scripts/gsc-sync.ts
- docs/geo-measurement.md
- .agents/specs/0206-gsc-flapfx/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 테스트: flapfx.com · www.flapfx.com 페이지는 경로로 · 옛 주소 · 다른 사이트는 버림
- [ ] 머지 뒤 gsc-sync 를 손으로 한 번 돌려 HTTP 200 (권한이 맞는지)

## 허점
-

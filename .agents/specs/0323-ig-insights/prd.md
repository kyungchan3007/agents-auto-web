# PRD — 무엇을 · 왜

> 원문(request.md)을 옮긴 파생 문서. 요구 충족 판정 기준은 언제나 원문이다

## 문제
- 인스타 게시물을 올리기 시작했지만 도달 · 반응을 읽어 두는 곳이 없어, 올린 글이 얼마나 보였는지 비교할 수 없다.

## 목표
- 매일 한 번 게시물별(도달 · 좋아요 · 저장 · 공유 · 조회)과 계정(도달 · 조회 · 프로필 방문 · 링크 클릭 등 받을 수 있는 지표)을 읽어 날짜별로 남긴다.
- 어드민에서 날짜별로 볼 수 있게 한다(보이는 방법은 lead 와 정함).
- 숫자는 받은 값만 남긴다. 받지 못한 지표는 0 이 아니라 빈 값으로 남긴다.

## 비목표
- 광고 성과(광고 계정이 0개 · 생기면 별도 작업).
- 팔로워 증감 분석 · 게시물 성과 예측 · 자동 문구 수정.
- 토큰을 코드 · 로그 · 일지 · 응답에 쓰는 것.

## 확인한 사실 (2026-11-23 읽기 전용 호출 · 값은 모두 0)
- 게시물 지표 reach · likes · saved · shares · views: 200.
- 계정 지표 `metric_type=total_value` 로 200: reach · views · profile_views · website_clicks · accounts_engaged · total_interactions · likes · comments · saves · shares · profile_links_taps · follows_and_unfollows(값 구조가 달라 확인 필요).
- 계정 reach · follower_count 는 `period=day` 로 날짜별 값이 옴. 나머지는 `total_value` 만 받음(기간 합계).
- 계정: followers_count 0 · 게시물 3개. 광고 계정 0개.

## 애매한 곳
- 계정 지표는 기간 합계라 "하루치"를 얻으려면 since/until 을 하루로 좁혀 부르는 방식이 맞는지 (가정: 어제 하루로 좁혀 부름, 구현 때 확인).
- 게시물 지표는 게시 뒤 시간이 지나며 늘어남 → 매일 같은 게시물을 다시 읽어 날짜별 값을 쌓는 것으로 (가정).
- 어드민에 어떻게 보일지(표 · 그래프 · 게시물 카드) — lead 와 정함.
- 비밀값 두는 곳: 새 토큰을 GitHub Secrets `IG_ACCESS_TOKEN` 에 사람이 등록해야 함(.env.local 에만 있음).

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 하루 한 번 자동으로 값을 읽어 D1 에 쌓는다(받지 못한 지표는 빈 값)
- [ ] 토큰이 출력 · 커밋 · 로그에 없다
- [ ] 어드민에서 날짜별 값을 볼 수 있다(표시 방식 lead 와 합의)

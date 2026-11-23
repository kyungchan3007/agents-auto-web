# 요청 원문

사용자 요청(원문): "인스타 성과는 없겠지 이제 측정을 해야할거야" · "지금 하자" → .env.local 토큰을 새로 바꿨고 instagram_manage_insights 권한이 들어갔습니다(게시 권한 그대로 · SYSTEM_USER · 만료 없음). 확인: /{media-id}/insights?metric=reach,likes,saved,shares,views → 200 · /{IG_USER_ID}/insights?metric=reach&period=day → 200(지금은 모두 0). 할 일: 매일 게시물별(도달 · 좋아요 · 저장 · 공유 · 조회)과 계정(도달 · 프로필 방문 · 링크 클릭 등 되는 지표)을 읽어 남기는 흐름 제안 · 구현. 어드민에 보일 방법은 lead 와 정하기. 숫자는 받은 값만 · 못 받으면 빈 값. 토큰 출력 금지. 참고 스크립트 .tmp/instagram/check-insights.mjs. 광고 성과는 광고 계정이 생기면(지금 0개 · ads_read 있음).

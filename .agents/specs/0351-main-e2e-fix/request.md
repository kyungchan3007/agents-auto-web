# 요청 원문

사용자(2026-11-24 · claude-desktop 경유 · 이탈 줄이기 시안 https://claude.ai/artifact/XHeVEa4i5zJ4TUr4U9DE76 · 캡처 .tmp/sian-retention/):

> 응 좋아 그리고 난 그걸 생각했으면 좋겠어 유저를 우리페이지에서 최소한 이탈자가 좀 없게 하고 싶어
> 음 그리고 11월에 떠나세요 밑에 무료료 환율을 체크해보세요! 라고 이렇게 뭔가 기획이 좀 필요할거 같아 유저들이 들어왓을때 뭐부터 해야하는지 잘 모르는경우가 많거든
> 9-c 가 좋은거 같고 또보자 8번은 음 적용하지말자 그리고 1  ~ 7 번까지 적용하면 될거 같아
> 메인까지 부탁해
> 그리고 라벨은 니가 달고

claude-desktop 작업서(qitem-20261124173258-84c9e913fbc1aa5b) "마지막: main 반영" 원문:

> - 작업 1~6 이 develop 에 모두 머지되면: `npm run release:version` → `git log origin/main..origin/develop` 확인 → `git push origin origin/develop:main`.

claude-desktop 지시 원문(11-24 18:40Z):

> #409 실패 정리 .tmp/sian-retention/409-fail.md 참고. 의도된 변경은 테스트를 시안에 맞게, 아니면 코드 수정 · #409 전체 e2e 통과 전에는 main 에 보내지 않음. 어드민 실패는 이번 묶음 전에도 깨졌는지 먼저 구분.

.tmp/sian-retention/409-fail.md 원문:

> # #409 전체 e2e 실패 (run 45457945440) · claude-desktop 정리
>
> 운영(web): 8 failed · 1231 passed
> - currency-switch.spec.ts:207 · :224 (통화 바꾸기 끝 상태 = 새로 불러온 페이지, 물가 링크) → 0345 한 줄 답 · FAQ 영향 의심
> - home.spec.ts:7 홈 구간 순서 → 0347 영향 의심
> - home-redesign.spec.ts:253 카드 안 칩 줄 + 검색 칸 → 0347 9-C 로 검색 칸을 옮긴 의도된 변경일 가능성
> - tap-44.spec.ts:61 /prices 누르는 자리 44px (넓은 화면 · 휴대폰) → 0344 나라 링크 영향 의심
> - verdict-lines.spec.ts:26 /currencies/EUR 판정 설명 두 줄 없음 (넓은 화면 · 휴대폰) → 0345 한 줄 답 문장이 금지 문구와 겹치는지
>
> 어드민: basics /geo 제목 · geo-bot-pages 콘솔 오류 · admin ⌘K · 숫자 단축키 · log-today-gate(0341) · GEO 카드
> - 이번 묶음(0349 traffic) 영향인지, 이 묶음 전 develop 에서도 깨지는지 먼저 구분
>
> 처리 기준
> - 시안대로 바뀐 것(의도된 변경)이면 테스트를 새 시안에 맞게 고치고, 시안과 다르게 깨진 것이면 코드를 고친다. 판단 근거를 PR 에 한 줄씩.
> - 고친 PR 이 gate 통과 → develop 머지 → #409 다시 전체 e2e 통과한 뒤에만 main ff. 그 전에는 main 에 보내지 않는다.
>

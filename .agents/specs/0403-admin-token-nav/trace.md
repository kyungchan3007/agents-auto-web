# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 받기 | 큐 qitem-20261128142914 · 작업서 · 시안 확인 | 서버 접근 경계(worker)가 바뀌어 Full Loop |
| 2 | 조사 | 화면별 /bff 사용: log→activity · tasks / traffic→ga4 / instagram→ig / geo→geo / how→admin-visits(owner 만) | 막을 bff = activity · tasks · ga4 · ig · status 는 확인 필요 |
| 3 | 결정 | 숫자 단축키는 원래 키 유지(GEO 2 · 만드는 방식 3) | 세션마다 같은 키가 다른 화면이 되지 않게 (가정) |
| 4 | 구현 1차 | builder: 안내 창 삭제 · useIsOwner 로 메뉴 거름 · worker 막기 표(owner-only.ts) | owner 확인 뒤 작업실이 맨 위에 더해져 GEO · 만드는 방식이 한 칸 내려감 → 응답으로 위치가 움직임 |
| 5 | 방식 변경 | worker 가 owner 세션 HTML 에만 HTMLRewriter 로 <html data-viewer=owner> · 메뉴는 정적 HTML 여섯 개 + CSS 로 회사용 아닌 항목 숨김 · 찾기 · 단축키 · 로고는 같은 표시를 읽는 훅 · HTML 응답 Vary: Cookie | 첫 그림부터 owner · 회사 모두 끝 모양 · /session 안 기다림 · 하이드레이션 DOM 같음 |
| 6 | 결정 | /bff/status 는 막는 표에 넣지 않음 | 어드민 화면 코드에서 부르는 곳 없음 |
| 7 | 추가 지시 | 사이드바 아래 두 문장 · recruiter 공용 토큰 · owner 아닌 세션 접속 기록 안 남김 | 같은 PR · 원래 5번(접속 기록 그대로)은 추가 지시로 바뀜 |
| 8 | 추가 지시 2 | 이미 보낸 회사 링크 유지 · admin:token extend(기한만 늘림) | 회사 토큰은 owner 아님 → 이미 recruiter 와 같은 화면 · 막는 코드 없음 확인 |
| 9 | 추가 지시 3 | extend 명령 빼기(이미 만든 bee71966 되돌림) | 사용자가 기한을 늘리지 않기로 함 · 회사 링크는 기한까지만 |

## 허점
- 회사 HTML 소스에도 숨긴 메뉴 항목 이름(작업실 · 알리기 · 유입 · 인스타 유입)과 주소가 남음(보이지 않음 · 서버가 막음). 소스에서도 빼려면 worker 에서 지워야 하는데 하이드레이션 불일치가 생겨 이번엔 하지 않음.

# PRD — 무엇을 · 왜

> 요청 원문: [request.md](request.md)

## 문제
- 작업실(/log) · GEO 측정(/geo)은 운영자가 보는 화면인데 방문자 메뉴에 같은 무게로 있다(검수 공-18 · 메뉴 7개).
- 어드민으로 옮기기로 했고(메모 geo-log-to-admin), 주소는 서브도메인 admin.flapfx.com 으로 정했다.

## 목표
- admin.flapfx.com 에서 작업실 · GEO 측정 두 화면이 열린다(로그인 없음 · 검색에는 막음).
- flapfx.com 메뉴 · 사이트맵에서 두 화면이 빠진다. 옛 주소(flapfx.com/log · /geo)는 어드민 주소로 넘어간다.
- 화면 모양은 이번 작업에서 바꾸지 않는다. AI 티를 걷어 내는 디자인은 다음 작업에서 시안을 먼저 보인다(사용자: "AI티가 나면 안돼").

## 요구사항
| ID | 요구 | 확인 |
| --- | --- | --- |
| ADM-01 | admin.flapfx.com/log · /geo 가 지금과 같은 화면을 보여 준다 | worker 단위 테스트 · 배포 뒤 확인 |
| ADM-02 | admin.flapfx.com/ 은 /log 로 넘어간다 | worker 단위 테스트 |
| ADM-03 | admin 주소의 모든 응답은 검색에 막힘(X-Robots-Tag: noindex) · robots.txt 는 전부 막음 | worker 단위 테스트 |
| ADM-04 | admin 주소에서 방문자 페이지(/currencies 등 worker 를 지나는 주소)는 flapfx.com 같은 주소로 넘어간다 | worker 단위 테스트 |
| ADM-05 | flapfx.com · www.flapfx.com 의 /log · /geo 는 admin 주소의 같은 경로로 301 | worker 단위 테스트 |
| ADM-06 | 방문자 메뉴에서 작업실 · GEO 측정이 빠지고, 두 화면의 메뉴는 작업실 · GEO 측정 · 사이트로 가기만 보인다 | 단위 · e2e |
| ADM-07 | 사이트맵(PUBLIC_PAGES)에서 /log · /geo 가 빠진다 · 두 화면은 noindex · 정식 주소는 admin 주소 | 단위 |
| ADM-08 | 소개의 "작업실" 링크는 admin 주소로 | 단위 |
| ADM-09 | 미리보기(workers.dev) · 로컬은 지금처럼 /log · /geo 가 열린다(넘기기 없음) | worker 단위 테스트 |
| ADM-10 | admin 주소의 방문은 GEO 방문 기록(geo_hits)에 넣지 않는다 | worker 단위 테스트 |

## 범위 밖
- 로그인 · 접근 제한(사용자: 주소만 숨기고 공개)
- 새 어드민 기능(자료 상태 등)
- 두 화면의 디자인 변경(다음 작업 · 시안 먼저)

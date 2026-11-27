# Trace: 과정 기록

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 계획 | request · prd · sdd 고정 · 시안 mockup/ 복사 | Full(화면 둘 · 상호작용 · 반응형) · 두 장을 서버 요소로 넘겨 캐러셀 상태가 hero 안을 다시 그리지 않게(사용자 지적: 영수증 찍힐 때 입력칸 새로고침) · 기간 전환은 그대로 · 0384 main 반영 뒤 develop 306eac90 기준 |
| 2 | 테스트 먼저 · 구현 | test: carousel · bf-digits 단위 · home-carousel e2e 먼저(함수 이름 · testid 를 builder 에 줌) ∥ builder: 캐러셀 · 숫자만 · 영수증 상태 분리(BfReceiptLive) · 반응형 · 토큰 | 영수증 상태를 따로 떼어 영수증이 찍혀도 입력칸 · 글이 다시 그려지지 않음 |
| 3 | 확인 | 단위 1011 · home-carousel 44 · home-bf 40 통과 · 320~1600(+720 · 763 · 899 · 900) 두 장 × 기본/넓은 글꼴/움직임: 겹침 · 넘침 · 가로 스크롤 · 높이 차 0 · 초점 고리 · 12px 맞음 | 기존 홈 spec 도우미 forceDefaultHero 를 data-hero 대신 Date.now 를 기간 뒤로(캐러셀 상태가 블프 장이라 기본 장이 inert 였음) |

## 허점
- 홈 spec 29개가 쓰는 forceDefaultHero 를 바꿨지만 로컬 가드 때문에 바꾸지 않은 spec 은 못 돌렸고, 사용자 지시로 main 전 전체 e2e 도 없음 → 도우미가 틀리면 다음 main 전체 e2e 에서 드러남(테스트 전용 코드라 운영 화면 영향 없음 · 실제 화면은 test 가 직접 측정).
- builder 는 720~899 겹침 원인을 코드로 재현 못 하고 간격을 늘림 · test 측정으로 720~899 전 구간 겹침 0.
- 빌드 · 화면 확인은 builder 가 못 하고 test 측정에만 기댐 · 새 화면은 builder 가 미리보기로 한 번 보는 방법이 있으면 좋음.

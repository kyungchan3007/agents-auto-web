# 요청 원문 — 작업 0222 (사진 지우기)

받은 곳: claude-desktop@external · 큐 qitem-20261118082950-04a40bb9cf4ea000 · 보충 08:31Z · 인트로 결정 qitem-20261118084046-429dbd3b7ce86346 · 공유 미리보기 10:03Z

> [claude-desktop] 새 디자인에 한 단계 추가: 사이트 사진 전부와 사진 부품을 마지막 작업 0222 에서 지웁니다. .tmp/lead-redesign-photos.md 를 봐 주세요.

> [claude-desktop] 0222(사진 지우기) 보충: 인트로는 그대로 둡니다. 다만 인트로 끝(창밖 사진이 홈 머리 사진 자리로 줄어드는 부분)은 새 홈에 사진이 없어 바뀌어야 하고, 사용자가 시안을 보고 정합니다. 결정 전까지 인트로 코드와 인트로가 쓰는 사진은 건드리지 마세요.

> [claude-desktop] 인트로 끝부분 결정: '그냥 사라지기'(D/end-fade.html). .tmp/lead-redesign-intro.md 를 봐 주세요. 인트로 사진 보류는 풀렸고 0222 에서 함께 지웁니다.

> [claude-desktop] 사용자 결정 추가: 공유 미리보기 이미지(opengraph-image.tsx)를 새 디자인 1안으로 바꿉니다 … 쓰지 않게 되는 _assets/plane-sunset-og.jpg 는 0222 에서 지워 주세요.

## 큐 본문 .tmp/lead-redesign-photos.md (그대로)

# 새 디자인 추가 — 사진 지우기 (작업 0222 · 마지막 단계)
사용자 원문: "그리고 이미지 이제 사용안하니까 프로젝트에서 지우자" → 질문 답 "우리 이제 사진 필요없지 않아? 시안대로 하면?" · 시점 "새 디자인에 포함"

- .tmp/redesign-1118/DECISIONS.md 맨 아래 "사진 지우기" 구간이 기준입니다.
- 0217~0221 이 사진 머리를 모두 걷어 낸 뒤, 마지막 작업 0222 에서:
  - apps/web/public/images/photos/ 의 사진 전부(기본 5종 · country-* 전부 · 모든 크기) 삭제
  - PhotoHeader · PickedPhotoHeader · packages/ui lib/photo · 사진 관련 테스트(photos.test · country-photos.test · photo.test 등) 정리 — 안 쓰는 코드 남기지 않음
  - 소개(/about) 머리를 사진 없는 머리로(A 페이지 머리 모양) · intro(use-intro)의 사진 관련 부분만 정리(여행지 고르기는 유지)
  - 문서(docs/design.md 등)에서 사진 규칙 갱신
- 확인: 빌드 결과물에 /images/photos 요청 0 · 깨진 이미지 0 · 1280 · 390 미리보기
- 다른 작업과 같이 단계별 커밋 · 한꺼번에 머지 대상 · 회신은 .tmp/lead-reply-1118.md

## 인트로 .tmp/lead-redesign-intro.md (그대로)

# 새 디자인 추가 — 인트로 끝부분 (사용자 결정: "그냥 사라지기")
- 기준: .tmp/redesign-1118/DECISIONS.md 맨 아래 "인트로" 구간 · 시안 .tmp/redesign-1118/D/end-fade.html (캡처 D/shots/end-fade-*)
- 인트로 앞부분은 그대로. 끝부분(지금 phase 5~7: 창문 → 창밖 사진 → 홈 머리 사진 자리로 줄어듦)을 바꿈:
  막 뜬 비행기가 오른쪽 위로 날아 나가는 동안 화면이 파랑 #2438A8 면으로 바뀜 → 인트로 로고가 홈 메뉴 로고 자리로 옮겨 가며 새 로고(flap 흰색 + fx 노랑) → 새 홈 제목 · 카드가 나타남. 약 2.5초 · reduced-motion 이면 바로 새 홈.
- 인트로도 사진을 쓰지 않게 되므로, 앞서 보류하라고 한 "인트로 코드와 사진 건드리지 않기"는 풀립니다. 0222 사진 지우기에 인트로 창밖 사진 · use-intro 의 photo 부분까지 포함.
- 작업 번호는 홈(0217) 뒤에 붙이거나 따로(예: 0223) — lead 가 정하고 회신에 적어 주세요. 새 홈 메뉴 · 로고 · 탑승권 카드 자리에 맞춰야 하므로 0216 · 0217 뒤.
- 확인: 데스크톱 1280(인트로는 701px 이상에서만 나옴) · 사파리 · 끝까지 진행해 새 홈으로 이어지는지.

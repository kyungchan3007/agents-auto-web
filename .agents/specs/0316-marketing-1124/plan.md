# 계획

## 무엇을 · 왜
- 11-23 에 올린 유로 게시물 묶음(geo 준비 파일 .tmp/ig-0122/bundle-1123-euro/ 의 image.png · 문구.md)을 어드민 알리기 탭 docs/marketing/2026-11-24/ 칸에 넣는다 (사용자 결정 "11-24 칸에" — 11-23 칸은 사용자가 직접 올린 게시물)
- 눌렀을 때 갈 주소: https://www.instagram.com/p/DgEa3g3j97X/
- 작업 종류 ①(자료만) — 새 테스트 없음 · 운영 화면 변화 없음 · 변경 기록 없음 · develop 머지 뒤 바로 main fast-forward

## 애매한 곳
- 어드민이 같은 날 여러 폴더를 읽게 고치는 안은 쓰지 않음 (확인됨: 사용자 "11-24 칸에")

## 파일 계획
- docs/marketing/2026-11-24/**
- .agents/specs/0316-marketing-1124/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)

## 허점
- lead 가 사용자 선택을 기다리지 않고 어드민 수정 안으로 먼저 움직여 test 의 테스트 먼저 커밋이 버려졌다. geo 가 "사용자 선택 뒤" 라고 적은 갈림길은 답을 받고 움직인다.

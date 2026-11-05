# 계획

## 무엇을 · 왜
- GEO 작업 뒤 직접 검색한 결과와 드러난 문제를 README 에 기록 (이름 겹침 · AI 개요 · 색인 상태 · 요청 한도)
- Bing 은 로그인이 풀려 대시보드 제출을 못 함 → IndexNow 키 파일을 올려 로그인 없이 제출 (키는 공개 파일이 원래 방식 · 비밀값 아님)

## 애매한 곳
- 일회성 제출만 · 자동 제출은 수치를 본 뒤 판단 (가정)
- 정식 재측정이 아니라 일부 검색어 확인이라 측정표에는 넣지 않음 (가정)

## 파일 계획
- README.md · docs/geo-measurement.md · docs/images/evidence/**
- apps/web/public/*.txt
- .agents/specs/0133-geo-findings/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 머지 뒤 키 파일 응답 · IndexNow 제출 결과 확인

## 허점
- 등록만으로 검색 노출이 된다고 볼 수 없음 · 사이트 이름 겹침을 작명 때 확인하지 않음

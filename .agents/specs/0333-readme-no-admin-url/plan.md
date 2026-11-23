# 계획

## 무엇을 · 왜
- README 에서 어드민 주소(admin.flapfx.com · /log · /geo) 표기를 모두 지운다. 어드민은 전용 링크로만 연다. 아키텍처 그림은 그대로 둔다.
- README 검사(site-story.test.ts)가 flapfx.com/log · /geo 표기를 요구해서, 어드민 주소가 없어야 통과하도록 바꾼다.

## 애매한 곳
- 아키텍처 · 기술 선택 본문의 "admin.flapfx.com" 도 주소 표기로 보고 지움 (가정)

## 파일 계획
- README.md
- apps/web/src/checks/site-story.test.ts
- .agents/specs/0333-readme-no-admin-url/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] README 에 admin.flapfx.com 없음 · 아키텍처 그림 그대로

## 허점
- 0331 에서 검사를 맞추려고 어드민 주소를 글자로 다시 넣었다. 검사가 요구하는 것이 바뀐 사실과 어긋나면 문서를 억지로 맞추지 말고 검사를 고쳐야 했다.

# 요청 원문

<!-- 사용자·이슈의 요청을 그대로 붙여 넣는다. 요약·정리하지 않는다. -->

(설치 에이전트가 lead 에게 전달한 메시지 원문 — 2026-11-14 16:12Z)

[설치 에이전트] 사용자가 Worker 에 키를 넣는 일을 맡겼습니다(사용자 원문: "워커에 키 넣는 거 네가 해줘"). .github/workflows/deploy-api.yml 의 PAGES_DEPLOY_HOOK 단계와 같은 방식으로 KCS_KEY · KOSIS_KEY · ECOS_KEY 를 GitHub Secrets 에서 읽어 wrangler secret put 으로 넣는 단계를 추가하세요(값이 비어 있으면 건너뜀 · 값은 printf 로 파이프 · 로그에 안 나오게). 보호 파일이라 별도 작업 번호 · PR 하나로 내고, 본문 맨 위에 '보호 파일 변경 — 사람 승인 필요'를 적으세요. harness-approved 라벨은 붙이지 마세요. 키가 이미 있어도 새 값으로 덮어써도 됩니다(사용자가 방금 발급).

(앞선 메시지 원문 — 2026-11-14 16:10Z)

[설치 에이전트] 사용자가 키 3개를 GitHub Secrets 에 KCS_KEY · KOSIS_KEY · ECOS_KEY 이름으로 넣었습니다(코드 이름과 같음). 단, 수집은 Worker 크론에서 도는데 deploy-api.yml 은 PAGES_DEPLOY_HOOK 만 wrangler secret 으로 넘깁니다. 세 키를 Worker 에 넘기는 방법(워크플로 변경은 보호 파일 → PR 에 승인 필요로 표시, 또는 사용자가 wrangler secret put 직접 실행)을 PR 본문과 최종 보고에 적으세요. 키 값은 어디에도 쓰지 마세요.

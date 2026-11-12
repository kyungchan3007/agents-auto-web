# 계획

## 무엇을 · 왜
- 평일 12:00 수출입은행 수집이 2026-11-09 ~ 12 4일 연속 HTTP 525 로 실패했습니다. 13:30 재시도는 매번 성공했습니다.
- 첫 예약(12:00)에서 HTTP 5xx 가 나면 같은 실행 안에서 30초 · 90초 뒤 다시 시도하도록 했습니다.
- 다시 시도해 성공하면 상태는 ok 로 두고, 앞선 실패 횟수를 메시지(`koreaexim retried-N: …`)로 남겨 끊김이 얼마나 이어지는지 확인합니다.
- 인증 · 형식 · 한도 오류는 다시 해도 같으므로 다시 시도하지 않습니다. 13:30 · 15:00 재시도 예약은 한 번만 요청합니다.

## 애매한 곳
- 간격 30초 · 90초 (가정) — 예약 실행은 기다리는 시간이 짧아 2분 안쪽으로 정했습니다.
- 예약 실행에서 waitUntil 대신 결과를 기다리도록 바꿨습니다 (기다리는 동안 실행이 끝나지 않게).

## 파일 계획
- apps/api/src/features/fx/collect/collect.ts
- apps/api/src/features/fx/collect/collect.test.ts
- apps/api/src/features/fx/collect/daily.ts
- apps/api/src/features/fx/collect/daily.test.ts
- apps/api/src/index.ts
- .agents/specs/0156-koreaexim-retry/**

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [ ] 다음 평일 12:00 수집에서 525 가 나면 `retried-N` 또는 "다시 시도 N회" 기록 확인

## 허점
- 근본 원인(은행 서버 쪽 TLS 끊김)은 여전히 확인하지 못했습니다. 이번 변경은 짧은 끊김인지 확인하는 실험입니다.

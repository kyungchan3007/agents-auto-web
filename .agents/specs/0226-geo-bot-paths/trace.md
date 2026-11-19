# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 확인 | schema.ts 의 방문 집계 표(day · kind · name · path · hits, 기본 키 넷)와 summary.ts 를 읽음 | 봇 이름과 경로가 한 행에 함께 남음 → 스키마 변경 없이 집계만 추가 가능 |
| 2 | 루프 | Full Loop | API 응답 계약(packages/shared)이 바뀌고 api · web 두 쪽 · test · builder 두 역할 |

## 허점

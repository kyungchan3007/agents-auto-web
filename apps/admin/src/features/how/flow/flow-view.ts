// 흐름 그림 계산 (작업 0303 · 0312 에 how-page.tsx 에서 옮김) · 순수 함수
import { HOW_NODES, type NodeId } from "../common/how";

/** 자리 정보 — 없는 id 면 첫 자리 */
export const nodeOf = (id: NodeId) => HOW_NODES.find((n) => n.id === id) ?? HOW_NODES[0]!;

/** 따라가기 단추 글 */
export const playLabel = (playing: boolean, at: number) => (playing ? "멈추기" : at >= 0 ? "처음부터" : "따라가기");

/** 단계 줄 — 지금 단계 on · 지난 단계 done */
export const stepClass = (i: number, at: number) => (i === at ? "on" : i < at ? "done" : undefined);

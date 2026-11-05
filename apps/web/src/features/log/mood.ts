// 실시간 기록 → 🐱 작업 고양이 표정 — 실제 기록이 들어올 때만 바뀜 (지어낸 움직임 없음 · docs/design.md 🐱 표)
import type { Mood } from "@hav/ui/three/worker-cat";
import type { LiveStatus } from "./status";

export function moodOf(status: LiveStatus): Mood {
  if (status.state === "none") return "neutral";
  if (status.state === "idle") return "sleeping";
  const { kind, ok } = status.last;
  switch (kind) {
    case "edit":
      return "typing";
    case "read":
    case "search":
      return "looking";
    case "browser":
      return "browsing";
    case "blocked":
      return "startled";
    case "gate":
      return ok === true ? "happy" : ok === false ? "sad" : "working";
    case "commit":
    case "pr":
      return "happy";
    case "run":
    case "test":
    case "build":
    case "install":
      return ok === false ? "sad" : "working";
    default:
      return "neutral";
  }
}

/** 화면 읽기 프로그램용 한 줄 */
export const MOOD_TEXT: Record<Mood, string> = {
  typing: "고양이가 키보드 앞에서 작업하는 모습",
  looking: "고양이가 화면을 살펴보는 모습",
  working: "고양이가 대기하는 모습",
  browsing: "고양이가 작은 화면을 확인하는 모습",
  happy: "작업복을 입은 고양이가 작업을 마친 모습",
  startled: "고양이가 놀란 모습",
  sad: "고양이가 등을 돌리고 앉은 모습",
  sleeping: "고양이가 잠든 모습",
  neutral: "고양이가 앉아서 대기하는 모습",
  walking: "고양이가 다음 책상으로 이동하는 모습",
  worried: "고양이가 걱정하는 모습",
};

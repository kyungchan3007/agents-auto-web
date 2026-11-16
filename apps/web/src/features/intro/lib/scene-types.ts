// 인트로 장면(scene.ts)과 흐름(훅)이 주고받는 값의 모양 — 타입만 (three · React 없음 · 작업 0185)
// scene.ts 는 three 를 가져와 무거워서 훅이 정적으로 가져오지 못함 — 훅은 이 파일의 타입만 씀 (장면 본체는 use-intro-scene 이 열릴 때 동적으로 불러옴)

export type IntroStep = 1 | 2 | 3 | 4 | 5;

/** 흐름(훅)이 바꾸고 장면이 매 프레임 읽는 값 */
export type SceneState = {
  /** 단계 — 1~3 은 카메라 · 직원이 그 자리로 · 4 는 이륙(flight) · 5 는 홈으로 */
  step: IntroStep;
  /** 이륙 진행값 (0.35 ~ 1) · 이륙 중이 아니면 -1 — 장면이 목표(flightGoal)로 부드럽게 따라감 */
  flight: number;
  /** 이륙 목표값 — 스크롤이 올림 (LIFT 까지) · 뜬 뒤(auto)에는 장면이 스스로 1 까지 올림 */
  flightGoal: number;
  /** 바퀴가 뜬 뒤 자동 진행 */
  auto: boolean;
  /** 창문 전환 첫 단계 — 카메라가 비행기로 다가감 */
  zoomIn: boolean;
  /** 장면을 그리지 않음 (창문 전환 뒤 · 건너뛰기) */
  hidden: boolean;
};

export type SceneApi = {
  state: SceneState;
  /** 움직임 줄이기 — 구름 · 차 · 사람 · 카메라 이동을 멈추고 바로 목표 자리로 */
  still: boolean;
  /** 매 프레임 — 직원 머리 위 화면 좌표(말풍선) · 이륙 진행값(진행 미터) */
  onFrame?: (info: { flight: number; staff: { x: number; y: number } | null }) => void;
  /** 바퀴가 뜬 순간 (flight ≥ LIFT) — 흐름이 auto 를 켬 */
  onLift?: () => void;
  /** 뜬 뒤 거의 끝까지 올라감 (flight ≥ 0.97) — 흐름이 창문 전환을 시작함 */
  onTakeoffEnd?: () => void;
  /** 그래픽 가속이 없어(WebGL 없음 · 소프트웨어 렌더) 3D 장면 없이 가벼운 배경으로 진행함 — 이때 이륙은 훅이 직접 굴림 (장면 본체는 불러오지 않음) */
  onLite?: () => void;
  /** 모델을 모두 불러와 장면이 그려질 준비가 됨 */
  onReady?: () => void;
};


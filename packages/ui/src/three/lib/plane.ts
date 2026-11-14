// ✈️ 비행기 — 코드로 만든 도형 목록 · 움직임 계산 (순수 · 테스트 있음 · 외부 모델 파일 없음 · 작업 0164)
//   objects/plane.tsx 는 이 목록을 그리기만 함 · 기체는 +z 가 앞 · 단위는 장면 단위 (카메라 거리 4.5 쯤)
export type PlanePart = {
  name: string;
  shape: "box" | "cylinder" | "cone" | "sphere";
  position: [number, number, number];
  /** box [x, y, z] · cylinder [위 반지름, 아래 반지름, 높이] · cone [반지름, 높이, 사용 안 함] · sphere [반지름, 사용 안 함, 사용 안 함] */
  size: [number, number, number];
  rotation?: [number, number, number];
};

const HALF_PI = Math.PI / 2;

export const PLANE_PARTS: readonly PlanePart[] = [
  { name: "fuselage", shape: "cylinder", position: [0, 0, 0], size: [0.24, 0.24, 2.2], rotation: [HALF_PI, 0, 0] },
  { name: "nose", shape: "cone", position: [0, 0, 1.45], size: [0.24, 0.7, 1], rotation: [HALF_PI, 0, 0] },
  { name: "tail-cone", shape: "cone", position: [0, 0.04, -1.45], size: [0.24, 0.7, 1], rotation: [-HALF_PI, 0, 0] },
  { name: "wing-left", shape: "box", position: [-0.85, -0.04, 0.1], size: [1.5, 0.05, 0.55], rotation: [0, -0.25, 0.06] },
  { name: "wing-right", shape: "box", position: [0.85, -0.04, 0.1], size: [1.5, 0.05, 0.55], rotation: [0, 0.25, -0.06] },
  { name: "tail-fin", shape: "box", position: [0, 0.4, -1.3], size: [0.05, 0.6, 0.45], rotation: [-0.25, 0, 0] },
  { name: "tail-wing-left", shape: "box", position: [-0.38, 0.05, -1.3], size: [0.65, 0.04, 0.3] },
  { name: "tail-wing-right", shape: "box", position: [0.38, 0.05, -1.3], size: [0.65, 0.04, 0.3] },
  { name: "engine-left", shape: "cylinder", position: [-0.7, -0.2, 0.35], size: [0.1, 0.1, 0.45], rotation: [HALF_PI, 0, 0] },
  { name: "engine-right", shape: "cylinder", position: [0.7, -0.2, 0.35], size: [0.1, 0.1, 0.45], rotation: [HALF_PI, 0, 0] },
];

const BOB = 0.12; // 위아래 흔들림 (한쪽 최대 0.3 보다 작게)
const ROLL = 0.18;
const PITCH = 0.06;
const YAW = 0.3;

/**
 * 시간 t(초)에 따른 기체 위치 · 기울기 — 천천히 떠다니며 좌우로 살짝 돎
 * animate=false(움직임 줄이기)면 t 와 상관없이 t=0 의 값 (멈춘 그림)
 */
export function planeMotion(t: number, animate: boolean): { position: [number, number, number]; rotation: [number, number, number] } {
  // 아주 큰 t 에서 정밀도가 떨어지지 않게 주기(약 63초)로 접음
  const s = animate && Number.isFinite(t) ? t % (Math.PI * 20) : 0;
  return {
    position: [0, Math.sin(s * 0.9) * BOB, 0],
    rotation: [Math.sin(s * 0.7) * PITCH, -0.6 + Math.sin(s * 0.45) * YAW, Math.sin(s * 0.9 + 1) * ROLL],
  };
}

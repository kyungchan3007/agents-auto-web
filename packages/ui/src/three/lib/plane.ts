// ✈️ 비행기 — 모델 크기 맞추기 · 조명 값 · 움직임 계산 (순수 · 테스트 있음 · 작업 0164)
//   기체는 glTF 모델 파일(사이트가 url 로 넘김)을 objects/plane.tsx 가 불러와 그림 · 여기는 숫자만
//   모델 출처: "Airplane" by Poly by Google · CC-BY 4.0 (화면에 출처 표시 · apps/web travel-price/lib/plane-model.ts)

/** 모델의 가장 긴 변을 이 크기로 (시험판과 같은 값) */
export const PLANE_TARGET_SIZE = 1.6;

export type Vec3 = [number, number, number];
export type Box3Like = { min: Vec3; max: Vec3 };

/**
 * 크기 · 가운데 맞추기 — 모델 좌표 p 에 p * scale + offset 을 하면 가장 긴 변 = target · 상자 중심 = 원점
 * 상자가 점 하나(크기 0)거나 숫자가 유한하지 않으면 scale 1 · offset 0 (NaN · Infinity 를 만들지 않음)
 */
export function fitModel(box: Box3Like, target = PLANE_TARGET_SIZE): { scale: number; offset: Vec3 } {
  const all = [...box.min, ...box.max];
  const size = box.max.map((v, i) => v - box.min[i]);
  const longest = Math.max(...size);
  if (!all.every(Number.isFinite) || !(longest > 0) || !Number.isFinite(target)) return { scale: 1, offset: [0, 0, 0] };
  const scale = target / longest;
  return { scale, offset: box.min.map((lo, i) => -((lo + box.max[i]) / 2) * scale) as Vec3 };
}

/** 사이트 오로라 점광 3개 — 청록 · 보라 · 분홍 (색의 원본은 tokens.css · 시험판 값) */
export const PLANE_LIGHTS: readonly { color: string; position: Vec3; intensity: number }[] = [
  { color: "#4ff0e0", position: [-2.5, 1.5, 2], intensity: 30 },
  { color: "#9c8cff", position: [2.5, 2, 1], intensity: 25 },
  { color: "#ff8ad8", position: [0, -1.5, 2.5], intensity: 20 },
];

const BOB = 0.12; // 위아래 흔들림 (한쪽 최대 0.3 보다 작게)
const ROLL = 0.18;
const PITCH = 0.06;
const YAW = 0.3;

/**
 * 시간 t(초)에 따른 기체 위치 · 기울기 — 천천히 떠다니며 좌우로 살짝 돎
 * animate=false(움직임 줄이기)면 t 와 상관없이 t=0 의 값 (멈춘 그림)
 */
export function planeMotion(t: number, animate: boolean): { position: Vec3; rotation: Vec3 } {
  // 아주 큰 t 에서 정밀도가 떨어지지 않게 주기(약 63초)로 접음
  const s = animate && Number.isFinite(t) ? t % (Math.PI * 20) : 0;
  return {
    position: [0, Math.sin(s * 0.9) * BOB, 0],
    rotation: [Math.sin(s * 0.7) * PITCH, Math.sin(s * 0.45) * YAW, Math.sin(s * 0.9 + 1) * ROLL],
  };
}

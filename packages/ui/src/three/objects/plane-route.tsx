"use client";

// ✈️ 그래프 선을 따라 나는 비행기 — 홈 "여행 타이밍" (작업 0169) · 그래프(SVG) 위에 같은 크기로 겹쳐 놓는 투명한 3D 캔버스
// 비행기 모델 · 재질 · 조명은 objects/plane.tsx · lib/plane.ts 와 같은 것(생김새 그대로) — 여기는 선 위 위치 · 방향(lib/plane-route.ts)만
// points = 그래프 선의 점들 (1월 → 12월 · 캔버스 칸 안 0~1 좌표 · x 오른쪽 · y 위쪽) · 칸 크기가 바뀌면(화면 크기) R3F 가 크기를 다시 재서 선에 다시 맞춤
// 움직임 줄이기면 stopIndex 번째 점(가장 싼 달)에 멈춤 · 화면 밖이면 그리지 않음(Stage) · 어디까지나 꾸밈이라 그래프의 숫자는 글자로도 있음
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import type { Group } from "three";
import { PLANE_LIGHTS, PLANE_TARGET_SIZE } from "../lib/plane";
import { type RoutePoint, progressAt, routePosition, routeProgress } from "../lib/plane-route";
import { Stage } from "../scene/stage";
import { RoomLight, usePlaneObject, usePlaneTheme } from "./plane";

export type PlaneRouteProps = { url: string; points: RoutePoint[]; stopIndex?: number; className?: string; label?: string };

// 정면 카메라 — z=0 평면에서 칸 높이 = 2 · 거리 · tan(fov/2) 이라 0~1 좌표를 장면 좌표로 바로 바꿈
const CAMERA = { position: [0, 0, 10] as [number, number, number], fov: 20 };
const HALF_H = CAMERA.position[2] * Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);
/** 그래프 위에서 보이는 비행기 크기 (장면 단위 · 칸 높이 약 3.5) */
const ROUTE_PLANE_SIZE = 0.9;
/** 모델은 코가 +z · 위가 +y — 코를 +x 로 돌리고(y축 90°) 위쪽이 보이게 조금 눕힘(x축 롤) */
const MODEL_ROTATION: [number, number, number] = [0.75, Math.PI / 2, 0];

function Flight({ url, points, stopIndex, animate }: { url: string; points: RoutePoint[]; stopIndex: number; animate: boolean }) {
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const theme = usePlaneTheme();
  const { object, fit } = usePlaneObject(url, theme, ROUTE_PLANE_SIZE);
  const body = useRef<Group>(null);
  const lights = useRef<Group>(null);

  // 0~1 칸 좌표 → 장면 좌표 (칸 비율이 바뀌면 다시 계산)
  const world = useMemo(() => points.map((p) => ({ x: (p.x - 0.5) * 2 * HALF_H * aspect, y: (p.y - 0.5) * 2 * HALF_H })), [points, aspect]);
  const stop = progressAt(world, stopIndex) ?? 0;

  useFrame(({ clock }) => {
    const at = routePosition(world, routeProgress(clock.elapsedTime, animate, stop));
    if (!at) return;
    body.current?.position.set(at.x, at.y, 0);
    // 가파른 구간에서도 뒤집히지 않게 기울기를 제한
    body.current?.rotation.set(0, 0, Math.max(-1.1, Math.min(1.1, at.angle)));
    lights.current?.position.set(at.x, at.y, 0); // 조명은 비행기를 따라 다님 (선 위 어디서나 같은 빛)
  });

  const k = ROUTE_PLANE_SIZE / PLANE_TARGET_SIZE; // 비행기가 작아진 만큼 조명 거리 · 세기를 줄여 같은 빛
  return (
    <>
      <group ref={lights}>
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        {PLANE_LIGHTS.map((l) => (
          <pointLight key={l.color} color={l.color} position={[l.position[0] * k, l.position[1] * k, l.position[2] * k]} intensity={l.intensity * k ** 1.6} decay={1.6} />
        ))}
      </group>
      <group ref={body}>
        <group rotation={MODEL_ROTATION}>
          <primitive object={object} scale={fit.scale} position={fit.offset} />
        </group>
      </group>
    </>
  );
}

export default function PlaneRoute({ url, points, stopIndex = 0, className = "", label }: PlaneRouteProps) {
  return (
    <Stage className={className} camera={CAMERA} label={label}>
      {(animate) => (
        <>
          <RoomLight />
          <Suspense fallback={null}>
            <Flight url={url} points={points} stopIndex={stopIndex} animate={animate} />
          </Suspense>
        </>
      )}
    </Stage>
  );
}

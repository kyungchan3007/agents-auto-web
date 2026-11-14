"use client";

// ✈️ 비행기 — 여행 물가 (docs/design.md three.js 표) · 코드로 만든 도형만 (모델 파일 없음) · 천천히 떠다님
// 움직임 줄이기 설정이면 멈춘 그림 · 화면 밖이면 그리지 않음 (Stage) · 도형 목록 · 움직임은 lib/plane.ts
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Group } from "three";
import { PLANE_PARTS, type PlanePart, planeMotion } from "../lib/plane";
import { Stage, tokenColor } from "../scene/stage";

export type PlaneProps = { className?: string; label?: string };

function Geometry({ part }: { part: PlanePart }) {
  const [a, b, c] = part.size;
  switch (part.shape) {
    case "box":
      return <boxGeometry args={[a, b, c]} />;
    case "cylinder":
      return <cylinderGeometry args={[a, b, c, 24]} />;
    case "cone":
      return <coneGeometry args={[a, b, 24]} />;
    case "sphere":
      return <sphereGeometry args={[a, 24, 16]} />;
  }
}

function Scene({ animate }: { animate: boolean }) {
  const plane = useRef<Group>(null);
  const colors = useMemo(() => ({ body: new Color("#f4f6fa"), accent: new Color(tokenColor("--hav-accent", "#4ff0e0")), dark: new Color("#5b6475") }), []);

  useFrame(({ clock }) => {
    const p = plane.current;
    if (!p) return;
    const m = planeMotion(clock.elapsedTime, animate);
    p.position.set(...m.position);
    p.rotation.set(...m.rotation);
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={1.6} />
      <pointLight position={[-3, 1, 2]} intensity={5} color={tokenColor("--hav-aurora-3", "#ff8ad8")} />
      <group ref={plane}>
        {PLANE_PARTS.map((part) => (
          <mesh key={part.name} position={part.position} rotation={part.rotation ?? [0, 0, 0]}>
            <Geometry part={part} />
            <meshStandardMaterial
              color={part.name.startsWith("tail-fin") || part.name.startsWith("wing") ? colors.accent : part.name.startsWith("engine") ? colors.dark : colors.body}
              metalness={0.25}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function Plane({ className = "", label }: PlaneProps) {
  return (
    <Stage className={className} camera={{ position: [0, 0.6, 4.6], fov: 38 }} label={label}>
      {(animate) => <Scene animate={animate} />}
    </Stage>
  );
}

"use client";

// ✈️ 비행기 — 여행 물가 (docs/design.md three.js 표) · glTF 모델 파일을 url 로 받아 그림 (지구 사진과 같은 방식 · 주소는 사이트가 넘김)
// 크기 · 가운데 맞추기 · 조명 값은 lib/plane.ts · 환경 조명은 three RoomEnvironment (외부 HDR 을 받지 않음) + 오로라 점광 3개
// 천천히 떠다님 · 움직임 줄이기면 멈춘 그림 · 화면 밖이면 그리지 않음 (Stage)
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Box3, type Group, PMREMGenerator, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PLANE_LIGHTS, fitModel, planeMotion } from "../lib/plane";
import { Stage } from "../scene/stage";

export type PlaneProps = { url: string; className?: string; label?: string };

/** 장면 환경 조명 — RoomEnvironment 를 한 번 굽고 내려갈 때 지움 */
function RoomLight() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = target.texture;
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Model({ url, animate }: { url: string; animate: boolean }) {
  const { scene: model } = useGLTF(url);
  const plane = useRef<Group>(null);
  // 복제본을 써서 같은 파일을 여러 곳에서 써도 서로 영향 없게 · 크기 · 가운데는 한 번만 계산
  const { object, fit } = useMemo(() => {
    const object = model.clone(true);
    const box = new Box3().setFromObject(object);
    const lo = box.min.toArray() as [number, number, number];
    const hi = box.max.toArray() as [number, number, number];
    return { object, fit: fitModel({ min: lo, max: hi }) };
  }, [model]);

  useFrame(({ clock }) => {
    const p = plane.current;
    if (!p) return;
    const m = planeMotion(clock.elapsedTime, animate);
    p.position.set(...m.position);
    p.rotation.set(...m.rotation);
  });

  return (
    <group ref={plane}>
      <primitive object={object} scale={fit.scale} position={new Vector3(...fit.offset)} />
    </group>
  );
}

function Scene({ url, animate }: { url: string; animate: boolean }) {
  return (
    <>
      <RoomLight />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      {PLANE_LIGHTS.map((l) => (
        <pointLight key={l.color} color={l.color} position={l.position} intensity={l.intensity} decay={1.6} />
      ))}
      <Suspense fallback={null}>
        <Model url={url} animate={animate} />
      </Suspense>
    </>
  );
}

export default function Plane({ url, className = "", label }: PlaneProps) {
  return (
    <Stage className={className} camera={{ position: [2.2, 0.8, 1.8], fov: 35 }} label={label}>
      {(animate) => <Scene url={url} animate={animate} />}
    </Stage>
  );
}

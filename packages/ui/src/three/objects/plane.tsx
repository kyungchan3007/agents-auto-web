"use client";

// ✈️ 비행기 — 여행 물가 (docs/design.md three.js 표) · glTF 모델 파일을 url 로 받아 그림 (지구 사진과 같은 방식 · 주소는 사이트가 넘김)
// 크기 · 가운데 맞추기 · 조명 · 배경판 · 그림자 값은 lib/plane.ts · 환경 조명은 three RoomEnvironment (외부 HDR 을 받지 않음) + 오로라 점광 3개
// 밝은 화면(data-surface="light")에서는 몸체 색을 옅은 회청색으로 · 배경판 · 그림자를 진하게 — 테마가 바뀌면 다시 반영
// 천천히 떠다님 · 움직임 줄이기면 멈춘 그림 · 화면 밖이면 그리지 않음 (Stage)
import { ContactShadows, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Box3, CanvasTexture, Color, type Group, type Material, type Mesh, PMREMGenerator, SRGBColorSpace, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PLANE_BACKDROP, PLANE_LIGHTS, PLANE_SHADOW, type PlaneTheme, fitModel, planeMotion, planeTint } from "../lib/plane";
import { Stage } from "../scene/stage";

export type PlaneProps = { url: string; className?: string; label?: string };

/** 사이트의 테마 감지 방식 그대로 — 가장 가까운 [data-surface] 가 light 면 밝은 화면 · 바뀌면 다시 읽음 */
function usePlaneTheme(): PlaneTheme {
  const dom = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  const [theme, setTheme] = useState<PlaneTheme>("dark");
  useEffect(() => {
    const host = dom.closest("[data-surface]");
    const update = () => {
      setTheme(host?.getAttribute("data-surface") === "light" ? "light" : "dark");
      invalidate();
    };
    update();
    if (!host) return;
    const mo = new MutationObserver(update);
    mo.observe(host, { attributes: true, attributeFilter: ["data-surface"] });
    return () => mo.disconnect();
  }, [dom, invalidate]);
  return theme;
}

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

/** 비행기 뒤 둥근 배경판 — 오로라 색 그라데이션 · 가장자리로 갈수록 투명 · 항상 카메라를 봄 */
function Backdrop({ theme }: { theme: PlaneTheme }) {
  const mesh = useRef<Mesh>(null);
  const texture = useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const lin = g.createLinearGradient(0, size, size, 0);
    PLANE_BACKDROP.colors.forEach((col, i) => lin.addColorStop(i / 2, col));
    g.fillStyle = lin;
    g.fillRect(0, 0, size, size);
    // 둥글게 · 가장자리는 부드럽게 사라짐
    g.globalCompositeOperation = "destination-in";
    const rad = g.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size / 2);
    rad.addColorStop(0, "rgba(0,0,0,1)");
    rad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, size, size);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(({ camera }) => mesh.current?.lookAt(camera.position));
  return (
    <mesh ref={mesh} position={[0, 0, -1.2]} renderOrder={-1}>
      <circleGeometry args={[1.9, 48]} />
      <meshBasicMaterial map={texture} transparent opacity={PLANE_BACKDROP.opacity[theme]} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Model({ url, animate, theme }: { url: string; animate: boolean; theme: PlaneTheme }) {
  const { scene: model } = useGLTF(url);
  const plane = useRef<Group>(null);
  // 복제본을 써서 같은 파일을 여러 곳에서 써도 서로 영향 없게 (재질도 복제) · 크기 · 가운데는 한 번만 계산
  const { object, fit, materials } = useMemo(() => {
    const object = model.clone(true);
    const materials: { m: Material & { color?: Color }; base: Color }[] = [];
    object.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const m = (mesh.material as Material & { color?: Color }).clone() as Material & { color?: Color };
      mesh.material = m;
      if (m.color) materials.push({ m, base: m.color.clone() });
    });
    const box = new Box3().setFromObject(object);
    return { object, fit: fitModel({ min: box.min.toArray() as [number, number, number], max: box.max.toArray() as [number, number, number] }), materials };
  }, [model]);

  // 밝은 화면이면 몸체 색에 옅은 회청색을 곱함 (원래 색은 보관해 두고 테마가 바뀌면 다시 계산)
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const [r, g, b] = planeTint(theme);
    for (const { m, base } of materials) m.color?.copy(base).multiply(new Color(r, g, b));
    invalidate();
  }, [theme, materials, invalidate]);

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
  const theme = usePlaneTheme();
  return (
    <>
      <RoomLight />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      {PLANE_LIGHTS.map((l) => (
        <pointLight key={l.color} color={l.color} position={l.position} intensity={l.intensity} decay={1.6} />
      ))}
      <Backdrop theme={theme} />
      {/* 바닥 그림자 — 밝은 배경에서 비행기가 떠 보이게 */}
      <ContactShadows position={[0, -1.15, 0]} opacity={PLANE_SHADOW.opacity[theme]} blur={PLANE_SHADOW.blur} scale={PLANE_SHADOW.scale} far={2.5} resolution={256} color="#1d1d1f" />
      <Suspense fallback={null}>
        <Model url={url} animate={animate} theme={theme} />
      </Suspense>
    </>
  );
}

export default function Plane({ url, className = "", label }: PlaneProps) {
  return (
    <Stage className={className} camera={{ position: [2.5, 0.9, 2.1], fov: 35 }} label={label}>
      {(animate) => <Scene url={url} animate={animate} />}
    </Stage>
  );
}

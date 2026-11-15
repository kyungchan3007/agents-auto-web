"use client";

// 자리 옮기기 장면 — 책상 N개가 한 줄로 · 지금 자리 위에 표식(떠 있는 다이아몬드)이 미끄러져 옮겨 감 (작업 0168: 고양이를 빼고 코드 도형 표식으로)
// 무슨 단계인지 · 이름은 쓰는 쪽이 정함 (디자인 시스템은 자리 번호만 받음)
import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type Group, type PerspectiveCamera } from "three";
import { Stage, tokenColor } from "../scene/stage";

export type StationsProps = {
  count: number;
  /** 표식이 갈 자리 (0부터) */
  active: number;
  /** 앞에서부터 끝난 자리 수 */
  done: number;
  className?: string;
  label?: string;
};

// 한 자리 너비 — 카메라가 화면 비율에 맞춰 물러나서, 자리 N개가 늘 화면 너비를 N등분 (아래 HTML 이름 칸과 줄이 맞음)
const GAP = 2;
const FOV = 24; // 좁은 화각 = 원근 왜곡이 적음
const SPEED = 1.6; // 초당 거리
const xOf = (i: number, n: number) => (i - (n - 1) / 2) * GAP;

function Desk({ x, state }: { x: number; state: "done" | "active" | "wait" }) {
  const c = useMemo(
    () => ({
      top: new Color(tokenColor("--hav-surface-2", "#1d1d1f")).multiplyScalar(1.9),
      leg: new Color(tokenColor("--hav-line", "#424245")),
      screen: new Color(
        state === "active" ? tokenColor("--hav-accent", "#4ff0e0") : state === "done" ? tokenColor("--hav-3d-aurora-2", "#9c8cff") : tokenColor("--hav-line", "#424245"),
      ),
    }),
    [state],
  );
  return (
    <group position={[x, -0.35, 0]}>
      <RoundedBox args={[1.25, 0.08, 0.62]} radius={0.03} position={[0, 0.42, 0]}>
        <meshStandardMaterial color={c.top} roughness={0.6} />
      </RoundedBox>
      {[-0.52, 0.52].flatMap((lx) =>
        [-0.22, 0.22].map((lz) => (
          <mesh key={`${lx}${lz}`} position={[lx, 0.06, lz]}>
            <boxGeometry args={[0.05, 0.7, 0.05]} />
            <meshStandardMaterial color={c.leg} />
          </mesh>
        )),
      )}
      {/* 작은 모니터 — 지금 자리는 오로라 · 끝난 자리는 보라 · 기다리는 자리는 회색 */}
      <group position={[0, 0.72, -0.12]}>
        <RoundedBox args={[0.62, 0.42, 0.05]} radius={0.03}>
          <meshStandardMaterial color={c.leg} />
        </RoundedBox>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.54, 0.34]} />
          <meshBasicMaterial color={c.screen} transparent opacity={state === "wait" ? 0.35 : 0.9} />
        </mesh>
        <mesh position={[0, -0.27, 0]}>
          <boxGeometry args={[0.06, 0.12, 0.05]} />
          <meshStandardMaterial color={c.leg} />
        </mesh>
      </group>
      {/* 끝난 자리: 책상 위 작은 체크 상자 */}
      {state === "done" && (
        <mesh position={[0.42, 0.53, 0.12]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.16, 0.14, 0.16]} />
          <meshStandardMaterial color={c.screen} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

/** 지금 자리 위 표식 — 자리가 바뀌면 옆으로 미끄러짐 (움직임 줄이기면 바로 그 자리) · 천천히 위아래 */
function Marker({ target, animate }: { target: number; animate: boolean }) {
  const g = useRef<Group>(null);
  const color = useMemo(() => new Color(tokenColor("--hav-sun", "#f7c548")), []);
  useFrame(({ clock }, dt) => {
    const m = g.current;
    if (!m) return;
    const d = target - m.position.x;
    m.position.x += animate ? Math.sign(d) * Math.min(Math.abs(d), SPEED * Math.min(dt, 0.05)) : d;
    m.position.y = 1.55 + (animate ? Math.sin(clock.elapsedTime * 2) * 0.06 : 0);
    m.rotation.y = animate ? clock.elapsedTime * 1.2 : 0;
  });
  return (
    <group ref={g} position={[target, 1.55, 0]}>
      <mesh scale={[0.5, 0.7, 0.5]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** z=0 에서 보이는 너비가 count × GAP 이 되는 카메라 거리 */
function useFitDistance(count: number) {
  const { width, height } = useThree((t) => t.size);
  const aspect = width / Math.max(1, height);
  return Math.max(4, (count * GAP) / (aspect * 2 * Math.tan(((FOV / 2) * Math.PI) / 180)));
}

/** 화면 비율이 바뀌면 카메라 거리를 다시 잡음 */
function FitCamera({ dist }: { dist: number }) {
  const camera = useThree((t) => t.camera) as PerspectiveCamera;
  useEffect(() => {
    camera.position.set(0, 0.9, dist);
    camera.lookAt(0, 0.15, 0);
    camera.updateProjectionMatrix();
  }, [camera, dist]);
  return null;
}

function Scene({ count, active, done, animate }: Omit<StationsProps, "className" | "label"> & { animate: boolean }) {
  const dist = useFitDistance(count);
  return (
    <>
      <FitCamera dist={dist} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 5]} intensity={1.4} />
      <pointLight position={[-3, 2, 2]} intensity={5} color={tokenColor("--hav-3d-aurora-3", "#ff8ad8")} />
      {Array.from({ length: count }, (_, i) => (
        <Desk key={i} x={xOf(i, count)} state={i < done ? "done" : i === active ? "active" : "wait"} />
      ))}
      <Marker target={xOf(Math.max(0, Math.min(active, count - 1)), count)} animate={animate} />
    </>
  );
}

export default function Stations({ className = "", label, ...rest }: StationsProps) {
  return (
    <Stage className={className} camera={{ position: [0, 0.9, 6.6], fov: FOV }} label={label}>
      {(animate) => <Scene {...rest} animate={animate} />}
    </Stage>
  );
}

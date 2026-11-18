// 공항 인트로 3D 장면 — three 만 쓰는 모듈 (React 없음 · 작업 0185 · 확정 시안 intro3.src.html 을 옮김)
//   바다 위 섬 · 하늘 · 구름 · 터미널 · 관제탑 · 활주로 · Kenney 도시(CC0) · 차 · 사람 · 비행기(Poly by Google · CC-BY) · 직원 이동 · 카메라 이동
//   mountIntroScene(el, api) 가 정리 함수를 돌려줌 · 흐름(단계 · 입력 · 스크롤)은 hooks/use-intro.ts 가 api.state 를 바꾸고 장면이 매 프레임 읽음
//   모델은 /models/intro/... 를 그대로 불러옴 (apps/web/scripts/make-intro-assets.mjs 가 만든 파일 · 시안의 data: 주소 우회는 쓰지 않음)
//   비행기 · 카메라 경로 값과 진행 계산은 lib/flight.ts (순수 함수) — 여기서는 가져다 씀
import { PLANE_MODEL_URL } from "@hav/shared/travel";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import type { IntroStep, SceneApi } from "./scene-types";
import { FLIGHT_START, type Shot, type Vec3, LIFT, advance, autoGoal, cameraAt, liftReached, planeAt, windowDue } from "./flight";

/** 3D 장면의 색은 CSS 변수를 못 읽는 그림판(canvas)에 칠하므로 브라우저에서 토큰(packages/ui/src/tokens.css)의 값을 읽어 씀 — 색 값은 토큰 한 곳 (작업 0215) */
const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// ── 흐름과 주고받는 값의 모양은 lib/scene-types.ts ──
// ── 경로 값은 lib/flight.ts (순수 함수 · 테스트 있음) — 여기서는 가져다 씀 ──
type Vec = Vec3;
type Cam = Shot;

// 1~3단계 카메라 (직원 · 환전소 · 게이트)
const SHOT: Record<1 | 2 | 3, Cam> = {
  1: { target: [-8, 2, -11], zoom: 2.1, yaw: 165 },
  2: { target: [-6, 3, -2], zoom: 1.45, yaw: 140 },
  3: { target: [-6, 0, 0], zoom: 2.6, yaw: 205 },
};
// 안내 직원이 서는 자리
const STAFF_SPOT: Record<1 | 2 | 3, { pos: Vec; rot: number }> = {
  1: { pos: [-8, 0.08, -14.1], rot: Math.PI / 2 + 0.5 },
  2: { pos: [-5.8, 0.08, -14.1], rot: Math.PI / 2 + 0.7 },
  3: { pos: [-8.2, 0, -1.4], rot: 2.7 },
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec, b: Vec, t: number): Vec => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// ── 색 — 홈 색 체계: 바탕은 하늘 종이 · 모형은 흰색 · 포인트는 남색 · 노랑 하나 ──────
const C = {
  grass: 0xbfdcd3, field: 0xb2d4ca, field2: 0xcce4dd, apron: 0xf2f7f6, runway: 0xb9c6d4, taxi: 0xcad4de, road: 0xdde4ea, line: 0xffffff,
  yellow: 0xf7c548, navy: 0x16246e, blue: 0x2438a8, teal: 0x5fb3a3, tealDark: 0x3f9a8a, red: 0x2438a8, glass: 0xa9bed8, cream: 0xffffff,
  steel: 0xe3e8ee, trunk: 0xc9c2b8, wall: 0xfbfcfd,
};

const MODEL_BASE = "/models/intro";
const CAR_KINDS = ["sedan", "taxi", "suv", "van", "sedan", "delivery", "suv", "truck"];
const NEAR = ["building-a", "building-b", "building-c", "building-d", "building-e", "building-f", "building-g", "building-h", "building-skyscraper-a", "building-skyscraper-b", "building-skyscraper-c", "building-skyscraper-d", "building-skyscraper-e"];
const FAR = ["low-detail-building-a", "low-detail-building-b", "low-detail-building-c", "low-detail-building-d", "low-detail-building-e", "low-detail-building-f", "low-detail-building-g", "low-detail-building-h", "low-detail-building-wide-a", "low-detail-building-wide-b"];

type Anim = "idle" | "walk";
type Person = { group: THREE.Group; kind: string; bag: boolean; anim: Anim; cur: Anim | null; mixer: THREE.AnimationMixer | null; actions: Partial<Record<Anim, THREE.AnimationAction>> };

/** 크기 맞추기 — 높이(h) 또는 가장 긴 수평 길이(len)를 맞추고 바닥을 y=0 · 가운데를 원점으로 · 앞(+z)을 +x 로 */
function fit(obj: THREE.Object3D, size: { h?: number; len?: number }): THREE.Group {
  const box3 = new THREE.Box3().setFromObject(obj);
  const sz = box3.getSize(new THREE.Vector3());
  const c = box3.getCenter(new THREE.Vector3());
  const k = size.h ? size.h / sz.y : (size.len ?? 1) / Math.max(sz.x, sz.z);
  obj.scale.setScalar(k);
  obj.position.set(-c.x * k, -box3.min.y * k, -c.z * k);
  const turn = new THREE.Group();
  turn.rotation.y = Math.PI / 2;
  turn.add(obj);
  return shade(turn);
}
function shade<T extends THREE.Object3D>(o: T, cast = true): T {
  o.traverse((c) => {
    c.castShadow = cast;
    c.receiveShadow = true;
  });
  return o;
}

/** 인트로 장면을 el 안에 그리고 정리 함수를 돌려줌 */
export function mountIntroScene(el: HTMLElement, api: SceneApi): () => void {
  const { state, still } = api;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  let alive = true;

  { // 하늘 — 홈 첫 화면 사진의 하늘처럼 위는 맑은 하늘색 · 아래는 하늘 종이색
    const c = document.createElement("canvas");
    c.width = 2;
    c.height = 256;
    const g = c.getContext("2d");
    if (g) {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, token("--hav-sky-top"));
      gr.addColorStop(0.45, token("--hav-sky-mid"));
      gr.addColorStop(1, token("--hav-surface"));
      g.fillStyle = gr;
      g.fillRect(0, 0, 2, 256);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
    disposables.push(t);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.35;
  scene.add(new THREE.HemisphereLight(0xf2fbff, 0xb9d6cf, 0.85));
  const sun = new THREE.DirectionalLight(0xfff3e2, 1.7);
  sun.position.set(-40, 60, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 90, bottom: -90, far: 260 });
  scene.add(sun);

  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (c: number, glow = false) => {
    const k = `${c}-${glow}`;
    let m = mats.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0, ...(glow ? { emissive: c, emissiveIntensity: 0.8 } : {}) });
      mats.set(k, m);
    }
    return m;
  };
  const box = (w: number, h: number, d: number, c: number, x: number, y: number, z: number, glow = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, glow));
    m.position.set(x, y + h / 2, z);
    return shade(m);
  };
  const cyl = (rt: number, rb: number, h: number, c: number, x: number, y: number, z: number, seg = 20) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c));
    m.position.set(x, y + h / 2, z);
    return shade(m);
  };
  const flat = (w: number, d: number, c: number, x: number, z: number, y = 0.01) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    return m;
  };
  const moving: ((t: number) => void)[] = [];

  // 바다 위 섬 — 공항과 도시는 섬 위 (영종도처럼) · 바다색은 홈 사진 하늘색 계열
  scene.add(flat(600, 600, 0x93c9d6, 0, 0, -0.3));
  {
    const sh = new THREE.Shape();
    const x0 = -95, x1 = 115, z0 = -31, z1 = 82, r = 14;
    sh.moveTo(x0 + r, -z0);
    sh.lineTo(x1 - r, -z0);
    sh.quadraticCurveTo(x1, -z0, x1, -z0 - r);
    sh.lineTo(x1, -z1 + r);
    sh.quadraticCurveTo(x1, -z1, x1 - r, -z1);
    sh.lineTo(x0 + r, -z1);
    sh.quadraticCurveTo(x0, -z1, x0, -z1 + r);
    sh.lineTo(x0, -z0 - r);
    sh.quadraticCurveTo(x0, -z0, x0 + r, -z0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.8, bevelSegments: 3 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -1.65, 0); // 윗면이 y=-0.05 — 활주로 · 계류장 면보다 아래
    const land = new THREE.Mesh(g, mat(C.grass));
    land.receiveShadow = true;
    scene.add(land);
  }
  for (const [w, d, c, x, z] of [[14, 8, C.field2, -48, -12], [12, 10, C.field, 46, -16]] as const) scene.add(flat(w, d, c, x, z, 0.005));
  scene.add(flat(58, 17, C.apron, -4, -2.5));
  scene.add(flat(17, 7.6, C.apron, -8, -17.3));
  scene.add(box(34, 0.08, 2.2, C.cream, -8, 0, -12.6)); // 보도

  // 활주로 · 유도로
  scene.add(box(98, 0.04, 6.4, C.runway, 6, 0, 10));
  scene.add(box(48, 0.04, 2.4, C.taxi, -16, 0, 6));
  for (const x of [-34, -6]) scene.add(box(2.4, 0.04, 4, C.taxi, x, 0, 3.6));
  for (let x = -36; x <= 52; x += 5) scene.add(box(2.4, 0.06, 0.22, C.line, x, 0, 10));
  for (const end of [-41, 53]) for (let z = 7.9; z <= 12.2; z += 0.85) scene.add(box(3, 0.06, 0.4, C.line, end, 0, z));
  for (const x of [-30, 44]) for (const z of [8.6, 11.4]) scene.add(box(4, 0.06, 0.7, C.line, x, 0, z));
  for (let x = -42; x <= 54; x += 3) for (const z of [6.9, 13.1]) scene.add(box(0.22, 0.22, 0.22, C.yellow, x, 0, z, true));
  for (let x = -39; x <= 8; x += 1.8) scene.add(box(0.9, 0.06, 0.14, C.yellow, x, 0, 6));
  for (let x = -40; x <= 8; x += 4) for (const z of [4.7, 7.3]) scene.add(box(0.18, 0.18, 0.18, C.blue, x, 0, z, true));

  // 터미널
  scene.add(box(30.6, 0.4, 6.6, C.cream, -8, 0, -8));
  scene.add(box(30, 3.2, 6, C.wall, -8, 0.4, -8));
  for (let x = -22.2; x <= 6.2; x += 1.6) {
    for (const y of [0.9, 2.2]) {
      scene.add(box(1.1, 0.8, 0.08, C.glass, x, y, -4.98));
      scene.add(box(1.1, 0.8, 0.08, C.glass, x, y, -11.02));
    }
  }
  scene.add(box(31, 0.5, 7, C.wall, -8, 3.6, -8));
  scene.add(box(31.2, 0.18, 7.2, C.navy, -8, 3.5, -8));
  for (const x of [-18, -8, 2]) scene.add(box(5, 0.5, 2.4, C.glass, x, 4.1, -8));
  for (const x of [-14, -3]) scene.add(box(1.4, 0.7, 1.2, C.steel, x, 4.1, -6.2));
  // 간판 — 글자는 사이트 글꼴(불러온 뒤 다시 그림)
  const signs: { draw: () => void }[] = [];
  const sign = (txt: string, w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const draw = () => {
      const g = c.getContext("2d");
      if (!g) return;
      g.fillStyle = token("--hav-pin-cheap");
      g.fillRect(0, 0, 512, 128);
      g.fillStyle = token("--hav-foam");
      g.font = '800 72px Pretendard, "IBM Plex Sans KR", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(txt, 256, 66);
      g.fillStyle = token("--hav-sun");
      g.fillRect(0, 118, 512, 10);
      t.needsUpdate = true;
    };
    draw();
    signs.push({ draw });
    disposables.push(t);
    const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), [mat(C.red), mat(C.red), mat(C.red), mat(C.red), face, face]);
  };
  const s1 = sign("FLAPFX", 8, 2);
  s1.position.set(-8, 5.4, -4.9);
  scene.add(shade(s1));
  const s2 = sign("출발 DEPARTURES", 9, 1.6);
  s2.position.set(-8, 3.2, -11.2);
  s2.rotation.y = Math.PI;
  scene.add(shade(s2));
  scene.add(box(10, 0.25, 2.6, C.red, -8, 2.4, -12.4));
  for (const x of [-12.5, -3.5]) scene.add(cyl(0.12, 0.12, 2.4, C.navy, x, 0, -13.5, 8));
  for (const x of [-10, -8, -6]) scene.add(box(1.4, 2, 0.1, C.glass, x, 0.4, -11.06)); // 출입문
  for (const x of [-18, -6, 6]) {
    scene.add(box(1, 1, 3.4, C.wall, x, 1.6, -3.3));
    scene.add(box(1.5, 1.4, 1.3, C.navy, x, 1.4, -1.2));
    scene.add(box(0.35, 1.6, 0.35, C.navy, x, 0, -2.2));
    scene.add(box(0.5, 0.06, 6, C.yellow, x, 0, 3.2));
  }

  // 관제탑 · 레이더
  scene.add(box(3.4, 1.2, 3.4, C.cream, 12, 0, -6));
  scene.add(cyl(0.85, 1.1, 8.2, C.wall, 12, 1.2, -6));
  for (let y = 2.6; y <= 8.2; y += 1.8) scene.add(cyl(1.02, 1.02, 0.25, C.steel, 12, y, -6));
  scene.add(cyl(2.1, 2.1, 0.25, C.navy, 12, 9.2, -6, 8));
  scene.add(cyl(2, 1.5, 1.7, C.glass, 12, 9.45, -6, 8));
  scene.add(cyl(2.35, 2.35, 0.4, C.wall, 12, 11.1, -6, 8));
  scene.add(cyl(0.07, 0.07, 1.8, C.navy, 12, 11.5, -6, 6));
  scene.add(box(0.3, 0.3, 0.3, C.yellow, 12, 13.3, -6, true));
  scene.add(cyl(0.25, 0.4, 4, C.navy, 19, 0, -13, 8));
  const radar = new THREE.Group();
  radar.add(box(2.6, 0.9, 0.18, C.red, 0, 0, 0));
  radar.position.set(19, 4.1, -13);
  scene.add(radar);
  moving.push((t) => {
    radar.rotation.y = t * 1.2;
  });

  // 격납고 · 연료 탱크
  for (const z of [-11, -3.5]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 7, 28, 1, false, 0, Math.PI), mat(C.wall));
    h.rotation.z = Math.PI / 2;
    h.position.set(30, 0, z);
    scene.add(shade(h));
    const cap = new THREE.Mesh(new THREE.CircleGeometry(3, 28, 0, Math.PI), mat(C.cream));
    cap.rotation.set(0, -Math.PI / 2, 0);
    cap.position.set(26.49, 0, z);
    scene.add(cap);
    scene.add(box(0.1, 2.3, 3.2, C.navy, 26.45, 0, z));
  }
  for (const [x, z] of [[40, -16], [43.5, -16], [41.7, -19.2]] as const) {
    scene.add(cyl(1.4, 1.4, 2.4, C.cream, x, 0, z));
    scene.add(cyl(1.42, 1.42, 0.4, C.blue, x, 1.4, z));
  }

  // 지상 차량(트랙터 + 수하물 카트)
  const tug = (x: number, z: number, n: number, rot = 0) => {
    const g = new THREE.Group();
    g.add(box(0.9, 0.5, 0.7, C.blue, 0, 0.1, 0), box(0.4, 0.35, 0.6, C.glass, -0.15, 0.6, 0));
    for (let i = 1; i <= n; i++) g.add(box(0.8, 0.45, 0.65, i === 1 ? C.yellow : C.wall, -i * 1.05, 0.1, 0));
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    g.scale.setScalar(1.7);
    return shade(g);
  };
  scene.add(tug(-12, -1.6, 3), tug(1.8, 2.2, 2, Math.PI / 2), tug(-24, 2.4, 2, -0.4));

  // 도로 · 차 — Kenney Car Kit (CC0) · 자리만 먼저 만들고 모델은 불러온 뒤 채움 · 앞이 +x
  scene.add(box(130, 0.03, 2.6, C.road, 0, 0, -23));
  for (let x = -62; x <= 62; x += 4) scene.add(box(1.4, 0.05, 0.12, C.line, x, 0, -23));
  const carSlots: { g: THREE.Group; k: string }[] = [];
  const car = (k: string) => {
    const g = new THREE.Group();
    carSlots.push({ g, k });
    return g;
  };
  for (let i = 0; i < 20; i++) {
    if (i % 6 === 4) continue;
    const c = car(CAR_KINDS[(i * 3) % CAR_KINDS.length]);
    c.rotation.y = i < 10 ? Math.PI / 2 : -Math.PI / 2;
    c.position.set(-14.6 + (i % 10) * 1.45, 0, i < 10 ? -19.1 : -15.9);
    scene.add(c);
  }
  for (let i = 0; i < 4; i++) {
    const c = car(["taxi", "van", "sedan", "delivery"][i]);
    const lane = i % 2 ? -23.65 : -22.35;
    const dir = i % 2 ? -1 : 1;
    scene.add(c);
    moving.push((t) => {
      const x = ((((t * 4 + i * 33) % 130) + 130) % 130) - 65;
      c.position.set(dir * x, 0, lane);
      c.rotation.y = dir > 0 ? 0 : Math.PI;
    });
  }

  // 바람자루
  scene.add(cyl(0.07, 0.07, 3, C.navy, -40, 0, 16, 6));
  const sock = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const m = mat(i % 2 ? C.cream : C.red).clone();
    m.side = THREE.DoubleSide;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.32 - i * 0.05, 0.27 - i * 0.05, 0.45, 12, 1, true), m);
    seg.rotation.z = Math.PI / 2;
    seg.position.x = 0.25 + i * 0.45;
    sock.add(seg);
  }
  sock.position.set(-40, 2.85, 16);
  scene.add(shade(sock));
  moving.push((t) => {
    sock.rotation.y = Math.sin(t * 0.8) * 0.35 - 0.3;
  });

  // 구름 — 도시 위를 천천히 지나가며 그림자를 드리움 (홈 사진의 구름 느낌)
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.94 });
  const clouds = ([[-40, 30, 40], [5, 34, 52], [50, 28, 36], [-15, 32, 26], [75, 36, 58]] as const).map(([x, y, z]) => {
    const g = new THREE.Group();
    for (const [dx, dy, dz, r] of [[0, 0, 0, 2.6], [2.6, -0.5, 0.6, 2], [-2.6, -0.6, -0.4, 1.9], [1, 1.2, -0.5, 1.8], [-1.2, 0.8, 1, 1.6]] as const) {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudMat);
      p.position.set(dx, dy, dz);
      p.castShadow = true;
      g.add(p);
    }
    g.scale.set(1.5, 0.9, 1.1);
    g.position.set(x, y, z);
    scene.add(g);
    return { g, x };
  });
  moving.push((t) => {
    for (const c of clouds) c.g.position.x = ((((c.x + t * 0.8 + 90) % 180) + 180) % 180) - 90;
  });

  // 나무
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tree = (x: number, z: number, s: number, round: boolean, c: number) => {
    const g = new THREE.Group();
    g.add(cyl(0.12 * s, 0.14 * s, 0.55 * s, C.trunk, 0, 0, 0, 6));
    const top = new THREE.Mesh(round ? new THREE.IcosahedronGeometry(0.75 * s, 0) : new THREE.ConeGeometry(0.75 * s, 1.7 * s, 7), mat(c));
    top.position.y = (round ? 1.1 : 1.25) * s;
    g.add(top);
    g.position.set(x, 0, z);
    return shade(g);
  };
  const spots: [number, number][] = [];
  for (let x = -60; x <= 62; x += 4.2) {
    spots.push([x + rnd() * 1.5, -25.6 - rnd() * 0.8]);
    if (rnd() > 0.3) spots.push([x + rnd() * 2, 17.2 + rnd() * 1.2]);
  }
  for (const p of [[-44, -6], [-46, -1], [-48, -9], [42, -4], [45, -8], [48, -2], [24, -18], [-30, -16], [-34, -14]] as const) spots.push([p[0], p[1]]);
  spots.forEach(([x, z], i) => {
    const s = 0.7 + rnd() * 0.5;
    scene.add(tree(x, z, s, i % 3 === 0, i % 3 === 0 ? (i % 2 ? C.teal : C.field) : i % 2 ? C.tealDark : C.teal));
  });

  // 도시 — Kenney City Kit Commercial (CC0) · 자리만 먼저 · 모델은 불러온 뒤 채움
  const citySlots: { g: THREE.Group; k: string; size: number; sky: boolean }[] = [];
  const cityBlock = (x0: number, z0: number, cols: number, rows: number, far: boolean) => {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const list = far || j >= 2 ? FAR : NEAR;
        const k = list[Math.floor(rnd() * list.length)];
        const g = new THREE.Group();
        g.position.set(x0 + i * 6.4 + (rnd() - 0.5) * 0.6, 0, z0 + j * 6.4);
        scene.add(g);
        citySlots.push({ g, k, size: 4.6 + rnd() * 0.8, sky: k.includes("skyscraper") });
      }
    }
  };
  for (const z of [20.5, 33.3, 46.1]) scene.add(box(140, 0.03, 2.2, C.road, 0, 0, z));
  for (let x = -61; x <= 70; x += 25.6) scene.add(box(2.2, 0.03, 34, C.road, x, 0, 37));
  for (let b = 0; b < 5; b++) {
    cityBlock(-57 + b * 25.6, 24.2, 3, 2, false);
    cityBlock(-57 + b * 25.6, 37, 3, 2, b % 2 === 0);
    cityBlock(-57 + b * 25.6, 50, 3, 3, true);
  }

  // 사람 — Kenney Mini Characters (CC0) · 걷기 · 서 있기 동작 포함 · 앞이 +x
  const people: Person[] = [];
  const person = (kind: string, bag = false): Person => {
    const p: Person = { group: new THREE.Group(), kind, bag, anim: "idle", cur: null, mixer: null, actions: {} };
    people.push(p);
    return p;
  };
  const play = (p: Person, name: Anim) => {
    p.anim = name;
    if (!p.mixer || p.cur === name) return;
    if (p.cur) p.actions[p.cur]?.fadeOut(0.2);
    p.actions[name]?.reset().fadeIn(0.2).play();
    p.cur = name;
  };
  ["male-a", "female-b", "male-f", "female-e", "male-b", "female-c"].forEach((kind, i) => {
    const p = person(kind, i % 2 === 0);
    scene.add(p.group);
    play(p, "walk");
    const dir = i % 2 ? 1 : -1;
    const z = -12.2 - (i % 3) * 0.45;
    const off = i * 5.7;
    moving.push((t) => {
      const x = ((((t * 1.1 * dir + off) % 30) + 30) % 30) - 23;
      p.group.position.set(x, 0.08, z);
      p.group.rotation.y = dir > 0 ? 0 : Math.PI;
    });
  });
  const gateTraveler = person("male-f", true);
  gateTraveler.group.position.set(-4.4, 0, -2.4);
  gateTraveler.group.rotation.y = Math.PI;
  scene.add(gateTraveler.group);
  for (const [x, z, r] of [[-10.2, -0.4, 0.4], [3.6, 3.4, 2.2]] as const) {
    const w = person("worker");
    w.group.position.set(x, 0, z);
    w.group.rotation.y = r;
    scene.add(w.group);
  }
  // 안내 직원 (단계마다 자리를 옮김)
  const staff = person("female-d");
  scene.add(staff.group);
  staff.group.position.set(...STAFF_SPOT[1].pos);
  staff.group.rotation.y = STAFF_SPOT[1].rot;
  let staffFrom: { pos: Vec; rot: number } | null = null;
  let staffTo = STAFF_SPOT[1];
  let staffT = 1;

  // 비행기 — Poly by Google (CC-BY 4.0 · 출처는 홈 바닥 띠) · 주인공 하나 + 계류장에 두 대
  const hero = new THREE.Group();
  hero.rotation.order = "YZX";
  scene.add(hero);

  // 모델 불러오기 — 장면은 자리만 먼저 그려 두고 모델이 오면 채움 (실패해도 장면은 그려짐)
  const loader = new GLTFLoader();
  const load = (url: string): Promise<GLTF | null> => loader.loadAsync(url).catch(() => null);
  const kit = async (dir: string, names: string[], file: (n: string) => string = (n) => n) => {
    const got = await Promise.all(names.map(async (n) => [n, await load(`${MODEL_BASE}/${dir}/${file(n)}.glb`)] as const));
    return Object.fromEntries(got) as Record<string, GLTF | null>;
  };
  const unique = <T,>(xs: T[]) => [...new Set(xs)];
  const kindFile = (n: string) => (n === "item-luggage" ? n : `character-${n}`);
  const modelsReady = Promise.all([
    kit("car", unique(CAR_KINDS.filter((k) => k !== "taxi"))),
    kit("taxi", ["taxi"]),
    kit("city", unique(citySlots.map((s) => s.k))),
    kit("people", unique([...people.map((p) => p.kind), "item-luggage"]), kindFile),
    load(PLANE_MODEL_URL),
  ]).then(([cars, taxi, city, folks, planeGltf]) => {
    if (!alive) return;
    // 차는 흰색 계열로 바꾼 색상표 · 택시만 원래 노랑 (노랑 포인트 하나)
    for (const { g, k } of carSlots) {
      const src = k === "taxi" ? taxi.taxi : cars[k];
      if (src) g.add(fit(src.scene.clone(true), { len: 2.3 }));
    }
    for (const { g, k, size, sky } of citySlots) {
      const src = city[k];
      if (!src) continue;
      const b = fit(src.scene.clone(true), { len: size });
      if (sky) b.scale.multiplyScalar(1.15);
      g.add(b);
    }
    for (const p of people) {
      const src = folks[p.kind];
      if (!src) continue;
      const m = SkeletonUtils.clone(src.scene);
      p.group.add(fit(m, { h: 1.25 }));
      p.mixer = new THREE.AnimationMixer(m);
      for (const clip of src.animations) if (clip.name === "idle" || clip.name === "walk") p.actions[clip.name] = p.mixer.clipAction(clip);
      const want = p.anim;
      p.cur = null;
      play(p, want);
      const bagSrc = folks["item-luggage"];
      if (p.bag && bagSrc) {
        const bag = fit(bagSrc.scene.clone(true), { h: 0.55 });
        bag.position.set(-0.35, 0, 0.45);
        p.group.add(bag);
      }
    }
    if (planeGltf) {
      const model = planeGltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 5.2 / Math.max(size.x, size.y, size.z);
      const make = () => {
        const m = model.clone(true);
        m.scale.setScalar(scale);
        m.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
        m.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && !Array.isArray(mesh.material)) mesh.material = mesh.material.clone();
        });
        const turn = new THREE.Group();
        turn.rotation.y = Math.PI / 2;
        turn.add(m);
        return shade(turn);
      };
      hero.add(make());
      for (const x of [-18, 6]) {
        const p = make();
        p.position.set(x, 0, 1.4);
        p.rotation.y = -Math.PI / 2;
        scene.add(p);
      }
    }
  });

  // 카메라 — 정사영 · 도시 미니어처를 비스듬히 내려다봄
  const VIEW = 30, DIST = 160, ELEV = (32 * Math.PI) / 180;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 600);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { samples: 4, type: THREE.HalfFloatType })); // 계단 현상 줄이기 (MSAA)
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 2, 2);
  ao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.4, thickness: 1.5, scale: 1.2, samples: 16 });
  ao.blendIntensity = 0.85;
  composer.addPass(ao);
  composer.addPass(new OutputPass());
  const resize = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(Math.min(devicePixelRatio, 2));
    composer.setSize(w, h);
    const a = w / Math.max(h, 1);
    const half = a < 1 ? VIEW / a / 1.4 : VIEW;
    Object.assign(camera, { left: -half * a, right: half * a, top: half, bottom: -half });
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener("resize", resize);
  document.fonts?.ready.then(() => {
    if (alive) for (const s of signs) s.draw();
  });

  let cam: Cam = SHOT[1];
  let camFrom: Cam | null = null;
  let camTo: Cam | null = null;
  let camT = 1;
  let lastStep: IntroStep = 1;
  let lastFlight = -1;
  let liftFired = false;
  let endFired = false;
  const look = new THREE.Vector3();
  const placeCamera = (c: Cam) => {
    const az = ((45 + c.yaw) * Math.PI) / 180;
    look.set(...c.target);
    camera.position.set(look.x + DIST * Math.cos(ELEV) * Math.sin(az), look.y + DIST * Math.sin(ELEV), look.z + DIST * Math.cos(ELEV) * Math.cos(az));
    camera.zoom = c.zoom;
    camera.updateProjectionMatrix();
    camera.lookAt(look);
  };
  const flyTo = (c: Cam) => {
    if (still) {
      cam = c;
      camT = 1;
      return;
    }
    camFrom = { ...cam, target: [...cam.target] };
    camTo = c;
    camT = 0;
  };
  const moveStaff = (n: 1 | 2 | 3) => {
    staffFrom = { pos: staff.group.position.toArray() as Vec, rot: staff.group.rotation.y };
    staffTo = STAFF_SPOT[n];
    staffT = still ? 1 : 0;
  };

  const clock = new THREE.Clock();
  let last = 0;
  let raf = 0;
  const head = new THREE.Vector3();
  const frame = () => {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - last);
    last = t;
    for (const f of moving) f(still ? 0 : t);

    // 단계가 바뀌면 카메라 · 직원이 그 자리로 (1~3) · 이륙이 처음부터 다시 시작하면 표시를 되돌림
    if (state.step !== lastStep) {
      lastStep = state.step;
      if (state.step <= 3) {
        flyTo(SHOT[state.step as 1 | 2 | 3]);
        moveStaff(state.step as 1 | 2 | 3);
      }
    }
    if (state.flight < 0 && lastFlight >= 0) {
      liftFired = false;
      endFired = false;
    }
    lastFlight = state.flight;

    if (camT < 1 && camFrom && camTo) {
      camT = Math.min(1, camT + dt / 1.6);
      const s = smooth(camT);
      cam = { target: mix3(camFrom.target, camTo.target, s), zoom: mix(camFrom.zoom, camTo.zoom, s), yaw: mix(camFrom.yaw, camTo.yaw, s) };
    }
    if (staffT < 1 && staffFrom) {
      staffT = Math.min(1, staffT + dt / 1.2);
      const s = smooth(staffT);
      staff.group.position.set(...mix3(staffFrom.pos, staffTo.pos, s));
      staff.group.rotation.y = mix(staffFrom.rot, staffTo.rot, s);
      play(staff, "walk");
    } else {
      staff.group.position.set(...staffTo.pos);
      staff.group.rotation.y = staffTo.rot;
      play(staff, "idle");
    }
    for (const p of people) p.mixer?.update(still ? 0 : dt);
    if (state.hidden) return;

    let p = 0;
    if (state.flight >= 0) {
      if (state.auto) state.flightGoal = autoGoal(state.flightGoal, dt, still);
      state.flight = advance(state.flight, state.flightGoal, dt, still);
      p = Math.min(1, state.flight);
      if (liftReached(state.flight, state.auto) && !liftFired) {
        liftFired = true;
        api.onLift?.();
      }
      if (windowDue(state.flight, state.auto, endFired)) {
        endFired = true;
        api.onTakeoffEnd?.();
      }
      const c = cameraAt(p);
      const k = smooth(clamp01((state.flight - FLIGHT_START) / 0.12));
      cam = k < 1 && camTo ? { target: mix3(camTo.target, c.target, k), zoom: mix(camTo.zoom, c.zoom, k), yaw: mix(camTo.yaw, c.yaw, k) } : c;
    }
    const pl = planeAt(p);
    hero.position.set(...pl.pos);
    hero.rotation.set(0, pl.heading, pl.pitch);
    placeCamera(cam);
    composer.render();

    let staffScreen: { x: number; y: number } | null = null;
    if (api.onFrame) {
      head.copy(staff.group.position).add(new THREE.Vector3(0, 2.2, 0)).project(camera);
      staffScreen = { x: (head.x * 0.5 + 0.5) * el.clientWidth, y: (-head.y * 0.5 + 0.5) * el.clientHeight };
      api.onFrame({ flight: state.flight, staff: staffScreen });
    }
  };
  placeCamera(cam);
  void modelsReady.then(() => {
    if (!alive) return;
    api.onReady?.();
    raf = requestAnimationFrame(frame);
  });

  // 정리 — 그리기를 멈추고 GPU 자원 · 캔버스를 걷음
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    for (const m of mats.values()) m.dispose();
    for (const d of disposables) d.dispose();
    envTexture.dispose();
    pmrem.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

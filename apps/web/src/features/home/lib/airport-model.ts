// 공항 시험 장면 — three.js 로 그리는 미니어처 공항 (작업 0184) · React 없이 그리기만
//   모델 파일 없이 상자 · 원기둥만으로 · 색은 항공 노선도 테마 · 스크롤 진행은 progress.current 를 매 프레임 읽음
//   hooks/use-airport-scene.ts 가 이 파일을 필요할 때만 불러옴 (three 가 다른 화면 무게에 들어가지 않게)
import * as THREE from "three";
import { cameraAt, planeAt } from "./airport-path";

const C = {
  sky: 0xeaf4f2,
  grass: 0xcfe6d8,
  apron: 0xdfe6ec,
  runway: 0x3b4566,
  line: 0xffffff,
  yellow: 0xf7c548,
  navy: 0x16246e,
  blue: 0x2438a8,
  teal: 0x17a398,
  red: 0xd9452b,
  white: 0xffffff,
  trunk: 0x8a6a4a,
};

const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });

function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt: number, rb: number, h: number, color: number, x: number, y: number, z: number, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** 비행기 — 기수가 +x · 바닥이 y=0 */
function makePlane(tail: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 3.6, 6, 16), mat(C.white));
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.75;
  const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 3.0, 4, 16, 1), mat(C.blue));
  stripe.rotation.z = Math.PI / 2;
  stripe.position.set(0.1, 0.85, 0);
  stripe.scale.set(0.3, 1, 1); // 위아래로 얇은 창문 띠
  const wing = box(1.1, 0.12, 5.2, C.white, 0.1, 0.55, 0);
  const tailWing = box(0.6, 0.08, 1.8, C.white, -1.9, 0.85, 0);
  const fin = box(0.9, 1.1, 0.1, tail, -1.9, 0.95, 0);
  fin.rotation.z = -0.25;
  const engL = cyl(0.22, 0.22, 0.7, C.navy, 0.35, 0.18, 1.3, 12);
  engL.rotation.z = Math.PI / 2;
  const engR = engL.clone();
  engR.position.z = -1.3;
  g.add(body, stripe, wing, tailWing, fin, engL, engR);
  g.traverse((o) => {
    o.castShadow = true;
  });
  return g;
}

function tree(x: number, z: number, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.12 * s, 0.12 * s, 0.5 * s, C.trunk, 0, 0, 0, 8));
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.7 * s, 1.6 * s, 8), mat(C.teal));
  top.position.y = 1.2 * s;
  top.castShadow = true;
  g.add(top);
  g.position.set(x, 0, z);
  return g;
}

function buildAirport(scene: THREE.Scene) {
  // 땅 · 계류장
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(C.grass));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(56, 16), mat(C.apron));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(-4, 0.01, -3);
  apron.receiveShadow = true;
  scene.add(apron);

  // 활주로 · 유도로
  scene.add(box(96, 0.04, 6, C.runway, 6, 0, 10));
  scene.add(box(46, 0.04, 2.2, C.runway, -16, 0, 6));
  scene.add(box(2.2, 0.04, 6, C.runway, -6, 0, 3));
  for (let x = -36; x <= 50; x += 6) scene.add(box(2.6, 0.05, 0.25, C.line, x, 0, 10));
  for (let z = 7.8; z <= 12.2; z += 0.9) scene.add(box(3, 0.05, 0.45, C.line, -40, 0, z));
  for (let x = -38; x <= 6; x += 2) scene.add(box(1, 0.05, 0.12, C.yellow, x, 0, 6));

  // 터미널 — 흰 몸통 · 남색 유리띠 · 짙은 지붕
  scene.add(box(30, 3.2, 6, C.white, -8, 0, -8));
  scene.add(box(30.1, 1.2, 6.1, C.blue, -8, 1.3, -8));
  scene.add(box(31, 0.5, 7, 0xf3f6fb, -8, 3.2, -8)); // 지붕은 밝게 — 남색이면 화면을 덮음
  scene.add(box(31.2, 0.2, 7.2, C.navy, -8, 3.1, -8));
  for (const x of [-18, -6, 6]) {
    scene.add(box(1, 1, 3.6, C.white, x, 0.9, -3.6));
    scene.add(box(1.2, 1.9, 1.2, C.navy, x, 0, -1.6));
  }

  // 관제탑
  scene.add(cyl(0.8, 1.1, 9, C.white, 12, 0, -6));
  scene.add(cyl(2, 1.4, 1.8, C.teal, 12, 9, -6, 8));
  scene.add(cyl(2.3, 2.3, 0.4, C.red, 12, 10.8, -6, 8));
  scene.add(cyl(0.08, 0.08, 1.6, C.navy, 12, 11.2, -6, 6));

  // 격납고 — 노란 반원통
  for (const z of [-10, -3]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 7, 24, 1, false, 0, Math.PI), mat(C.yellow));
    h.rotation.z = Math.PI / 2; // 반원 쪽이 위 · 긴 축이 x
    h.position.set(28, 0, z);
    h.castShadow = true;
    h.receiveShadow = true;
    scene.add(h);
  }

  // 게이트에 서 있는 다른 비행기 두 대
  const p1 = makePlane(C.yellow);
  p1.position.set(-18, 0, 0);
  p1.rotation.y = -Math.PI / 2;
  const p2 = makePlane(C.teal);
  p2.position.set(6, 0, 0);
  p2.rotation.y = -Math.PI / 2;
  scene.add(p1, p2);

  // 나무
  const trees: [number, number, number][] = [
    [-30, -14, 1.2], [-26, -16, 1], [-22, -15, 1.4], [20, -16, 1.1], [24, -18, 1.3], [36, -14, 1],
    [-44, 18, 1.2], [-38, 20, 1], [-20, 19, 1.3], [0, 21, 1.1], [18, 18, 1.2], [34, 20, 1], [52, 18, 1.4],
    [40, -4, 1], [42, -9, 1.2], [-40, -6, 1.1], [-44, -1, 1.3],
  ];
  for (const [x, z, s] of trees) scene.add(tree(x, z, s));
}

const VIEW = 30; // 확대 1일 때 보이는 세로 절반 (월드 단위)
const DIST = 90;
const ELEV = (34 * Math.PI) / 180;

/** el 안에 장면을 그림 · 돌려준 함수를 부르면 멈추고 정리 */
export function mountAirport(el: HTMLElement, progress: { current: number }): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.sky);
  scene.add(new THREE.HemisphereLight(0xffffff, C.grass, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-30, 50, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -70;
  sc.right = 70;
  sc.top = 50;
  sc.bottom = -50;
  sc.far = 200;
  scene.add(sun);
  buildAirport(scene);

  const plane = makePlane(C.red);
  plane.rotation.order = "YZX";
  scene.add(plane);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  const resize = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(h, 1);
    // 좁은 화면(휴대폰)에선 가로가 모자라지 않게 더 넓게 봄
    const half = aspect < 1 ? VIEW / aspect / 1.4 : VIEW;
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  let shown = progress.current;
  let raf = 0;
  const look = new THREE.Vector3();
  const frame = () => {
    // 스크롤을 바로 따라가지 않고 조금 늦게 — 부드럽게
    shown += (progress.current - shown) * 0.08;
    const cam = cameraAt(shown);
    const az = ((45 + cam.yaw) * Math.PI) / 180;
    look.set(...cam.target);
    camera.position.set(
      look.x + DIST * Math.cos(ELEV) * Math.sin(az),
      look.y + DIST * Math.sin(ELEV),
      look.z + DIST * Math.cos(ELEV) * Math.cos(az),
    );
    camera.zoom = cam.zoom;
    camera.updateProjectionMatrix();
    camera.lookAt(look);
    const p = planeAt(shown);
    plane.position.set(...p.pos);
    plane.rotation.set(0, p.heading, p.pitch);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}

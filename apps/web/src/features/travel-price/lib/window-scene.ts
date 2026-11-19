// 창밖 풍경 그리기 · 흐름 — 작업 0229 · 모션 1번(창밖으로 넘어가는 12달) · 시안 .tmp/motion-1119/window2 · .tmp/motion-pages/m-flights.js 의 그림 · 움직임 · 시간을 그대로 옮김
//   캔버스 세 장(뒤 · 가까운 층 · 앞)에 하늘 · 산 · 언덕 · 밭 띠 · 나무 · 집 · 눈 · 비 · 꽃잎을 그림 · 달마다 계절 팔레트 · 달이 바뀔 때 구름 덩어리가 창을 휙 가림(계절이 바뀌는 곳은 긴 구름 속)
//   createWindowScene(...) 이 장면 하나를 만들고 · 화면(React)은 보이는 달 · 덮개 상태만 콜백으로 받음 · 날개 그림 없음
//   색 숫자는 시안 그대로(캔버스는 CSS 토큰을 못 읽음) — 흰색만 한 단계 낮춘 WHITE 로 (눈에는 같음 · 화면 코드의 흰색 직접 쓰기 금지 규칙)
import { playSequence } from "./window-months";

type G = CanvasRenderingContext2D;
type Part = { dead: boolean; t: string; x: number; y: number; r: number; rot: number; vr: number; ph: number; vy: number; vx: number; sz: number; c: string };
type Drop = { x: number; y: number; r: number; vy: number };
type Pal = {
  desc: string; sky: string[]; sun: { x: number; y: number; c: string; a: number } | null;
  cloud: { c: string; s: string; n: number; k: string }; mtn: { a: string; b: string; snow: number };
  hill: string; mound: string; patches: string[][]; hedge: string; tree: string; treeC: string[];
  con: string; conSnow: number; roofSnow: number; lit: number; smoke: number; part: { t: string; n: number };
  lamp: number; tint: (string | number)[]; glass: number; birds: number; balloon: number; sheep: number; hay: number; sunfl: number; bush: number; stars: number;
};
const WHITE = "#FEFEFE";
const DEF = { sun: null, glass: 0, birds: 0, balloon: 0, sheep: 0, hay: 0, sunfl: 0, bush: 0, stars: 0, conSnow: 0, roofSnow: 0, lit: 0, smoke: 0, part: { t: "none", n: 0 }, con: "#3E7A6A", lamp: 0.3, tint: [WHITE, 0] };
  const PAL: Pal[] = (([
    {desc:"깊은 눈", sky:["#BDB5DA","#EFE8F2"], sun:{x:.78,y:.2,c:"#FFF7E8",a:.5},
     cloud:{c:"#F8F4FB",s:"#DDD5EA",n:.65,k:"puff"}, mtn:{a:"#F8F6FC",b:"#D4CCE6",snow:1}, hill:"#EEEBF5", mound:"#E3DDEE",
     patches:[["#F9F7FC","snow"],["#EFEBF6","snow"],["#E6E1F0","rows"],["#F4F1F9","plain"]], hedge:"#DCD5E9",
     tree:"bareSnow", treeC:[WHITE], con:"#3D7266", conSnow:1, roofSnow:1, lit:.4, smoke:1, part:{t:"snow",n:95}, lamp:.85, tint:["#B3A8DA",.2]},
    {desc:"녹는 눈", sky:["#B2C9E6","#EEF1F2"], sun:{x:.7,y:.17,c:"#FFF4D6",a:.75},
     cloud:{c:"#FBFAF7",s:"#E0E1E8",n:.5,k:"puff"}, mtn:{a:"#CACEE8",b:"#A6AAD0",snow:.62}, hill:"#BFC39A", mound:"#C7C1D4",
     patches:[["#F4F3F3","snow"],["#B9AE84","rows"],["#E9E8E3","snow"],["#ABAB7E","stubble"],["#C6BB92","plain"]], hedge:"#8B8E66",
     tree:"bare", treeC:[WHITE], conSnow:.45, roofSnow:1, smoke:1, part:{t:"snow",n:16}, lamp:.55, tint:["#C3CBE6",.1]},
    {desc:"새싹", sky:["#A2CEEC","#EEF6EA"], sun:{x:.72,y:.16,c:"#FFF3C8",a:.85},
     cloud:{c:"#FFFDF6",s:"#E3E8E6",n:.55,k:"puff"}, mtn:{a:"#BDC4E4",b:"#9AA1CD",snow:.45}, hill:"#B6D18B", mound:"#BEB4CD",
     patches:[["#C7DD93","rows"],["#B58F6E","rows"],["#AECF80","plain"],["#D8C69D","rows"],["#BCD98D","flowers"]], hedge:"#6E9F5B",
     tree:"bud", treeC:["#B5DB84","#F2D35A"], birds:1, sheep:1, lamp:.3, tint:["#E8F0D8",.05]},
    {desc:"벚꽃", sky:["#B1D2EE","#F6E6EE"], sun:{x:.75,y:.16,c:"#FFF2CC",a:.8},
     cloud:{c:"#FFFBFA",s:"#EADDE5",n:.6,k:"puff"}, mtn:{a:"#C0C5E7",b:"#9EA3D1",snow:.4}, hill:"#AAD18B", mound:"#C3B5D3",
     patches:[["#B7DA8F","rows"],["#C5A081","rows"],["#A0CB7D","plain"],["#ECD675","flowers"],["#B4D896","rows"]], hedge:"#5F9A58",
     tree:"blossom", treeC:["#F7C3D3","#F9D6E1","#F2AFC6","#A9D38A"], part:{t:"petal",n:48}, glass:.6, sheep:1, lamp:.32, tint:["#F6C8D4",.08]},
    {desc:"신록과 꽃밭", sky:["#84C1EE","#E4F2F7"], sun:{x:.8,y:.14,c:"#FFF0B8",a:.95},
     cloud:{c:WHITE,s:"#E2EAF0",n:.6,k:"puff"}, mtn:{a:"#B7C0E7",b:"#939CCE",snow:.32}, hill:"#95C970", mound:"#BAAFD1",
     patches:[["#F3D35B","rows"],["#B8A3DE","rows"],["#8EC66B","plain"],["#AAD47F","flowers"],["#F5E08B","rows"]], hedge:"#4E8F4E",
     tree:"fresh", treeC:["#A6D477","#94C86A","#B8DC87"], part:{t:"seed",n:18}, balloon:1, sheep:1, bush:1, lamp:.16},
    {desc:"물 댄 논", sky:["#9BC5E4","#E9F0EF"], sun:{x:.66,y:.15,c:"#FFF6DA",a:.7},
     cloud:{c:WHITE,s:"#DFE7EB",n:.75,k:"puff"}, mtn:{a:"#B5BFE1",b:"#94A0CC",snow:.22}, hill:"#8DC06B", mound:"#B5AFCC",
     patches:[["#B7DDE9","water"],["#A6D3E0","water"],["#8FC46B","plain"],["#B3D98B","rows"],["#C3E3EB","water"]], hedge:"#4E8E50",
     tree:"green", treeC:["#7FBE5E","#8CC86A"], birds:1, lamp:.2, tint:["#DDEFF0",.05]},
    {desc:"장마", sky:["#8B97AE","#CBD2DB"],
     cloud:{c:"#B7BECD",s:"#959DB0",n:1,k:"storm"}, mtn:{a:"#A1AAC4",b:"#828AA9",snow:.12}, hill:"#5F9E5A", mound:"#9C9AB4",
     patches:[["#68A75D","rows"],["#79B46B","plain"],["#94C4C5","water"],["#5C9954","rows"]], hedge:"#3F7A47",
     tree:"deep", treeC:["#5F9E50","#6BAA5A","#568F49"], part:{t:"rain",n:120}, glass:1, lamp:.62, tint:["#9DA7C6",.16]},
    {desc:"한여름 뭉게구름", sky:["#57AAEE","#D5EEF9"], sun:{x:.83,y:.13,c:"#FFF3B0",a:1},
     cloud:{c:WHITE,s:"#DCE6F1",n:.85,k:"tower"}, mtn:{a:"#AFBDE7",b:"#8B98D0",snow:.15}, hill:"#80C05B", mound:"#B5ABD1",
     patches:[["#F4D35F","rows"],["#7EBF5C","plain"],["#B5A2DE","rows"],["#9CCF6B","rows"],["#ECC567","stubble"]], hedge:"#3E8648",
     tree:"deep", treeC:["#5FA34F","#6EB25B"], sunfl:1, sheep:1, balloon:1, lamp:.08},
    {desc:"익는 들", sky:["#97C5E8","#F4EAD5"], sun:{x:.7,y:.18,c:"#FFE9B0",a:.9},
     cloud:{c:"#FFFDF7",s:"#EBE3D6",n:.55,k:"puff"}, mtn:{a:"#C0C3E2",b:"#9EA2CD",snow:.2}, hill:"#BAC56F", mound:"#C1B5D0",
     patches:[["#EAC553","rows"],["#DEB54B","rows"],["#BAC46C","plain"],["#EED68B","stubble"],["#CAC064","rows"]], hedge:"#6E8F4A",
     tree:"turning", treeC:["#A9C05A","#CCC556","#8DB256"], hay:1, birds:1, balloon:1, lamp:.3, tint:["#F6E1B2",.07]},
    {desc:"단풍", sky:["#D6B5D5","#F6DCC6"], sun:{x:.76,y:.2,c:"#FFE6C2",a:.8},
     cloud:{c:"#FBF0E7",s:"#E8D1CC",n:.55,k:"puff"}, mtn:{a:"#DBC5DF",b:"#B8A2CC",snow:.3}, hill:"#D8B478", mound:"#C9B3C3",
     patches:[["#E8B45C","rows"],["#D89A58","rows"],["#CEA86D","stubble"],["#EAC97D","plain"],["#CA8C56","rows"]], hedge:"#B66A3D",
     tree:"maple", treeC:["#EC8A3F","#DC5B3B","#F0C143","#E67B3B"], part:{t:"leaf",n:42}, balloon:1, birds:1, hay:1, sheep:1, lamp:.45, tint:["#F2B8A0",.12]},
    {desc:"늦가을 갈색 들과 건초", sky:["#C8BBD0","#F1DCC9"], sun:{x:.7,y:.24,c:"#FFE3BE",a:.7},
     cloud:{c:"#F7EFE9",s:"#DCCDCC",n:.5,k:"puff"}, mtn:{a:"#D5CCE1",b:"#AFA6C8",snow:.5}, hill:"#C0A47B", mound:"#C3B5C4",
     patches:[["#BA9469","rows"],["#CCAC79","stubble"],["#AE8961","rows"],["#D3BA8D","plain"],["#C39B6B","stubble"]], hedge:"#8E6E4E",
     tree:"late", treeC:["#CB8F4B","#DAAA58","#B67740"], con:"#3E6F63", hay:1, birds:1, sheep:1, part:{t:"leaf",n:14}, smoke:1, lamp:.68, tint:["#E0B49C",.12]},
    {desc:"첫눈과 불 켜진 집", sky:["#8A83BA","#ECC7CF"], sun:{x:.18,y:.4,c:"#FFD8C4",a:.6},
     cloud:{c:"#EAE1EF",s:"#C9BDD9",n:.45,k:"puff"}, mtn:{a:"#EDE9F5",b:"#C4BBDC",snow:1}, hill:"#E5E1ED", mound:"#DCD5E7",
     patches:[["#F2F0F7","snow"],["#E4E0EC","snow"],["#CBBDA9","stubble"],["#ECE9F2","rows"]], hedge:"#BAB4CA",
     tree:"bareSnow", treeC:[WHITE], con:"#3A6A61", conSnow:.85, roofSnow:1, lit:1, smoke:1, stars:1, part:{t:"snow",n:58}, lamp:1, tint:["#8D82C3",.22]}
  ] as Partial<Pal>[]).map((p) => ({ ...DEF, ...p }) as Pal));
const TAU = Math.PI * 2;
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const rnd = (i: number, s: number) => { const x = Math.sin(i * 127.1 + s * 311.7 + i * s * 0.0131) * 43758.5453; return x - Math.floor(x); };
const hx = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const MIXC = new Map<string, string>();
const mix = (a: string, b: string, t: number): string => {
  t = Math.round(t * 50) / 50; const k = a + b + t; const hit = MIXC.get(k); if (hit) return hit;
  const A = hx(a), B = hx(b);
  const r = "#" + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, "0")).join("");
  MIXC.set(k, r); return r;
};
const shade = (c: string, t: number) => (t < 0 ? mix(c, "#2A1F3A", -t) : mix(c, WHITE, t));
const LC = "#3B2C48"; // 얇은 짙은 외곽선 (원본처럼 자두빛 먹선)
const TUNNEL = new Set(["1-2", "4-5", "7-8", "10-11"]); // 계절이 바뀌는 곳은 긴 구름 속을 지남 (0부터 센 달)
const Z = 0.8, TY = -14; // 막 떠오른 낮은 고도에서 살짝 내려다본 시점: 그림을 조금 작게, 지평선은 창 가운데쯤

/** 종이 질감 — 창 위에 곱해 얹는 잔 무늬 그림 주소 (한 번 만들어 쓰는 값) */
export function grainUrl(): string {
  const c = document.createElement("canvas"); c.width = c.height = 160;
  const g = c.getContext("2d")!, im = g.createImageData(160, 160);
  for (let i = 0; i < im.data.length; i += 4) { const n = 224 + Math.random() * 31, fl = Math.random() < 0.012 ? -40 : 0; im.data[i] = n + fl; im.data[i + 1] = n - 3 + fl; im.data[i + 2] = n - 8 + fl; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  return c.toDataURL();
}

export type ShadeState = "closed" | "opening" | "open";
export type SceneOptions = {
  back: HTMLCanvasElement; near: HTMLCanvasElement; front: HTMLCanvasElement; win: HTMLElement;
  /** 값이 있는 달(0 = 1월) 오름차순 · 가장 싼 달(0 = 1월) · 움직임 줄이기 */
  months: number[]; lowest: number; reduce: boolean;
  onMonth: (m: number) => void; onShade: (s: ShadeState) => void;
};
export type WindowScene = {
  size(): void; visible(on: boolean, ratio: number): void; replay(): void; jumpTo(m: number): void; destroy(): void;
};

export function createWindowScene(o: SceneOptions): WindowScene {
  const { win, months, lowest, reduce } = o;
  const cvB = o.back, cvN = o.near, cvF = o.front;
  const gB = cvB.getContext("2d")!, gN = cvN.getContext("2d")!, gF = cvF.getContext("2d")!;
  // 재생 순서 — 값이 있는 달을 차례로 지나 가장 싼 달에서 멈춤 (가장 싼 달이 마지막이면 그대로)
  const SEQ = playSequence(months.map((m) => m + 1), lowest + 1).map((m) => m - 1);
  let VW = 375, SH = 520, K = 1, mobile = false, VMAX = 600;
  let s = 0, v = 0, vT = 0, T = 0, cur = 0, hold = 0, playing = false, seqI = 0, disp = -1, isVisible = false, raf = 0, last = 0, stopAfter = false, token = 0, started = false;
  let tr: { to: number; kind: string; len: number; so: number; a: number } | null = null;
  let timers: number[] = [];
  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };

  const PAT = new Map<string, CanvasPattern>();
  function pattern(g: G, c: string, tex: string, diag: boolean): CanvasPattern {
    const key = c + tex + (diag ? 1 : 0);
    let p = PAT.get(key); if (p) return p;
    const cv = document.createElement("canvas"); cv.width = cv.height = 48; const q = cv.getContext("2d")!;
    q.fillStyle = c; q.fillRect(0, 0, 48, 48);
    const dk = shade(c, -.14), lt = shade(c, .22);
    if (tex === "rows") {
      q.strokeStyle = dk; q.lineWidth = 1.6;
      if (diag) { for (let k = -48; k < 96; k += 9) { q.beginPath(); q.moveTo(k, 48); q.lineTo(k + 48, 0); q.stroke(); } }
      else { for (let y = 3; y < 48; y += 8) { q.beginPath(); q.moveTo(0, y); q.lineTo(48, y); q.stroke(); } }
    } else if (tex === "stubble") {
      q.strokeStyle = dk; q.lineWidth = 1.4;
      for (let i = 0; i < 26; i++) { const x = rnd(i, 3) * 48, y = rnd(i, 4) * 48; q.beginPath(); q.moveTo(x, y); q.lineTo(x + 1, y - 4); q.stroke(); }
    } else if (tex === "flowers") {
      const cs = [WHITE, "#F7D25B", "#F3A9C0", "#C9B4EA"];
      for (let i = 0; i < 30; i++) { q.fillStyle = cs[i % 4]; q.beginPath(); q.arc(rnd(i, 7) * 48, rnd(i, 8) * 48, 1.6, 0, TAU); q.fill(); }
      q.fillStyle = dk; for (let i = 0; i < 12; i++) q.fillRect(rnd(i, 9) * 48, rnd(i, 10) * 48, 1.4, 1.4);
    } else if (tex === "water") {
      q.strokeStyle = lt; q.lineWidth = 1.6;
      for (let y = 5; y < 48; y += 12) { q.beginPath(); q.moveTo(4 + (y % 7), y); q.lineTo(26 + (y % 9), y); q.stroke(); }
      q.strokeStyle = "#5FA35A"; q.lineWidth = 1.5;
      for (let y = 9; y < 48; y += 12) for (let x = 3; x < 48; x += 8) { q.beginPath(); q.moveTo(x - 1.5, y); q.lineTo(x, y - 3.5); q.lineTo(x + 1.5, y); q.stroke(); }
    } else if (tex === "snow") {
      q.strokeStyle = shade(c, -.06); q.lineWidth = 1.2;
      for (let y = 6; y < 48; y += 16) { q.beginPath(); q.moveTo(0, y); q.bezierCurveTo(16, y - 3, 32, y + 3, 48, y); q.stroke(); }
    }
    p = g.createPattern(cv, "repeat")!; PAT.set(key, p); return p;
  }

  // 겹친 원 덩어리 + 바깥 외곽선만 (원본 나무 · 구름처럼)
  function blobPath(g: G, cs: number[][]) { g.beginPath(); for (const c of cs) { g.moveTo(c[0] + c[2], c[1]); g.arc(c[0], c[1], c[2], 0, TAU); } }
  function blob(g: G, cs: number[][], fill: string, lw: number) { blobPath(g, cs); g.lineWidth = lw * 2; g.strokeStyle = LC; g.stroke(); g.fillStyle = fill; g.fill(); }

  /* ---- 하늘 ---- */
  function cloud(g: G, x: number, y: number, w: number, P: Pal, kind: string) {
    let cs: number[][] | undefined;
    if (kind === "tower") cs = [[x - w * .3, y - w * .05, w * .2], [x, y - w * .14, w * .28], [x + w * .28, y - w * .05, w * .2], [x - w * .08, y - w * .42, w * .22], [x + w * .12, y - w * .6, w * .18], [x + w * .16, y - w * .3, w * .2]];
    else cs = [[x - w * .28, y - w * .02, w * .2], [x - w * .02, y - w * .12, w * .27], [x + w * .27, y - w * .03, w * .19], [x + w * .12, y - w * .22, w * .16]];
    const c = P.cloud;
    g.save(); g.beginPath(); g.rect(x - w, y - w * 1.2, w * 2, w * 1.2); g.clip();
    blob(g, cs, c.c, .9);
    g.save(); g.beginPath(); g.rect(x - w, y - w * .075, w * 2, w * .075); g.clip(); blobPath(g, cs); g.fillStyle = c.s; g.fill(); g.restore();
    g.restore();
    g.beginPath(); g.moveTo(x - w * .47, y); g.lineTo(x + w * .45, y); g.lineWidth = .9; g.strokeStyle = LC; g.stroke();
  }
  function drawSky(g: G, P: Pal, a: number) {
    g.globalAlpha = a;
    const gr = g.createLinearGradient(0, 0, 0, SH * .62); gr.addColorStop(0, P.sky[0]); gr.addColorStop(1, P.sky[1]);
    g.fillStyle = gr; g.fillRect(0, 0, VW, SH);
    if (P.stars) for (let i = 0; i < 30; i++) {
      const tw = .45 + .55 * Math.sin(T * 2.2 + i * 1.7);
      g.fillStyle = `rgba(255,248,230,${(.75 * tw * a).toFixed(3)})`; g.beginPath(); g.arc(rnd(i, 3) * VW, 8 + rnd(i, 4) * 110, .6 + rnd(i, 5) * .9, 0, TAU); g.fill();
    }
    if (P.sun) {
      const sx = P.sun.x * VW, sy = P.sun.y * SH;
      const rg = g.createRadialGradient(sx, sy, 8, sx, sy, 70); rg.addColorStop(0, "rgba(255,248,215,.55)"); rg.addColorStop(1, "rgba(255,248,215,0)");
      g.globalAlpha = a * P.sun.a; g.fillStyle = rg; g.fillRect(sx - 70, sy - 70, 140, 140);
      g.beginPath(); g.arc(sx, sy, 21, 0, TAU); g.fillStyle = P.sun.c; g.fill(); g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,.8)"; g.stroke();
      g.globalAlpha = a;
    }
    // 구름
    const c = P.cloud, C = c.k === "storm" ? 150 : 210, off = s * .02 + T * 5;
    const j0 = Math.floor((off - 200) / C), j1 = Math.floor((off + VW + 200) / C);
    for (let j = j0; j <= j1; j++) {
      if (rnd(j, 21) > c.n) continue;
      const x = j * C + rnd(j, 22) * C * .6 - off;
      if (c.k === "storm") { cloud(g, x, 38 + rnd(j, 23) * 40, 150 + rnd(j, 24) * 80, P, "puff"); }
      else if (c.k === "tower" && rnd(j, 25) < .55) { cloud(g, x, 196 + rnd(j, 23) * 20, 120 + rnd(j, 24) * 60, P, "tower"); }
      else cloud(g, x, 40 + rnd(j, 23) * 70, 74 + rnd(j, 24) * 70, P, "puff");
    }
    if (P.balloon) {
      const bx = ((VW * .55 - s * .012 - T * 4) % (VW + 160) + VW + 160) % (VW + 160) - 60, by = 92 + 6 * Math.sin(T * .9);
      balloon(g, bx, by, 1);
    }
    if (P.birds) {
      const base = ((T * 26 - s * .006) % (VW + 220) + VW + 220) % (VW + 220) - 110;
      g.strokeStyle = LC; g.lineWidth = .9;
      for (let i = 0; i < 5; i++) {
        const x = base - i * 11 + (i % 2) * 4, y = 74 + i * 4 - (i % 2) * 7, fl = 2.4 * Math.sin(T * 9 + i);
        g.beginPath(); g.moveTo(x - 4.5, y - fl); g.quadraticCurveTo(x - 2, y - 1, x, y); g.quadraticCurveTo(x + 2, y - 1, x + 4.5, y - fl); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
  function balloon(g: G, x: number, y: number, k: number) {
    g.save();
    const env = () => { g.beginPath(); g.moveTo(x, y - 26 * k); g.bezierCurveTo(x + 21 * k, y - 26 * k, x + 21 * k, y + 2 * k, x + 5 * k, y + 14 * k); g.lineTo(x - 5 * k, y + 14 * k); g.bezierCurveTo(x - 21 * k, y + 2 * k, x - 21 * k, y - 26 * k, x, y - 26 * k); g.closePath(); };
    env(); g.save(); g.clip();
    const cs = ["#F4B7C5", "#A9D9D0", "#FBF2DE", "#A9D9D0", "#F4B7C5"];
    for (let i = 0; i < 5; i++) { g.fillStyle = cs[i]; g.fillRect(x - 21 * k + i * 8.4 * k, y - 28 * k, 8.6 * k, 44 * k); }
    g.restore(); env(); g.lineWidth = 1; g.strokeStyle = LC; g.stroke();
    g.beginPath(); g.moveTo(x - 5 * k, y + 14 * k); g.lineTo(x - 4 * k, y + 20 * k); g.moveTo(x + 5 * k, y + 14 * k); g.lineTo(x + 4 * k, y + 20 * k); g.lineWidth = .7; g.stroke();
    g.fillStyle = "#A6714E"; g.fillRect(x - 4.5 * k, y + 20 * k, 9 * k, 6 * k); g.lineWidth = .9; g.strokeRect(x - 4.5 * k, y + 20 * k, 9 * k, 6 * k);
    g.restore();
  }

  /* ---- 산 ---- */
  function mtnRange(g: G, P: Pal, sp: number, base: number, C: number, h0: number, h1: number, salt: number, haze: number) {
    const off = s * sp + 500, j0 = Math.floor((off - 260) / C), j1 = Math.floor((off + VW + 260) / C);
    const hz = (c: string) => haze ? mix(c, P.sky[1], haze) : c;
    const a = hz(P.mtn.a), b = hz(P.mtn.b), sa = hz(WHITE), sb = hz(mix("#E2E4F2", P.mtn.b, .25));
    const full = P.mtn.snow >= .99;
    g.lineWidth = .9; g.strokeStyle = LC; g.lineJoin = "round";
    for (let j = j0; j <= j1; j++) {
      const x = j * C + rnd(j, salt) * C * .6 - off, h = h0 + (h1 - h0) * rnd(j, salt + 1), w = h * (.95 + .45 * rnd(j, salt + 2));
      const ay = base - h, mx = x + w * .14;
      g.beginPath(); g.moveTo(x, ay); g.lineTo(x - w, base + 6); g.lineTo(mx, base + 6); g.closePath(); g.fillStyle = full ? sa : a; g.fill();
      g.beginPath(); g.moveTo(x, ay); g.lineTo(mx, base + 6); g.lineTo(x + w, base + 6); g.closePath(); g.fillStyle = full ? mix(b, WHITE, .25) : b; g.fill();
      if (!full && P.mtn.snow > 0) {
        const f = Math.min(.9, .2 + P.mtn.snow * .55), ch = h * f, yl = ay + ch;
        const lx = x + (-w) * f, rx = x + w * f, n = 6;
        const cap = () => { g.beginPath(); g.moveTo(x, ay); g.lineTo(lx, yl); for (let i = 1; i < n; i++) g.lineTo(lx + (rx - lx) * i / n, yl + (i % 2 ? -ch * .2 : ch * .03)); g.lineTo(rx, yl); g.closePath(); };
        cap(); g.fillStyle = sa; g.fill();
        g.save(); g.beginPath(); g.moveTo(x, ay - 1); g.lineTo(mx, base + 6); g.lineTo(x + w + 2, base + 6); g.closePath(); g.clip(); cap(); g.fillStyle = sb; g.fill(); g.restore();
        g.globalAlpha *= .55; g.beginPath(); g.moveTo(lx, yl); for (let i = 1; i < n; i++) g.lineTo(lx + (rx - lx) * i / n, yl + (i % 2 ? -ch * .2 : ch * .03)); g.lineTo(rx, yl); g.lineWidth = .7; g.stroke(); g.globalAlpha /= .55; g.lineWidth = .9;
      }
      g.beginPath(); g.moveTo(x - w, base + 6); g.lineTo(x, ay); g.lineTo(x + w, base + 6); g.stroke();
      // 산등성이 결
      g.globalAlpha *= .35; g.beginPath(); g.moveTo(x, ay + 2); g.lineTo(mx, base); g.stroke(); g.globalAlpha /= .35;
    }
  }

  /* ---- 나무 · 집 · 양 ---- */
  function conifer(g: G, x: number, y: number, h: number, P: Pal, lw: number) {
    const c = P.con, hw = h * .2;
    g.fillStyle = "#7E5A48"; g.fillRect(x - h * .03, y - h * .2, h * .06, h * .2);
    g.lineWidth = lw; g.strokeStyle = LC; g.strokeRect(x - h * .03, y - h * .2, h * .06, h * .2);
    for (let i = 0; i < 3; i++) {
      const b = y - h * (.14 + .27 * i), a = b - h * (.44 - i * .04), w = hw * (1 - .24 * i);
      g.beginPath(); g.moveTo(x, a); g.lineTo(x + w, b); g.quadraticCurveTo(x + w * .5, b - h * .03, x + w * .25, b + h * .02); g.quadraticCurveTo(x, b - h * .02, x - w * .25, b + h * .02); g.quadraticCurveTo(x - w * .5, b - h * .03, x - w, b); g.closePath();
      g.fillStyle = c; g.fill(); g.stroke();
      if (P.conSnow > 0) {
        const sh = (b - a) * (.3 + .35 * P.conSnow), sw = w * (sh / (b - a));
        g.beginPath(); g.moveTo(x, a); g.lineTo(x + sw, a + sh); g.lineTo(x + sw * .3, a + sh * .82); g.lineTo(x, a + sh); g.lineTo(x - sw * .35, a + sh * .8); g.lineTo(x - sw, a + sh); g.closePath();
        g.fillStyle = WHITE; g.fill(); g.lineWidth = lw * .7; g.stroke(); g.lineWidth = lw;
      } else if (h > 30) {
        g.beginPath(); g.moveTo(x - w * .1, a + (b - a) * .35); g.lineTo(x - w * .45, b - (b - a) * .1); g.strokeStyle = shade(c, .2); g.lineWidth = lw * .9; g.stroke(); g.strokeStyle = LC; g.lineWidth = lw;
      }
    }
  }
  // 잎 없는 나무: 가지를 재귀로 갈라 끝으로 갈수록 가늘게 (먹선을 먼저 굵게 깔고 위에 줄기색)
  function bareTree(g: G, x: number, y: number, h: number, kind: string, P: Pal, sd: number, lw: number) {
    const st = P.tree, tc = "#7C5A4A", narrow = kind === "pop";
    const depth = h > 150 ? 4 : h > 45 ? 3 : 2;
    const segs: number[][] = [];
    const grow = (x0: number, y0: number, len: number, ang: number, w: number, d: number, id: number): void => {
      const x1 = x0 + Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len;
      segs.push([x0, y0, x1, y1, w, ang, d]);
      if (d <= 0) return;
      const spread = (narrow ? .22 : .42) + rnd(sd, id) * .22, k = .7 + rnd(sd, id + 3) * .1;
      grow(x1, y1, len * k, ang - spread + (rnd(sd, id + 5) - .5) * .15, w * .64, d - 1, id * 2 + 1);
      grow(x1, y1, len * k, ang + spread + (rnd(sd, id + 7) - .5) * .15, w * .64, d - 1, id * 2 + 2);
      if (d >= 2 && rnd(sd, id + 9) < .6) grow(x0 + (x1 - x0) * .5, y0 + (y1 - y0) * .5, len * .55, ang + (rnd(sd, id + 11) < .5 ? -1 : 1) * (spread + .25), w * .5, d - 2, id * 3 + 7);
    };
    grow(x, y, h * (narrow ? .42 : .36), (rnd(sd, 1) - .5) * .08, Math.max(1.1, h * .06), depth, 1);
    if (h > 26) { g.strokeStyle = LC; for (const q of segs) { g.lineWidth = q[4] + lw * 1.3; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke(); } }
    g.strokeStyle = tc; for (const q of segs) { g.lineWidth = q[4]; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke(); }
    const tips = segs.filter(q => q[6] === 0);
    if (st === "bareSnow") {
      g.strokeStyle = WHITE;
      for (const q of segs) { if (Math.abs(q[5]) < .35 || q[4] < .7) continue; g.lineWidth = q[4] * .55; g.beginPath(); g.moveTo(q[0], q[1] - q[4] * .45); g.lineTo(q[2], q[3] - q[4] * .45); g.stroke(); }
      g.fillStyle = WHITE; for (let i = 0; i < tips.length; i += 2) { const t = tips[i]; g.beginPath(); g.ellipse(t[2], t[3], Math.max(.8, h * .018), Math.max(.5, h * .009), 0, 0, TAU); g.fill(); }
      g.beginPath(); g.ellipse(x, y, h * .17, h * .03, 0, 0, TAU); g.fill(); g.lineWidth = lw * .7; g.strokeStyle = LC; g.stroke();
    } else if (st === "bud") {
      for (let i = 0; i < tips.length; i++) { const t = tips[i]; g.fillStyle = P.treeC[(i + sd) % 6 === 0 ? 1 : 0]; g.beginPath(); g.arc(t[2], t[3], Math.max(.8, h * .022), 0, TAU); g.fill(); }
    } else if (st === "late") {
      for (let i = 0; i < tips.length; i++) {
        if (rnd(sd, i + 30) < .35) continue; const t = tips[i], r = Math.max(.9, h * .02);
        g.fillStyle = P.treeC[i % 3]; g.beginPath(); g.arc(t[2], t[3], r, 0, TAU); g.arc(t[2] + r * 1.4, t[3] + r * .6, r * .85, 0, TAU); g.fill();
        if (h > 60) { g.lineWidth = .6; g.strokeStyle = LC; g.stroke(); }
      }
    }
  }
  function popPath(g: G, x: number, y: number, h: number) {   // 불꽃처럼 끝이 뾰족한 미루나무
    const top = y - h, base = y - h * .2, w = h * .12;
    g.beginPath(); g.moveTo(x, top);
    g.bezierCurveTo(x + w * 1.15, top + h * .22, x + w * 1.05, base - h * .06, x, base);
    g.bezierCurveTo(x - w * 1.05, base - h * .06, x - w * 1.15, top + h * .22, x, top); g.closePath();
    return w;
  }
  function tree(g: G, x: number, y: number, h: number, kind: string, P: Pal, sd: number, lw: number) {
    if (kind === "con") return conifer(g, x, y, h, P, lw);
    const st = P.tree;
    if (st === "bare" || st === "bareSnow" || st === "bud" || st === "late") return bareTree(g, x, y, h, kind, P, sd, lw);
    const tw = Math.max(1.2, h * .058);
    g.fillStyle = "#86594A"; g.fillRect(x - tw / 2, y - h * .5, tw, h * .5);
    g.lineWidth = lw; g.strokeStyle = LC; g.strokeRect(x - tw / 2, y - h * .5, tw, h * .5);
    const cc = P.treeC[Math.floor(rnd(sd, 9) * P.treeC.length)];
    const cx = x;
    let cy: number, R: number, cs: number[][] | null = null;
    if (kind === "pop") { R = popPath(g, x, y, h); cy = y - h * .58; g.lineWidth = lw * 2; g.strokeStyle = LC; g.stroke(); g.fillStyle = cc; g.fill(); }
    else {
      R = h * .23; cy = y - h * .68; const j1 = (rnd(sd, 11) - .5) * R * .25;
      cs = [[x, cy, R], [x - R * .78, cy + R * .32 + j1, R * .7], [x + R * .8, cy + R * .28 - j1, R * .72], [x + R * .15, cy - R * .55, R * .68], [x - R * .35, cy + R * .55, R * .6]];
      blob(g, cs, cc, lw);
    }
    if (h < 22) return;
    const dk = shade(cc, -.16), hl = shade(cc, .28);
    g.save(); if (cs) blobPath(g, cs); else popPath(g, x, y, h); g.clip();
    g.fillStyle = dk; g.globalAlpha *= .5;
    if (cs) { g.beginPath(); g.ellipse(cx + R * .2, cy + R * 1.05, R * 1.6, R * .55, 0, 0, TAU); g.fill(); }
    else { g.beginPath(); g.ellipse(cx + R * .6, cy + h * .1, R * .7, h * .3, 0, 0, TAU); g.fill(); }
    g.globalAlpha /= .5;
    const n = h > 120 ? 22 : 10, sx = cs ? R * 2.2 : R * 1.6, sy = cs ? R * 1.8 : h * .7;
    for (let i = 0; i < n; i++) { g.fillStyle = i % 3 ? dk : hl; g.beginPath(); g.arc(cx + (rnd(sd, 40 + i) - .5) * sx, cy + (rnd(sd, 50 + i) - .45) * sy, Math.max(.6, h * (.008 + rnd(sd, 55 + i) * .008)), 0, TAU); g.fill(); }
    g.fillStyle = hl; g.globalAlpha *= .5;
    g.beginPath(); g.ellipse(cx - R * .38, cy - R * (cs ? .42 : 1.6), R * .32, R * (cs ? .2 : .7), -.5, 0, TAU); g.fill();
    g.globalAlpha /= .5; g.restore();
    if (st === "blossom" && cc !== "#A9D38A") {
      for (let i = 0; i < (h > 120 ? 22 : 9); i++) { g.fillStyle = i % 3 ? WHITE : "#E5799B"; g.beginPath(); g.arc(cx + (rnd(sd, 60 + i) - .5) * R * 2.2, cy + (rnd(sd, 70 + i) - .5) * R * 1.7, Math.max(.8, h * .012), 0, TAU); g.fill(); }
    } else if (st === "turning" || st === "maple") {
      for (let i = 0; i < (h > 120 ? 14 : 6); i++) { g.fillStyle = P.treeC[(i + sd) % P.treeC.length]; g.beginPath(); g.arc(cx + (rnd(sd, 60 + i) - .5) * R * 2, cy + (rnd(sd, 70 + i) - .5) * R * 1.6, Math.max(.8, h * .018), 0, TAU); g.fill(); }
    }
  }
  const WALLS = ["#A9D3E6", "#F4B6C2", "#F6D98B", "#F3E7D0", "#C9E2B8"];
  function house(g: G, x: number, y: number, w: number, P: Pal, sd: number, lw: number) {
    const h = w * .72, wc = WALLS[Math.floor(rnd(sd, 2) * WALLS.length)], rc = rnd(sd, 3) < .55 ? "#8E4E3E" : "#C45A4E";
    g.lineWidth = lw; g.strokeStyle = LC;
    if (P.smoke && w > 9) {
      for (let k = 0; k < 3; k++) {
        const ph = (T * .45 + k / 3 + rnd(sd, 5)) % 1;
        g.fillStyle = `rgba(255,255,255,${((1 - ph) * .75).toFixed(3)})`;
        g.beginPath(); g.arc(x + w * .3 - ph * w * .5, y - h - w * .5 - ph * w * 1.1, w * (.06 + .1 * ph), 0, TAU); g.fill();
      }
    }
    if (w > 9) { g.fillStyle = rc; g.fillRect(x + w * .18, y - h - w * .42, w * .12, w * .26); g.strokeRect(x + w * .18, y - h - w * .42, w * .12, w * .26); }
    g.fillStyle = wc; g.fillRect(x - w / 2, y - h, w, h); g.strokeRect(x - w / 2, y - h, w, h);
    g.beginPath(); g.moveTo(x - w * .62, y - h); g.lineTo(x, y - h - w * .48); g.lineTo(x + w * .62, y - h); g.closePath(); g.fillStyle = rc; g.fill(); g.stroke();
    if (P.roofSnow) {
      g.beginPath(); g.moveTo(x - w * .64, y - h); g.lineTo(x, y - h - w * .5); g.lineTo(x + w * .64, y - h); g.lineTo(x + w * .5, y - h - w * .09); g.lineTo(x, y - h - w * .36); g.lineTo(x - w * .5, y - h - w * .09); g.closePath();
      g.fillStyle = WHITE; g.fill(); g.lineWidth = lw * .7; g.stroke(); g.lineWidth = lw;
    }
    if (w > 7) {
      const lit = P.lit && rnd(sd, 4) < P.lit + .3;
      g.fillStyle = lit ? "#FFD66B" : "#DCEBF5";
      g.fillRect(x - w * .34, y - h * .72, w * .24, w * .2); g.lineWidth = lw * .7; g.strokeRect(x - w * .34, y - h * .72, w * .24, w * .2);
      g.fillStyle = "#7A4B3A"; g.fillRect(x + w * .06, y - h * .58, w * .22, h * .58); g.strokeRect(x + w * .06, y - h * .58, w * .22, h * .58);
      if (lit) { g.fillStyle = "rgba(255,214,107,.25)"; g.beginPath(); g.arc(x - w * .22, y - h * .62, w * .35, 0, TAU); g.fill(); }
      g.lineWidth = lw;
    }
  }
  function sheep(g: G, x: number, y: number, z: number, lw: number) {
    g.strokeStyle = LC; g.lineWidth = lw;
    g.beginPath(); g.moveTo(x - z * .5, y + z * .5); g.lineTo(x - z * .5, y + z * 1.1); g.moveTo(x + z * .5, y + z * .5); g.lineTo(x + z * .5, y + z * 1.1); g.lineWidth = lw * 1.2; g.stroke();
    blob(g, [[x, y, z * .75], [x - z * .6, y + z * .1, z * .55], [x + z * .6, y + z * .12, z * .55], [x + z * .1, y - z * .35, z * .5]], "#FBF8F1", lw * .8);
    g.fillStyle = LC; g.beginPath(); g.ellipse(x - z * 1.15, y + z * .05, z * .32, z * .42, -.3, 0, TAU); g.fill();
  }
  function hay(g: G, x: number, y: number, r: number, P: Pal, lw: number) {
    const c = P.tree === "late" ? "#D9B060" : "#EBC85E";
    g.beginPath(); g.arc(x, y - r, r, 0, TAU); g.fillStyle = c; g.fill(); g.lineWidth = lw; g.strokeStyle = LC; g.stroke();
    g.strokeStyle = shade(c, -.25); g.lineWidth = lw * .8;
    g.beginPath(); g.arc(x, y - r, r * .62, .3, 5.6); g.stroke(); g.beginPath(); g.arc(x, y - r, r * .3, 1.5, 6.5); g.stroke();
  }
  function fence(g: G, x: number, y: number, len: number, sc: number, P: Pal, lw: number) {
    const c = "#9A6A4E", step = 17 * sc, ph = 13 * sc;
    g.strokeStyle = LC; g.lineWidth = lw;
    for (const yy of [y - ph * .75, y - ph * .35]) { g.fillStyle = c; g.fillRect(x, yy - 1.3 * sc, len, 2.6 * sc); g.strokeRect(x, yy - 1.3 * sc, len, 2.6 * sc); }
    for (let px = x; px <= x + len; px += step) { g.fillStyle = c; g.fillRect(px - 1.6 * sc, y - ph, 3.2 * sc, ph); g.strokeRect(px - 1.6 * sc, y - ph, 3.2 * sc, ph); }
    if (P.roofSnow) { g.fillStyle = WHITE; g.fillRect(x, y - ph * .75 - 3 * sc, len, 1.8 * sc); }
  }
  function sunflower(g: G, x: number, y: number, sc: number, sd: number, lw: number) {
    const h = (26 + rnd(sd, 3) * 10) * sc;
    g.strokeStyle = "#4E8A3E"; g.lineWidth = 1.6 * sc; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke();
    g.fillStyle = "#6AAA52"; g.beginPath(); g.ellipse(x - 4 * sc, y - h * .45, 4 * sc, 2 * sc, -.5, 0, TAU); g.fill();
    g.fillStyle = "#F6C83E"; g.strokeStyle = LC; g.lineWidth = lw * .7;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 4.6 * sc, y - h + Math.sin(a) * 4.6 * sc, 2.8 * sc, 1.5 * sc, a, 0, TAU); g.fill(); g.stroke(); }
    g.beginPath(); g.arc(x, y - h, 3.4 * sc, 0, TAU); g.fillStyle = "#7A4A2E"; g.fill(); g.stroke();
  }

  /* ---- 언덕 · 명소 ---- */
  const hillY = (x: number, off: number) => 236 - 8 * Math.sin((x + off) / 95) - 5 * Math.sin((x + off) / 41 + 1.3);
  function hotel(g: G, x: number, y: number, P: Pal, j: number) {
    const lw = 1, wall = "#F4A8B8", lit = P.lit > .5;
    // 언덕
    g.beginPath(); g.ellipse(x, y + 8, 96, 40, 0, Math.PI, TAU); g.closePath(); g.fillStyle = P.mound; g.fill(); g.lineWidth = lw; g.strokeStyle = LC; g.stroke();
    for (const [dx, dy] of [[-62, 0], [-48, -12], [52, -6], [66, 2], [36, -18]]) conifer(g, x + dx, y + dy + 6, 13, P, .7);
    // 케이블카
    const x1 = x - 62, y1 = y - 44, x2 = x - 215, y2 = y + 18;
    g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 8, x2, y2); g.lineWidth = .8; g.stroke();
    const ph = (T * .06 + j * .37) % 1, cxp = x1 + (x2 - x1) * ph, cyp = y1 + (y2 - y1) * ph + 8 * 4 * ph * (1 - ph) * .5;
    g.beginPath(); g.moveTo(cxp, cyp); g.lineTo(cxp, cyp + 4); g.stroke();
    g.fillStyle = "#E0626A"; g.fillRect(cxp - 5, cyp + 4, 10, 7); g.strokeRect(cxp - 5, cyp + 4, 10, 7);
    g.fillStyle = "#FFF4E8"; g.fillRect(cxp - 3.5, cyp + 5.5, 3, 2.5); g.fillRect(cxp + .5, cyp + 5.5, 3, 2.5);
    // 건물
    const b = y - 28;
    const win = (x0: number, y0: number, cols: number, rows: number, cw: number, rh: number) => { g.fillStyle = lit ? "#FFD66B" : "#FFF3F5"; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g.fillRect(x0 + c * cw, y0 + r * rh, cw * .55, rh * .55); };
    g.lineWidth = lw; g.strokeStyle = LC;
    for (const sx of [-1, 1]) {
      const wx = sx < 0 ? x - 64 : x + 22;
      g.fillStyle = wall; g.fillRect(wx, b - 32, 42, 32); g.strokeRect(wx, b - 32, 42, 32);
      g.fillStyle = P.roofSnow ? WHITE : "#E2737B"; g.fillRect(wx - 2, b - 37, 46, 6); g.strokeRect(wx - 2, b - 37, 46, 6);
      win(wx + 4, b - 27, 6, 3, 6.4, 8.4);
    }
    g.fillStyle = wall; g.fillRect(x - 22, b - 50, 44, 50); g.strokeRect(x - 22, b - 50, 44, 50);
    g.fillStyle = P.roofSnow ? WHITE : "#E2737B"; g.fillRect(x - 25, b - 55, 50, 6); g.strokeRect(x - 25, b - 55, 50, 6);
    win(x - 17, b - 46, 6, 4, 5.9, 8.6);
    g.fillStyle = "#9C4A5A"; g.beginPath(); g.moveTo(x - 6, b); g.lineTo(x - 6, b - 9); g.arc(x, b - 9, 6, Math.PI, TAU); g.lineTo(x + 6, b); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = wall; g.fillRect(x - 11, b - 66, 22, 12); g.strokeRect(x - 11, b - 66, 22, 12);
    g.beginPath(); g.arc(x, b - 66, 13, Math.PI, TAU); g.closePath(); g.fillStyle = P.roofSnow ? "#F3F0FA" : "#B9A7DD"; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x, b - 79); g.lineTo(x, b - 94); g.stroke();
    g.beginPath(); g.moveTo(x, b - 94); g.lineTo(x + 10, b - 90.5 + Math.sin(T * 4) * .8); g.lineTo(x, b - 87); g.closePath(); g.fillStyle = "#F07F95"; g.fill(); g.lineWidth = .7; g.stroke();
  }
  function castle(g: G, x: number, y: number, P: Pal) {
    const c = "#F2E7CE", rf = P.roofSnow ? WHITE : "#DE6A5F";
    g.lineWidth = 1; g.strokeStyle = LC;
    g.beginPath(); g.ellipse(x, y + 6, 58, 16, 0, Math.PI, TAU); g.closePath(); g.fillStyle = P.hill; g.fill(); g.stroke();
    g.fillStyle = c; g.fillRect(x - 30, y - 30, 60, 30); g.strokeRect(x - 30, y - 30, 60, 30);
    for (let k = 0; k < 7; k++) { g.fillRect(x - 30 + k * 9, y - 35, 5, 5); g.strokeRect(x - 30 + k * 9, y - 35, 5, 5); }
    g.fillStyle = "#6E5A66"; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x - 7, y - 11); g.arc(x, y - 11, 7, Math.PI, TAU); g.lineTo(x + 7, y); g.closePath(); g.fill(); g.stroke();
    for (const sx of [-1, 1]) {
      const tx = x + sx * 34;
      g.fillStyle = c; g.fillRect(tx - 8, y - 48, 16, 48); g.strokeRect(tx - 8, y - 48, 16, 48);
      g.beginPath(); g.moveTo(tx - 11, y - 48); g.lineTo(tx, y - 72); g.lineTo(tx + 11, y - 48); g.closePath(); g.fillStyle = rf; g.fill(); g.stroke();
      g.fillStyle = P.lit > .5 ? "#FFD66B" : "#6E5A66"; g.fillRect(tx - 2.5, y - 38, 5, 8); g.fillRect(tx - 2.5, y - 22, 5, 8);
    }
    g.fillStyle = P.lit > .5 ? "#FFD66B" : "#6E5A66"; g.fillRect(x - 20, y - 22, 5, 7); g.fillRect(x + 15, y - 22, 5, 7);
  }
  function church(g: G, x: number, y: number, P: Pal, j: number) {
    g.lineWidth = 1; g.strokeStyle = LC;
    house(g, x - 34, y + 2, 16, P, j * 7 + 1, .9); house(g, x + 30, y + 1, 18, P, j * 7 + 2, .9); house(g, x + 50, y + 3, 14, P, j * 7 + 3, .9);
    g.fillStyle = "#F8F4EB"; g.fillRect(x - 12, y - 24, 30, 24); g.strokeRect(x - 12, y - 24, 30, 24);
    g.beginPath(); g.moveTo(x - 15, y - 24); g.lineTo(x + 3, y - 38); g.lineTo(x + 21, y - 24); g.closePath(); g.fillStyle = P.roofSnow ? WHITE : "#C95A50"; g.fill(); g.stroke();
    g.fillStyle = "#F8F4EB"; g.fillRect(x - 20, y - 52, 13, 52); g.strokeRect(x - 20, y - 52, 13, 52);
    g.beginPath(); g.moveTo(x - 21, y - 52); g.bezierCurveTo(x - 23, y - 60, x - 13.5, y - 62, x - 13.5, y - 72); g.bezierCurveTo(x - 13.5, y - 62, x - 4, y - 60, x - 6, y - 52); g.closePath();
    g.fillStyle = P.roofSnow ? WHITE : "#4FA6A2"; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 13.5, y - 72); g.lineTo(x - 13.5, y - 79); g.stroke();
    g.fillStyle = P.lit > .5 ? "#FFD66B" : "#6E6A86"; g.beginPath(); g.arc(x - 13.5, y - 40, 3, 0, TAU); g.fill(); g.stroke();
    g.fillRect(x - 2, y - 17, 5, 8); g.fillRect(x + 8, y - 17, 5, 8);
  }
  function farm(g: G, x: number, y: number, P: Pal, j: number) {
    g.lineWidth = 1; g.strokeStyle = LC;
    // 사일로
    g.fillStyle = "#D9D4DF"; g.fillRect(x + 22, y - 44, 16, 44); g.strokeRect(x + 22, y - 44, 16, 44);
    g.beginPath(); g.arc(x + 30, y - 44, 8, Math.PI, TAU); g.closePath(); g.fillStyle = P.roofSnow ? WHITE : "#8B97B8"; g.fill(); g.stroke();
    // 헛간
    g.fillStyle = "#C9564E"; g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x - 26, y - 24); g.lineTo(x - 2, y - 40); g.lineTo(x + 22, y - 24); g.lineTo(x + 22, y); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 30, y - 22); g.lineTo(x - 2, y - 42); g.lineTo(x + 26, y - 22); g.lineWidth = 3.4; g.strokeStyle = P.roofSnow ? WHITE : "#6E3E36"; g.stroke(); g.lineWidth = 1; g.strokeStyle = LC;
    g.fillStyle = "#FBF3E6"; g.fillRect(x - 10, y - 18, 16, 18); g.strokeRect(x - 10, y - 18, 16, 18);
    g.beginPath(); g.moveTo(x - 10, y - 18); g.lineTo(x + 6, y); g.moveTo(x + 6, y - 18); g.lineTo(x - 10, y); g.stroke();
    g.fillStyle = P.lit > .5 ? "#FFD66B" : "#FBF3E6"; g.beginPath(); g.arc(x - 2, y - 29, 3.4, 0, TAU); g.fill(); g.stroke();
    tree(g, x - 44, y + 2, 34, "round", P, j * 3 + 5, .9);
  }
  function hills(g: G, P: Pal) {
    const off = s * .075;
    g.beginPath(); g.moveTo(-6, 330);
    for (let x = -6; x <= VW + 6; x += 6) g.lineTo(x, hillY(x, off));
    g.lineTo(VW + 6, 330); g.closePath(); g.fillStyle = P.hill; g.fill(); g.lineWidth = 1; g.strokeStyle = LC; g.stroke();
    // 언덕 위 작은 나무 줄
    const C = 22, j0 = Math.floor((off - 30) / C), j1 = Math.floor((off + VW + 30) / C);
    for (let j = j0; j <= j1; j++) {
      if (rnd(j, 31) < .45) continue;
      const x = j * C + rnd(j, 32) * 12 - off;
      tree(g, x, hillY(x, off) + 3, 12 + rnd(j, 33) * 6, rnd(j, 34) < .3 ? "con" : "round", P, j, .55);
    }
    // 명소
    const LC2 = 470, k0 = Math.floor((off - 300) / LC2), k1 = Math.floor((off + VW + 300) / LC2);
    for (let j = k0; j <= k1; j++) {
      const x = j * LC2 + 140 + rnd(j, 35) * 90 - off, y = hillY(x, off) + 5, kind = ((j % 4) + 4) % 4;
      if (kind === 0) hotel(g, x, y, P, j); else if (kind === 1) church(g, x, y, P, j); else if (kind === 2) castle(g, x, y, P); else farm(g, x, y, P, j);
    }
  }

  /* ---- 밭 띠 (조각보) ---- */
  const BANDS = [
    {y0:244, y1:262, sp:.11, C:150, fan:.03, hr:3.2, ic:38,  sc:.3,  kinds:["tree","con","house","tree","-","con","house","tree","-"]},
    {y0:261, y1:288, sp:.17, C:190, fan:.05, hr:4,   ic:60,  sc:.42, kinds:["tree","con","house","-","pop","tree","-","hay"]},
    {y0:287, y1:321, sp:.26, C:250, fan:.08, hr:5.2, ic:92,  sc:.6,  kinds:["tree","hay","-","con","sheep","house","tree","-"]},
    {y0:320, y1:362, sp:.38, C:330, fan:.11, hr:6.8, ic:130, sc:.85, kinds:["sheep","hay","pop","-","sheep","con","tree","-"]},
    {y0:361, y1:404, sp:.55, C:430, fan:.15, hr:8.5, ic:105, sc:1.15,kinds:["fence","sun","sheep","-","fence","bush","-"]},
  ];
  // 낮은 고도에서 내려다보니 앞쪽 밭 띠가 두 줄 더 보임
  BANDS.push({y0:403, y1:460, sp:.72, C:520, fan:.18, hr:10, ic:130, sc:1.4, kinds:["fence","bush","sheep","-","tree","hay","-"]},
             {y0:459, y1:540, sp:.9, C:620, fan:.2, hr:12, ic:150, sc:1.75, kinds:["bush","-","sheep","fence","-","sun"]});
  function band(g: G, P: Pal, bi: number) {
    const B = BANDS[bi], off = s * B.sp + 300 * bi, cx = VW / 2;
    const j0 = Math.floor((off - 120) / B.C) - 1, j1 = Math.floor((off + VW + 120) / B.C) + 1;
    const edge = (j: number) => j * B.C + (rnd(j, 90 + bi) - .5) * B.C * .55;
    const fx = (x: number, y: number) => x + (x - cx) * B.fan * (y - B.y0) / (B.y1 - B.y0) * 4;
    for (let j = j0; j <= j1; j++) {
      const xa = edge(j) - off, xb = edge(j + 1) - off;
      const [c, tex] = P.patches[Math.floor(rnd(j, 100 + bi) * P.patches.length)];
      const pt = pattern(g, c, tex, bi >= 3);
      if (pt.setTransform) pt.setTransform(new DOMMatrix([.5, 0, 0, .5, -(off % 24), B.y0]));
      g.beginPath(); g.moveTo(xa, B.y0); g.lineTo(xb, B.y0); g.lineTo(fx(xb, B.y1), B.y1); g.lineTo(fx(xa, B.y1), B.y1); g.closePath();
      g.fillStyle = pt; g.fill();
      g.beginPath(); g.moveTo(xa, B.y0); g.lineTo(fx(xa, B.y1), B.y1); g.lineWidth = .7; g.strokeStyle = shade(c, -.3); g.stroke();
    }
    // 생울타리 (윗줄)
    if (bi > 0) {
      const r = B.hr * .72, HC = 240, h0 = Math.floor((off - 60) / HC), h1 = Math.floor((off + VW + 60) / HC);
      for (let k = h0; k <= h1; k++) {
        if (rnd(k, 120 + bi) < .5) continue;
        const xs = k * HC + rnd(k, 121) * 40 - off, xe = (k + 1) * HC - rnd(k, 122) * 50 - off, cs = [];
        for (let x = xs; x <= xe; x += r * 1.5) cs.push([x, B.y0 + (rnd(Math.round(x + off), 7) - .5) * r * .4, r * (.85 + .3 * rnd(Math.round(x + off), 8))]);
        blobPath(g, cs); g.rect(xs, B.y0, xe - xs, r * .7);
        g.lineWidth = 1.3; g.strokeStyle = LC; g.stroke(); g.fillStyle = P.hedge; g.fill();
        if (P.roofSnow) { g.fillStyle = WHITE; for (const q of cs) { g.beginPath(); g.ellipse(q[0], q[1] - q[2] * .55, q[2] * .7, q[2] * .32, 0, 0, TAU); g.fill(); } }
      }
    }
    // 들 위 물건
    const IC = B.ic, i0 = Math.floor((off - 80) / IC), i1 = Math.floor((off + VW + 80) / IC), lw = Math.max(.6, 1.1 * B.sc + .2);
    for (let j = i0; j <= i1; j++) {
      const kind = B.kinds[((j % B.kinds.length) + B.kinds.length) % B.kinds.length];
      if (kind === "-") continue;
      const r0 = rnd(j, 140 + bi), x = j * IC + r0 * IC * .6 - off, y = B.y0 + (B.y1 - B.y0) * (.32 + .5 * rnd(j, 141 + bi)), sc = B.sc;
      if (kind === "tree" || kind === "pop" || kind === "con") tree(g, x, y, 64 * sc * (.75 + .5 * rnd(j, 142)), kind, P, j * 13 + bi, lw);
      else if (kind === "house") { house(g, x, y, 22 * sc, P, j * 5 + bi, lw); if (rnd(j, 143) < .6) house(g, x + 20 * sc, y + 1, 18 * sc, P, j * 5 + bi + 1, lw); }
      else if (kind === "hay") { if (P.hay) { hay(g, x, y, 6 * sc, P, lw); if (rnd(j, 144) < .7) hay(g, x + 16 * sc, y + 2 * sc, 5.6 * sc, P, lw); if (rnd(j, 145) < .4) hay(g, x - 14 * sc, y + 3 * sc, 6 * sc, P, lw); } }
      else if (kind === "sheep") { if (P.sheep) { const n = 2 + Math.floor(rnd(j, 146) * 3); for (let q = 0; q < n; q++) sheep(g, x + q * 14 * sc + rnd(q, j) * 6 * sc, y + (q % 2) * 4 * sc, 5.2 * sc, lw * .8); } }
      else if (kind === "fence") { if (rnd(j, 147) < .75) fence(g, x - 60, y + 8, 150, sc * .9, P, lw); }
      else if (kind === "sun") { if (P.sunfl) for (let q = 0; q < 5; q++) sunflower(g, x + q * 12 * sc, y + 6 + (q % 2) * 3, sc * .9, j * 7 + q, lw); }
      else if (kind === "bush") {
        const cc = P.tree === "bareSnow" ? "#E9E5F0" : P.hedge;
        blob(g, [[x, y, 9 * sc], [x - 8 * sc, y + 3 * sc, 7 * sc], [x + 8 * sc, y + 3 * sc, 7 * sc]], cc, lw);
        if (P.bush) for (let q = 0; q < 6; q++) { g.fillStyle = q % 2 ? "#F6B2C8" : WHITE; g.beginPath(); g.arc(x + (rnd(j, 150 + q) - .5) * 20 * sc, y + (rnd(j, 160 + q) - .6) * 12 * sc, 1.6 * sc, 0, TAU); g.fill(); }
      }
    }
  }

  function drawGround(g: G, P: Pal) {
    mtnRange(g, P, .02, 238, 118, 66, 118, 1, .42);
    mtnRange(g, P, .034, 250, 165, 96, 152, 5, 0);
    hills(g, P);
    for (let b = 0; b < BANDS.length; b++) band(g, P, b);
  }

  /* ---- 가까운 층: 빠르게 지나가는 나무 · 전봇대 · 전선 (막 떠오른 낮은 고도에서 내려다봄) ---- */
  function drawNear(g: G, P: Pal) {
    const C = 300, j0 = Math.floor((s - 200) / C), j1 = Math.floor((s + VW + 200) / C);
    const PC = 640, k0 = Math.floor((s - 300) / PC), k1 = Math.floor((s + VW + 300) / PC), px = (k: number) => k * PC + 330 - s;
    // 전선은 나무 뒤
    g.strokeStyle = LC; g.lineWidth = 1;
    for (let k = k0 - 1; k <= k1; k++) { const a = px(k), b = px(k + 1); for (const o of [-20, 20]) { g.beginPath(); g.moveTo(a + o, 318); g.quadraticCurveTo((a + b) / 2 + o, 318 + 70, b + o, 318); g.stroke(); } }
    for (let k = k0; k <= k1; k++) {
      const x = px(k);
      g.fillStyle = "#8A6656"; g.lineWidth = 1.2; g.fillRect(x - 3.5, 306, 7, 260); g.strokeRect(x - 3.5, 306, 7, 260);
      g.fillStyle = "#7A5A4C"; g.fillRect(x - 26, 314, 52, 5); g.strokeRect(x - 26, 314, 52, 5);
      g.fillStyle = "#EDEAF2"; for (const o of [-20, 20]) { g.beginPath(); g.ellipse(x + o, 312.5, 2, 2.5, 0, 0, TAU); g.fill(); g.stroke(); }
      if (P.roofSnow) { g.fillStyle = WHITE; g.fillRect(x - 26, 312, 52, 2.2); }
    }
    for (let j = j0; j <= j1; j++) {
      if (rnd(j, 77) > .55) continue;
      const x = j * C + rnd(j, 78) * 120 - s, kr = rnd(j, 79), kind = kr < .5 ? "round" : kr < .75 ? "pop" : "con";
      tree(g, x, 540, 175 + rnd(j, 80) * 70, kind, P, j, 1.4);
    }
  }
  // 달이 바뀔 때 창을 휙 가리는 구름 덩어리 (계절이 바뀔 때는 긴 구름 속)
  function cloudBank(g: G, ox: number, len: number, P: Pal) {
    const storm = P.cloud.k === "storm", c1 = storm ? "#D3D7E2" : WHITE, c2 = mix(c1, P.sky[0], .35), r = 36, cs = [];
    for (let y = -30, i = 0; y < SH + 40; y += r * 1.05, i++) {
      cs.push([ox + r + (rnd(i, 1) - .5) * 18, y, r * (.85 + rnd(i, 2) * .45)]);
      cs.push([ox + len - r + (rnd(i, 3) - .5) * 18, y, r * (.85 + rnd(i, 4) * .45)]);
    }
    blobPath(g, cs); g.rect(ox + r, -40, len - r * 2, SH + 90);
    g.lineWidth = 2.6; g.strokeStyle = LC; g.stroke(); g.fillStyle = c1; g.fill();
    g.save(); blobPath(g, cs); g.rect(ox + r, -40, len - r * 2, SH + 90); g.clip();
    g.fillStyle = c2; g.globalAlpha = .22;
    for (let i = 0; i < Math.max(4, len / 30); i++) { g.beginPath(); g.arc(ox + rnd(i, 7) * len, rnd(i, 8) * SH, 16 + rnd(i, 9) * 26, 0, TAU); g.fill(); }
    g.globalAlpha = 1; g.restore();
  }
  /* ---- 날리는 것 · 창에 맺힌 빗방울 ---- */
  const PMAX = 130;
  const parts: Part[] = Array.from({ length: PMAX }, () => ({ dead: true, t: "", x: 0, y: 0, r: 0, rot: 0, vr: 0, ph: 0, vy: 0, vx: 0, sz: 0, c: "" }));
  let drops: Drop[] = [];
  function initDrops() {
    const n = mobile ? 22 : 40;
    drops = Array.from({length: n}, () => ({x: Math.random() * VW, y: Math.random() * SH, r: 1.4 + Math.random() * 3, vy: Math.random() < .35 ? 10 + Math.random() * 30 : 0}));
  }
  function spawn(p: Part, type: string, anyY?: boolean) {
    p.dead = false; p.t = type; p.x = Math.random() * VW * 1.25; p.y = anyY ? Math.random() * SH : -10 - Math.random() * 40;
    p.r = Math.random(); p.rot = Math.random() * TAU; p.vr = (Math.random() - .5) * 5; p.ph = Math.random() * TAU;
    if (type === "snow") { p.vy = 20 + p.r * 34; p.vx = -8; p.sz = 1.2 + p.r * 2.4; }
    else if (type === "rain") { p.vy = 520 + p.r * 160; p.vx = -110; p.sz = 12 + p.r * 10; }
    else if (type === "petal") { p.vy = 26 + p.r * 22; p.vx = -24; p.sz = 2.6 + p.r * 1.6; }
    else if (type === "leaf") { p.vy = 34 + p.r * 30; p.vx = -30; p.sz = 3.2 + p.r * 2; p.c = ["#E9853F", "#D9573B", "#EFC03F", "#C9763A"][Math.floor(Math.random() * 4)]; }
    else if (type === "seed") { p.vy = 8 + p.r * 10; p.vx = -18; p.sz = 1.3 + p.r; }
  }
  function partTarget(P: Pal) { return Math.round(P.part.n * (mobile ? .55 : 1)); }
  function resetParts(P: Pal) { const n = partTarget(P); parts.forEach((p, i) => { if (i < n && P.part.t !== "none") spawn(p, P.part.t, true); else p.dead = true; }); }
  function stepParts(dt: number, P: Pal) {
    const n = partTarget(P), rel = v * .16;
    for (let i = 0; i < PMAX; i++) {
      const p = parts[i];
      if (p.dead) { if (i < n && P.part.t !== "none" && Math.random() < dt * 4) spawn(p, P.part.t, false); continue; }
      if (P.part.t !== "none" && p.t !== P.part.t && Math.random() < dt * 1.5) { spawn(p, P.part.t, false); continue; }
      if (P.part.t === "none" && Math.random() < dt * .8) { p.dead = true; continue; }
      p.ph += dt * 2; p.rot += p.vr * dt;
      p.x += (p.vx - rel * (p.t === "rain" ? .5 : 1) + (p.t === "rain" ? 0 : Math.sin(p.ph) * 14)) * dt; p.y += p.vy * dt;
      if (p.y > SH + 12 || p.x < -30) { if (i < n && P.part.t !== "none") spawn(p, P.part.t, false); else p.dead = true; }
    }
  }
  function drawParts(g: G) {
    for (const p of parts) {
      if (p.dead) continue;
      if (p.t === "snow") { g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.arc(p.x, p.y, p.sz, 0, TAU); g.fill(); }
      else if (p.t === "rain") { g.strokeStyle = "rgba(240,246,255,.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.sz * .2 + v * .004, p.y - p.sz); g.stroke(); }
      else if (p.t === "seed") { g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(p.x, p.y, p.sz, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = .6; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + 2, p.y + 3); g.stroke(); }
      else {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, .55 + .45 * Math.sin(p.ph * 1.6));
        if (p.t === "petal") { g.fillStyle = "#F7BACB"; g.beginPath(); g.ellipse(0, 0, p.sz, p.sz * .62, 0, 0, TAU); g.fill(); g.strokeStyle = "#D97E9C"; g.lineWidth = .6; g.stroke(); }
        else { g.fillStyle = p.c; g.beginPath(); g.moveTo(-p.sz, 0); g.quadraticCurveTo(0, -p.sz * .8, p.sz, 0); g.quadraticCurveTo(0, p.sz * .8, -p.sz, 0); g.fill(); g.strokeStyle = LC; g.lineWidth = .6; g.stroke(); }
        g.restore();
      }
    }
  }
  function drawDrops(g: G, a: number, dt: number) {
    if (a < .02) return;
    g.globalAlpha = a;
    for (const d of drops) {
      d.y += d.vy * dt; d.x -= d.vy * dt * .15;
      if (d.y > SH + 6) { d.y = -4; d.x = Math.random() * VW; }
      if (d.vy) { g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = d.r * .7; g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x + d.r * 1.2, d.y - d.r * 7); g.stroke(); }
      g.fillStyle = "rgba(220,232,250,.28)"; g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.fill();
      g.strokeStyle = "rgba(255,255,255,.65)"; g.lineWidth = .6; g.stroke();
      g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(d.x - d.r * .35, d.y - d.r * .35, d.r * .28, 0, TAU); g.fill();
    }
    // 바람에 비스듬한 빗줄기
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .8;
    for (let i = 0; i < (mobile ? 8 : 14); i++) {
      const x = (rnd(i, 200) * VW * 1.3 - T * 60) % (VW * 1.3), y = rnd(i, 201) * SH;
      const xx = x < 0 ? x + VW * 1.3 : x;
      g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + 24, y - 6); g.stroke();
    }
    g.globalAlpha = 1;
  }

  function size() {
    const w = win.clientWidth, h = win.clientHeight; if (!w || !h) return;
    mobile = innerWidth <= 760;
    const dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [cvB, cvN, cvF]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    K = cvB.height / 400; VW = (w / h * 400) / Z; SH = (400 - TY) / Z; VMAX = VW * 1.75;
    initDrops(); render(0);
  }
  function startTr(to: number, kindOverride?: string) {
    const kind = kindOverride || (TUNNEL.has(cur + "-" + to) ? "tunnel" : "tree");
    const len = kind === "tunnel" ? Math.round(VW * 1.1) : 170;
    tr = { to, kind, len, so: len / 2, a: s + VW + 24 };
  }
  function render(dt: number) {
    const A = PAL[cur], Bp = tr ? PAL[tr.to] : null;
    for (const g of [gB, gN, gF]) { g.setTransform(K * Z, 0, 0, K * Z, 0, K * TY); g.lineJoin = "round"; g.lineCap = "round"; g.clearRect(-10, -40, VW + 20, SH + 80); }
    const clipX = (g: G, x0: number, x1: number) => { g.save(); g.beginPath(); g.rect(x0, -40, x1 - x0, SH + 80); g.clip(); };
    if (!tr) { drawSky(gB, A, 1); drawGround(gB, A); drawNear(gN, A); }
    else if (Bp) {
      const sx = clamp(tr.a + tr.so - s, -1, VW + 1);
      if (sx > 0) { clipX(gB, -10, sx); drawSky(gB, A, 1); drawGround(gB, A); gB.restore(); clipX(gN, -10, sx); drawNear(gN, A); gN.restore(); }
      if (sx < VW) { clipX(gB, sx, VW + 10); drawSky(gB, Bp, 1); drawGround(gB, Bp); gB.restore(); clipX(gN, sx, VW + 10); drawNear(gN, Bp); gN.restore(); }
      cloudBank(gN, tr.a - s, tr.len, Bp);
    }
    const PD = PAL[disp < 0 ? cur : disp];
    if (dt) stepParts(dt, PD);
    if (tr) { const a = tr.a - s + 36, b = tr.a + tr.len - 36 - s; gF.save(); gF.beginPath(); gF.rect(-20, -40, Math.max(0, a + 20), SH + 80); gF.rect(b, -40, VW + 60, SH + 80); gF.clip(); drawParts(gF); gF.restore(); }
    else drawParts(gF);
    const f = tr ? clamp((VW - (tr.a + tr.so - s)) / VW, 0, 1) : 0;
    drawDrops(gF, A.glass * (1 - f) + (Bp ? Bp.glass * f : 0), dt);
    cvN.classList.toggle("moving", v > VMAX * 0.3);
  }
  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now; T += dt;
    v += (vT - v) * Math.min(1, dt * (vT > v ? 1.9 : 1.5)); if (vT === 0 && v < 3) v = 0;
    s += v * dt;
    if (tr) {
      if (tr.a + tr.len - s < -24) {
        cur = tr.to; tr = null; hold = 0;
        if (playing) { seqI++; if (seqI >= SEQ.length - 1) { playing = false; vT = 0; finish(); } }
        else if (stopAfter) { vT = 0; stopAfter = false; }
      }
    } else if (playing && v > VMAX * 0.5) {
      hold += dt; if (hold > (seqI === 0 ? 0.7 : 0.28)) startTr(SEQ[seqI + 1]);
    }
    const dm = tr && tr.a + tr.so - s < VW / 2 ? tr.to : cur;
    if (dm !== disp) { disp = dm; o.onMonth(dm); }
    render(dt);
    if (isVisible) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && isVisible && !reduce) { last = 0; raf = requestAnimationFrame(frame); } }
  function snapTo(m: number, sv?: number) { playing = false; tr = null; cur = m; disp = m; if (sv != null) s = sv; v = 0; vT = 0; resetParts(PAL[m]); for (let i = 0; i < 30; i++) stepParts(0.05, PAL[m]); o.onMonth(m); render(0); }
  /** 처음 보일 때 — 덮개만 올라감 (가장 싼 달 그림 그대로 · 한 번만) */
  function reveal() {
    if (reduce) { o.onShade("open"); return; }
    o.onShade("opening");
    const my = ++token;
    later(() => { if (my === token) o.onShade("open"); }, 760);
  }
  /** 다시 보기 — 덮개가 내려왔다 올라가며 1월부터 가장 싼 달까지 지남 */
  function play() {
    const my = ++token;
    snapTo(SEQ[0], 0);
    o.onShade("closed");
    later(() => {
      if (my !== token) return;
      o.onShade("opening");
      later(() => { if (my !== token) return; playing = true; seqI = 0; hold = 0; vT = VMAX; kick(); }, 650);
    }, 260);
  }
  function finish() { o.onMonth(lowest); o.onShade("open"); }
  function jumpTo(m: number) {
    ++token; o.onShade("open");
    if (reduce) { snapTo(m, 5000 + m * 1700); return; }
    playing = false;
    if (tr) { cur = tr.to; tr = null; }
    if (m === cur) { o.onMonth(m); return; }
    startTr(m, "tree"); vT = VMAX; stopAfter = true; kick();
  }

  size();
  snapTo(lowest, 5000 + lowest * 1700);
  if (reduce) o.onShade("open");
  return {
    size,
    visible(on, ratio) {
      isVisible = on;
      if (on && !started && ratio >= 0.35) { started = true; reveal(); }
      if (on) kick();
    },
    replay() { if (reduce) { jumpTo(lowest); return; } play(); },
    jumpTo,
    destroy() { ++token; timers.forEach(clearTimeout); timers = []; if (raf) cancelAnimationFrame(raf); raf = 0; isVisible = false; },
  };
}

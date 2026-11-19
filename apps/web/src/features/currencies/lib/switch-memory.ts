// 전환 기억 — 직전에 보이던 통화의 값을 모듈 단위로 한 번만 넘겨 줌 (작업 0231 · 테스트 switch-motion.test.ts)
//   통화 상세가 새로 그려질 때(클라이언트 이동) 기억에서 직전 값을 읽어 거기서 새 값으로 카운트업 · 이동 — 처음 들어옴 · 새로 고침은 기억이 없어 움직임 없이 최종
//   기억은 10초가 지나면 쓰지 않음 · 한 번 꺼내면 비움 · 같은 통화면 안 돌려줌

export type SwitchSnapshot = {
  code: string;
  big: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  pos: number | null;
  /** 입력 칸 금액 */
  amount: number | null;
  /** 글자판 결과(원 · 정수) — 글자판이 거기서 굴러가기 시작함 (선택) */
  won?: number | null;
  at: number;
};

const FRESH_MS = 10_000;
let last: SwitchSnapshot | null = null;

export function rememberSwitch(s: SwitchSnapshot): void {
  last = s;
}

/** 직전에 보이던 다른 통화의 값을 한 번만 돌려주고 비움 · 같은 통화 · 기억 없음 · 10초 넘게 지난 기억은 null */
export function takeSwitchFrom(newCode: string, now: number = Date.now()): SwitchSnapshot | null {
  const s = last;
  if (!s || s.code === newCode || now - s.at > FRESH_MS) return null;
  last = null;
  return s;
}

export function clearSwitch(): void {
  last = null;
  taken = null;
}

/** 지금 통화의 값을 기억에 합쳐 넣을 때 쓸 스냅샷 — 같은 통화의 기억이 있으면 거기에 덮어씀 · 시각은 지금 */
export function withSwitch(code: string, part: Partial<Omit<SwitchSnapshot, "code" | "at">>, now: number = Date.now()): SwitchSnapshot {
  const base: SwitchSnapshot = last && last.code === code ? last : { code, big: null, min: null, max: null, avg: null, pos: null, amount: null, won: null, at: now };
  return { ...base, ...part, at: now };
}

/** 기억이 아직 새 것이면 시각만 지금으로 — 오래 보고 있다가 고르는 경우에도 이어 가기 */
export function touchSwitch(now: number = Date.now()): void {
  if (last) last = { ...last, at: now };
}

// 새 페이지가 여러 부품에서 같은 "직전 값"을 읽을 수 있게 — 이동 한 번당 한 번만 꺼내 두고 나눠 줌
let taken: { code: string; snap: SwitchSnapshot | null } | null = null;

/** 이동한 통화의 직전 값 — 같은 이동 안에서는 어느 부품이 불러도 같은 값(처음 부른 때 꺼냄) */
export function switchFrom(code: string, now: number = Date.now()): SwitchSnapshot | null {
  if (taken && taken.code === code) return taken.snap;
  const snap = takeSwitchFrom(code, now);
  taken = { code, snap };
  return snap;
}

/** 이동을 막 마쳤을 때(새 통화가 값을 기억에 넣기 시작할 때) 나눠 주던 값을 비움 */
export function releaseSwitch(): void {
  taken = null;
}

// ── 날아가는 국기의 출발 자리 (칩 국기의 화면 위치) — 칩을 누른 순간 적어 두고 새 페이지가 한 번 읽음
export type FlyOrigin = { x: number; y: number; width: number; height: number };
let origin: FlyOrigin | null = null;
export const setFlyOrigin = (o: FlyOrigin | null): void => {
  origin = o;
};
export const takeFlyOrigin = (): FlyOrigin | null => {
  const o = origin;
  origin = null;
  return o;
};

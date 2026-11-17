// 여행지 나라 표 · 물가 묶음 — 여행 물가 페이지 · 통화 상세가 같이 씀 (순수 함수 · 테스트 있음)
// 세계은행 안내대로 정밀 순위 대신 "싼 편 · 비슷 · 비싼 편" 묶음 (docs/domain/travel-price.md)
import type { Region } from "./currency";
import type { PriceLevels } from "../contracts/prices";

type Country = { name: string; flag: string; currency: string | null; region: Exclude<Region, "other"> };

/** 한국에서 여행을 많이 가는 나라 (가정) · ISO 3166-1 alpha-3 → 한국어 이름 · 국기(alpha-2) · 쓰는 통화 */
export const TRAVEL_COUNTRIES: Record<string, Country> = {
  JPN: { name: "일본", flag: "JP", currency: "JPY", region: "asia" },
  CHN: { name: "중국", flag: "CN", currency: "CNH", region: "asia" },
  TWN: { name: "대만", flag: "TW", currency: "TWD", region: "asia" },
  HKG: { name: "홍콩", flag: "HK", currency: "HKD", region: "asia" },
  MAC: { name: "마카오", flag: "MO", currency: null, region: "asia" },
  SGP: { name: "싱가포르", flag: "SG", currency: "SGD", region: "asia" },
  THA: { name: "태국", flag: "TH", currency: "THB", region: "asia" },
  VNM: { name: "베트남", flag: "VN", currency: "VND", region: "asia" },
  MYS: { name: "말레이시아", flag: "MY", currency: "MYR", region: "asia" },
  IDN: { name: "인도네시아", flag: "ID", currency: "IDR", region: "asia" },
  PHL: { name: "필리핀", flag: "PH", currency: null, region: "asia" },
  KHM: { name: "캄보디아", flag: "KH", currency: null, region: "asia" },
  LAO: { name: "라오스", flag: "LA", currency: null, region: "asia" },
  MNG: { name: "몽골", flag: "MN", currency: null, region: "asia" },
  IND: { name: "인도", flag: "IN", currency: null, region: "asia" },
  USA: { name: "미국", flag: "US", currency: "USD", region: "americas" },
  CAN: { name: "캐나다", flag: "CA", currency: "CAD", region: "americas" },
  MEX: { name: "멕시코", flag: "MX", currency: null, region: "americas" },
  GUM: { name: "괌", flag: "GU", currency: "USD", region: "americas" },
  GBR: { name: "영국", flag: "GB", currency: "GBP", region: "europe" },
  FRA: { name: "프랑스", flag: "FR", currency: "EUR", region: "europe" },
  DEU: { name: "독일", flag: "DE", currency: "EUR", region: "europe" },
  ITA: { name: "이탈리아", flag: "IT", currency: "EUR", region: "europe" },
  ESP: { name: "스페인", flag: "ES", currency: "EUR", region: "europe" },
  PRT: { name: "포르투갈", flag: "PT", currency: "EUR", region: "europe" },
  NLD: { name: "네덜란드", flag: "NL", currency: "EUR", region: "europe" },
  AUT: { name: "오스트리아", flag: "AT", currency: "EUR", region: "europe" },
  GRC: { name: "그리스", flag: "GR", currency: "EUR", region: "europe" },
  FIN: { name: "핀란드", flag: "FI", currency: "EUR", region: "europe" },
  CHE: { name: "스위스", flag: "CH", currency: "CHF", region: "europe" },
  CZE: { name: "체코", flag: "CZ", currency: null, region: "europe" },
  HUN: { name: "헝가리", flag: "HU", currency: null, region: "europe" },
  DNK: { name: "덴마크", flag: "DK", currency: "DKK", region: "europe" },
  NOR: { name: "노르웨이", flag: "NO", currency: "NOK", region: "europe" },
  SWE: { name: "스웨덴", flag: "SE", currency: "SEK", region: "europe" },
  TUR: { name: "튀르키예", flag: "TR", currency: null, region: "europe" },
  ARE: { name: "아랍에미리트", flag: "AE", currency: "AED", region: "mideast" },
  SAU: { name: "사우디아라비아", flag: "SA", currency: "SAR", region: "mideast" },
  AUS: { name: "호주", flag: "AU", currency: "AUD", region: "oceania" },
  NZL: { name: "뉴질랜드", flag: "NZ", currency: "NZD", region: "oceania" },
};

export type Band = "cheap" | "similar" | "pricey";

/** 한국 대비 0.9 미만 = 싼 편 · 1.1 초과 = 비싼 편 · 그 사이 = 비슷 (가정 · 경계는 docs/domain/travel-price.md) */
export const BAND_EDGE = { cheap: 0.9, pricey: 1.1 } as const;

export const BANDS: { id: Band; label: string }[] = [
  { id: "cheap", label: "한국보다 싼 편" },
  { id: "similar", label: "한국과 비슷" },
  { id: "pricey", label: "한국보다 비싼 편" },
];

export const bandOf = (relative: number): Band => (relative < BAND_EDGE.cheap ? "cheap" : relative > BAND_EDGE.pricey ? "pricey" : "similar");

/** 1.2 → "20% 비쌈" · 0.52 → "48% 쌈" · 반올림해 0 이면 "거의 같음" */
export function relativeText(relative: number): string {
  const pct = Math.round((relative - 1) * 100);
  if (pct === 0) return "거의 같음";
  return pct > 0 ? `${pct}% 비쌈` : `${-pct}% 쌈`;
}

export type TravelRow = PriceLevels["rows"][number] & Country & { band: Band };

/**
 * 물가 응답 → 표에 있는 나라만 · 묶음별로 싼 나라부터
 * 표에 있어도 응답에 없으면 missing 으로 (TRV-02: 지어내지 않음) · 기준 나라(한국)는 뺌
 */
export function travelBands(levels: PriceLevels): { bands: { id: Band; label: string; rows: TravelRow[] }[]; missing: string[]; years: number[] } {
  const byCountry = new Map(levels.rows.map((r) => [r.country, r]));
  const rows: TravelRow[] = [];
  const missing: string[] = [];
  for (const [code, meta] of Object.entries(TRAVEL_COUNTRIES)) {
    if (code === levels.base) continue;
    const row = byCountry.get(code);
    if (row) rows.push({ ...row, ...meta, band: bandOf(row.relative) });
    else missing.push(code);
  }
  rows.sort((a, b) => a.relative - b.relative);
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
  return { bands: BANDS.map((b) => ({ ...b, rows: rows.filter((r) => r.band === b.id) })).filter((b) => b.rows.length > 0), missing, years };
}

/** 통화 → 그 통화를 쓰는 여행지 나라들 (통화 상세에서 물가 링크) */
export const countriesOf = (currency: string) => Object.entries(TRAVEL_COUNTRIES).filter(([, c]) => c.currency === currency).map(([code]) => code);

/** 월 단위 지표 한 점 — period 는 YYYY-MM (통계청 국제항공료 지수 등) */
export type MonthPoint = { period: string; value: number };

const monthIndex = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;

/**
 * 가장 최근 달부터 36개월(최근 달 포함)만 보고 달(1~12)마다 평균 · n 은 쓴 값의 수 · 값이 없는 달은 키가 없음
 * 홈(여행 타이밍)과 /flights 가 같은 계산을 쓰도록 여기 한 곳에 둠 — 기능 폴더끼리 직접 가져오지 못함 (작업 0164 · 0169)
 */
export function monthlyAverages(points: MonthPoint[]): Record<number, { avg: number; n: number }> {
  if (points.length === 0) return {};
  const last = Math.max(...points.map((p) => monthIndex(p.period)));
  const sums: Record<number, { sum: number; n: number }> = {};
  for (const p of points) {
    if (monthIndex(p.period) <= last - 36) continue;
    const m = Number(p.period.slice(5, 7));
    const s = (sums[m] ??= { sum: 0, n: 0 });
    s.sum += p.value;
    s.n += 1;
  }
  return Object.fromEntries(Object.entries(sums).map(([m, s]) => [Number(m), { avg: s.sum / s.n, n: s.n }]));
}

/** 3D 비행기 모델 파일 주소 · 출처 표시 — CC-BY 4.0 은 출처 표시가 조건 (작업 0164 · 홈과 /flights 가 함께 씀 · 파일은 apps/web/public/models/plane.glb 236,520 바이트) */
export const PLANE_MODEL_URL = "/models/plane.glb";

export const PLANE_CREDIT = {
  text: "3D 비행기: Airplane · Poly by Google (CC-BY 4.0)",
  sourceUrl: "https://poly.pizza/m/8ciDd9k8wha",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;

// ── 인트로에서 고른 여행지 저장 (작업 0185) — 홈 안내판과 인트로가 함께 읽음 (기능 폴더끼리 직접 참조 못 해 여기에 둠) ──
// 브라우저 저장소(localStorage)에만 두고 서버로 보내지 않음 · 잘못된 값은 무시(null · false) · 저장소가 막혀도(비공개 창) 죽지 않음

/** localStorage 키 */
export const PICKED_STORAGE_KEY = "flapfx:picked";
/** 인트로가 끝날 때 window 로 보내는 이벤트 이름 (detail = PickedTrip) */
export const PICK_EVENT = "flapfx:intro-pick";
/** 값이 "1" 이면 인트로를 열지 않는 끄기 스위치 (e2e · 개발용 · 화면에 노출하지 않음) */
export const INTRO_OFF_KEY = "flapfx:intro-off";

const MAX_BUDGET = 1e10;

export type PickedTrip = {
  v: 1;
  /** ISO alpha-3 — TRAVEL_COUNTRIES 의 키 */
  country: string;
  /** 도시 이름 1~20자 */
  city: string;
  /** 환전 예산(원) · 0 이상 정수 · 최대 1e10 */
  budget: number;
};

/** 저장된 글을 읽음 — JSON 이 아니거나 모양이 틀리면 null · 모르는 필드는 버림 */
export function parsePicked(raw: string | null | undefined): PickedTrip | null {
  if (!raw) return null;
  let j: unknown;
  try {
    j = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof j !== "object" || j === null) return null;
  const o = j as Record<string, unknown>;
  const { v, country, city, budget } = o;
  if (v !== 1) return null;
  if (typeof country !== "string" || !Object.hasOwn(TRAVEL_COUNTRIES, country)) return null;
  if (typeof city !== "string" || city.length < 1 || Array.from(city).length > 20) return null;
  if (typeof budget !== "number" || !Number.isInteger(budget) || budget < 0 || budget > MAX_BUDGET) return null;
  return { v: 1, country, city, budget };
}

export const serializePicked = (p: PickedTrip): string => JSON.stringify(p);

/** 저장소에서 읽음 — 저장소가 없거나 던지면 null */
export function readPicked(storage: Pick<Storage, "getItem"> | null | undefined): PickedTrip | null {
  if (!storage) return null;
  try {
    return parsePicked(storage.getItem(PICKED_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** 저장소에 씀 (한 번에 한 값 · 덮어씀) — 잘못된 값이면 쓰지 않고 false · 저장소가 던져도 false */
export function writePicked(storage: Pick<Storage, "setItem"> | null | undefined, p: PickedTrip): boolean {
  if (!storage || !parsePicked(serializePicked(p))) return false;
  try {
    storage.setItem(PICKED_STORAGE_KEY, serializePicked(p));
    return true;
  } catch {
    return false;
  }
}

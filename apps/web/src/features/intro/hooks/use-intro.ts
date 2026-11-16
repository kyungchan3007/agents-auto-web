"use client";

// 인트로 흐름 — 단계 · 입력 · 탑승권 · 스크롤(휠 · 방향키) · 창문 전환 순서 · 저장 (작업 0185 · 확정 시안 intro3.src.html 의 흐름)
// 화면(components)은 이 훅이 돌려주는 값을 그리기만 함 · 3D 장면과는 sceneState(공유 객체)로 주고받음 (장면은 use-intro-scene 이 동적으로 붙임)
// 값은 빌드 때 받은 것 — 없으면 "없음" (지어내지 않음) · 고른 나라 · 예산은 브라우저 저장소에만
import { kstDate } from "@hav/shared/date";
import { PICK_EVENT, type PickedTrip, writePicked } from "@hav/shared/travel";
import { useEffect, useMemo, useRef, useState } from "react";
import { FLIGHT_START, keyDelta, meter, nudge, scrollDelta, tickFlight } from "../lib/flight";
import {
  type Hit,
  type Signal,
  airfareInfo,
  boardRows,
  budgetLine,
  canGoBack,
  convertBudget,
  formatWon,
  introCountries,
  parseBudget,
  pickedOf,
  pinLine,
  prevStep,
  priceLine,
  quickPicks,
  rateNote,
  searchPlaces,
  stepLabel,
  ticketOf,
} from "../lib/flow";
import type { IntroStep, SceneApi, SceneState } from "../lib/scene-types";
import { useIntroScene } from "./use-intro-scene";

/** 인트로가 쓰는 값 — 빌드 때 받은 환율 · 신호 · 물가 수준 · 국제항공료 지수 (없으면 빈 배열 · null) */
export type IntroData = {
  rates: { currency: string; unit: number; baseRate: number }[];
  signals: { currency: string; signal: Signal | null }[];
  levels: { country: string; relative: number }[];
  airFare: { period: string; value: number }[] | null;
  windowDays: number;
};

export type Rect = { left: number; top: number; width: number; height: number };
/** 창문 전환 단계 — 0 없음 · 1 카메라가 비행기로 다가감 · 2 기내 창문 · 3 덧문이 올라감 · 4 창으로 다가감 · 5 창밖 사진 · 6 사진이 홈 사진 자리로 · 7 걷힘 */
export type WindowPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Printing = "off" | "out" | "fold";

/** 인트로 화면의 DOM 조각 — 화면이 data-intro-이름 으로 표시함 (ref 를 화면에 넘기지 않음) */
const part = (name: string): HTMLElement | null => document.querySelector<HTMLElement>(`[data-intro-${name}]`);

const safeStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function useIntro(data: IntroData) {
  const countries = useMemo(() => introCountries({ rates: data.rates, signals: data.signals, levels: data.levels }), [data]);
  // 움직임 줄이기 (prefers-reduced-motion) — 인트로는 마운트 뒤에만 그려지므로 여기서 읽어도 서버 HTML 과 어긋나지 않음
  const [still] = useState<boolean>(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [month] = useState<number>(() => new Date().getMonth() + 1);
  const [today] = useState<string>(() => kstDate());

  const [loaded, setLoaded] = useState(false);
  // 그래픽 가속이 없으면 3D 없이 가벼운 배경 · 이륙은 이 훅이 굴림
  const [lite, setLite] = useState(false);
  // 창문이 화면을 덮은 뒤 3D 층을 숨김 (시안: stage.style.visibility = hidden) — 숨기지 않으면 마지막 프레임(확대된 비행기)이 사진 둘레에 다시 보임
  const [stageOff, setStageOff] = useState(false);
  const [step, setStepState] = useState<IntroStep>(1);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<number | null>(null);
  const [pick, setPick] = useState<{ iso: string; city: string } | null>(null);
  const [budget, setBudget] = useState(1_000_000);
  const [printing, setPrinting] = useState<Printing>("off");
  const [phase, setPhase] = useState<WindowPhase>(0);
  const [target, setTarget] = useState<Rect | null>(null);
  const [lifting, setLifting] = useState(false);
  const [closed, setClosed] = useState(false);

  // 장면과 공유하는 값 · 최신 값 상자 — 변경 가능해서 ref 로 두고, 렌더 중에는 읽지 않음 (콜백 · 효과에서만)
  const scene = useRef<SceneState>({ step: 1, flight: -1, flightGoal: FLIGHT_START, auto: false, zoomIn: false, hidden: false });
  // 최신 값을 콜백(장면 · 타이머 · 이벤트)이 읽도록 — 렌더마다 갱신
  const live = useRef({ step: 1 as IntroStep, pick: null as { iso: string; city: string } | null, budget: 1_000_000, printing: "off" as Printing, windowing: false });
  const run = useRef(0);
  const alive = useRef(true);

  // 렌더가 끝난 뒤 최신 값 상자에 반영 (타이머 · 이벤트가 읽음)
  useEffect(() => {
    live.current.pick = pick;
    live.current.budget = budget;
    live.current.printing = printing;
  }, [pick, budget, printing]);

  /** 일정 시간 기다림 — 움직임 줄이기면 바로 · 인트로가 닫히거나 건너뛰면 false (이어 하던 순서를 멈춤) */
  const sleep = (ms: number): Promise<boolean> => {
    const token = run.current;
    return new Promise((res) => setTimeout(() => res(alive.current && token === run.current), still ? 0 : ms));
  };

  const setStep = (n: IntroStep) => {
    live.current.step = n;
    scene.current.step = n;
    setStepState(n);
  };

  /** 고른 여행지를 저장하고 홈에 알림 (홈 안내판이 고른 나라로 바뀜) */
  const persist = () => {
    const p = live.current.pick;
    if (!p) return;
    const trip: PickedTrip = pickedOf(p.iso, p.city, live.current.budget);
    writePicked(safeStorage(), trip);
    window.dispatchEvent(new CustomEvent<PickedTrip>(PICK_EVENT, { detail: trip }));
  };

  const finish = () => {
    persist();
    setClosed(true);
  };

  const windowTransition = async () => {
    if (live.current.windowing) return;
    live.current.windowing = true;
    scene.current.zoomIn = true;
    setPhase(1);
    if (!(await sleep(1300))) return;
    setPhase(2);
    if (!(await sleep(800))) return;
    scene.current.hidden = true;
    setStageOff(true);
    if (!(await sleep(350))) return;
    setPhase(3);
    if (!(await sleep(1900))) return;
    setPhase(4);
    if (!(await sleep(550))) return;
    setPhase(5);
    if (!(await sleep(450))) return;
    // 창밖 사진이 홈 첫 화면 사진의 실제 자리로 줄어들어 들어감
    const img = document.querySelector('[data-testid="photo-header-img"]')?.getBoundingClientRect();
    setTarget(img ? { left: img.left, top: img.top, width: img.width, height: img.height } : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight * 0.5 });
    setPhase(6);
    if (!(await sleep(1100))) return;
    persist();
    setPhase(7);
    if (!(await sleep(700))) return;
    setClosed(true);
  };

  const begin4 = () => {
    scene.current.flight = FLIGHT_START;
    scene.current.flightGoal = FLIGHT_START;
    scene.current.auto = false;
    setStep(4);
  };

  const choose = (hit: Hit) => {
    setPick({ iso: hit.country.iso, city: hit.city });
    live.current.pick = { iso: hit.country.iso, city: hit.city };
    setStep(2);
  };

  const hits = useMemo(() => (query.trim() ? searchPlaces(query, countries, 4) : quickPicks(countries)), [query, countries]);
  const searching = query.trim() !== "";
  const hovered = hover !== null ? (hits[hover] ?? null) : null;
  const rows = boardRows(query, hovered ?? (searching ? (hits[0] ?? null) : null));

  const onSearchSubmit = () => {
    if (searching && hits.length > 0) choose(hits[0]);
  };

  const cur = pick ? (countries.find((c) => c.iso === pick.iso) ?? null) : null;
  const converted = cur ? convertBudget(budget, cur.base, cur.per) : null;
  const airfare = useMemo(() => airfareInfo(data.airFare, month), [data.airFare, month]);

  const goNext2 = () => setStep(3);
  const printTicket = async () => {
    if (live.current.printing !== "off") return;
    setPrinting("out");
    live.current.printing = "out";
    if (!(await sleep(3250))) return;
    setPrinting("fold");
    if (!(await sleep(800))) return;
    setPrinting("off");
    begin4();
  };
  const back = () => {
    const s = live.current.step;
    if (!canGoBack(s)) return;
    if (s === 4) {
      scene.current.flight = -1;
      scene.current.flightGoal = FLIGHT_START;
      scene.current.auto = false;
    }
    setStep(prevStep(s) as IntroStep);
  };
  const skip = async () => {
    run.current += 1; // 이어 하던 순서(탑승권 · 창문 전환)를 멈춤
    persist();
    setLifting(true);
    await new Promise((r) => setTimeout(r, still ? 0 : 800));
    if (alive.current) setClosed(true);
  };

  // 장면과 주고받는 콜백 — 한 번 만든 같은 객체 (장면이 마운트 때 붙잡음) · 최신 처리는 handlers 가 가리킴
  const handlers = useRef({
    ready: () => {},
    lite: () => {},
    lift: () => {},
    end: () => {},
    frame: (_i: { flight: number; staff: { x: number; y: number } | null }) => {},
  });
  const nextHandlers: typeof handlers.current = {
    ready: () => setLoaded(true),
    lite: () => setLite(true),
    lift: () => {
      // 바퀴가 뜸 — 그다음은 자동 (5단계 표시)
      scene.current.auto = true;
      setStep(5);
    },
    end: () => {
      void windowTransition();
    },
    frame: ({ flight, staff }) => {
      const b = part("bubble");
      if (b && staff && live.current.step <= 3) {
        // 말풍선을 직원 머리 위에 붙임
        const w = b.offsetWidth;
        const h = b.offsetHeight;
        const left = Math.min(window.innerWidth - w - 16, Math.max(16, staff.x - w * 0.72));
        const top = Math.max(84, staff.y - h - 22);
        // 2px 이하의 떨림은 무시 — 직원이 자리에 서면 말풍선이 가만히 있어 눌러도 안 움직임
        const moved = !(Math.abs(left - Number.parseFloat(b.style.left)) < 2 && Math.abs(top - Number.parseFloat(b.style.top)) < 2);
        if (moved) {
          b.style.left = `${left}px`;
          b.style.top = `${top}px`;
          b.style.setProperty("--tail", `${Math.min(w - 30, Math.max(30, staff.x - left))}px`);
          const t = part("ticket");
          if (t) {
            t.style.left = `${left + 26}px`;
            t.style.width = `${w - 52}px`;
            t.style.top = `${top + h - 14}px`;
          }
        }
      }
      const bar = part("meter");
      if (bar) bar.style.width = `${Math.round(meter(flight) * 100)}%`;
    },
  };
  useEffect(() => {
    handlers.current = nextHandlers;
  });
  // 장면이 마운트될 때(효과 안에서) 한 번 부름 — 같은 공유 값(scene)과 최신 처리(handlers)를 가리키는 콜백
  const makeApi = (): SceneApi => ({
    state: scene.current,
    still,
    onFrame: (i) => handlers.current.frame(i),
    onLite: () => handlers.current.lite(),
    onLift: () => handlers.current.lift(),
    onTakeoffEnd: () => handlers.current.end(),
    onReady: () => handlers.current.ready(),
  });
  useIntroScene(() => part("stage"), makeApi);

  // 3D 없이(가벼운 모드) 이륙 — 장면이 하던 진행 계산을 훅이 매 프레임 굴림 (진행 막대 · 바퀴가 뜸 · 창문 시점)
  useEffect(() => {
    if (!lite) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const sc = scene.current;
      if (sc.flight >= 0) {
        const r = tickFlight({ flight: sc.flight, goal: sc.flightGoal, auto: sc.auto, windowing: live.current.windowing }, dt, still);
        sc.flight = r.flight;
        sc.flightGoal = r.goal;
        if (r.lift) handlers.current.lift();
        if (r.window) handlers.current.end();
        const bar = part("meter");
        if (bar) bar.style.width = `${Math.round(meter(sc.flight) * 100)}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lite, still]);

  // 가벼운 모드 — 말풍선이 고정 자리에 있으니 탑승권 출구를 그 아래에 한 번 맞춤
  useEffect(() => {
    if (!lite || printing === "off") return;
    const b = part("bubble");
    const t = part("ticket");
    if (!b || !t) return;
    const r = b.getBoundingClientRect();
    t.style.left = `${r.left + 26}px`;
    t.style.width = `${r.width - 52}px`;
    t.style.top = `${r.bottom - 14}px`;
  }, [lite, printing]);

  // 스크롤(휠 · 방향키)은 4단계에서만 이륙을 움직임 — 휠은 페이지가 따라 움직이지 않게 passive:false
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const s = live.current.step;
      if (s === 4 || s === 5) e.preventDefault();
      if (s === 4 && !scene.current.auto) scene.current.flightGoal = nudge(scene.current.flightGoal, scrollDelta(e.deltaY));
    };
    const onKey = (e: KeyboardEvent) => {
      if (live.current.step !== 4) return;
      const d = keyDelta(e.key);
      if (d === 0) return;
      e.preventDefault();
      if (!scene.current.auto) scene.current.flightGoal = nudge(scene.current.flightGoal, d);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // 인트로가 떠 있는 동안 아래 홈이 스크롤되지 않게 · 닫히면 되돌림 · 정리에서 진행 중인 순서도 멈춤
  useEffect(() => {
    alive.current = true;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    // 장면이 오래 안 떠도(느린 망) 흐름은 시작
    const safety = window.setTimeout(() => setLoaded(true), 20000);
    return () => {
      alive.current = false;
      window.clearTimeout(safety);
      html.style.overflow = before;
    };
  }, []);

  // 단계가 바뀌면 그 단계의 첫 입력칸 · 버튼으로 포커스
  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => part("bubble")?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true }), still ? 0 : 380);
    return () => window.clearTimeout(t);
  }, [loaded, step, still]);

  const passVisible = !!pick && (step === 4 || (step === 5 && phase === 0));
  const view = {
    closed,
    lifting,
    lite,
    stageOff,
    loaded,
    still,
    step,
    stepLabel: stepLabel(step),
    canGoBack: canGoBack(step),
    // 1단계
    query,
    setQuery: (q: string) => {
      setQuery(q);
      setHover(null);
    },
    hits,
    searching,
    rows,
    hover: setHover,
    onSearchSubmit,
    choose,
    // 2단계
    country: cur,
    budget,
    budgetText: budget ? formatWon(budget) : "",
    setBudgetText: (t: string) => setBudget(parseBudget(t)),
    outText: cur && converted !== null ? `≈ ${formatWon(converted)} ${cur.currencyLabel ?? ""}`.trimEnd() : null,
    rateNote: cur ? rateNote(cur) : "",
    pinLine: cur ? pinLine(cur, data.windowDays) : "",
    priceLine: cur ? priceLine(cur) : "",
    next2: goNext2,
    // 3단계
    month,
    airfareLine: airfare.line,
    boardingPrinting: printing,
    printTicket,
    ticket: pick && cur ? ticketOf({ country: cur, city: pick.city, budget, month, airfare: airfare.cell, today }) : null,
    // 4~5단계
    passVisible,
    pass:
      pick && cur
        ? {
            route: `ICN→${pick.city}`,
            month: `${month}월 출발`,
            budget: budgetLine(cur, budget),
            signal: cur.signal ? `${cur.currencyLabel ?? ""} · 최근 ${data.windowDays}일 중 ${cur.signal === "cheap" ? "낮은 편" : cur.signal === "normal" ? "보통" : "높은 편"}` : "판정 없음",
            price: cur.price === null ? "데이터 없음" : `${cur.country} ${cur.price} (한국 100)`,
            when: `이번 달 ${airfare.cell}`,
          }
        : null,
    phase,
    target,
    back,
    skip: () => void skip(),
    pickedCity: pick?.city ?? "",
  };
  return { view };
}

export type IntroView = ReturnType<typeof useIntro>["view"];

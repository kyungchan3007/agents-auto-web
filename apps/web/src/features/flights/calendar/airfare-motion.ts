// 항공권 출발일 달력 움직임 (작업 0234 · 시안 .tmp/motion-pages/m-airfare.src.js 를 옮김)
//   글은 · 칸 · 속성은 React 가 그리고, 이 모듈은 움직임만 맡는다: 고른 날 표시(파랑 둥근 네모) 이동 · 흰 글자 · 비행기 · 띠 흘러가기 · 글자판 가격 굴러가기 · 처음 한 번 떠오름
//   규칙 (사용자가 직접 지적해 정한 것 · e2e 로 고정)
//   - 글자색은 파랑과 같은 순간에만 흰색 (칸의 data-on) · 파랑이 없을 때 날짜 · 가격은 늘 보임
//   - 고른 날 표시 위치는 퍼센트가 아니라 칸의 실제 픽셀 자리 (사파리 16px 어긋남)
//   - 비행기 사라지기 효과(fill: forwards)를 다음 비행 전에 지움 (두 번째 비행도 보임)
//   - 움직임 줄이기(prefers-reduced-motion)는 움직임 없이 바로 최종 상태
const SEL = "airfare-sel";
const q = (root: ParentNode, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export type ShowOpts = { animate: boolean; first: boolean; prev: number | null };
export type PickOpts = { smooth?: boolean; defer?: boolean; roll?: boolean; fly?: boolean };

export type AirfareMotion = {
  /** 도시가 바뀌었거나 처음 보일 때 — 새 칸이 그려진 뒤 부름 */
  show(o: ShowOpts): void;
  /** 사용자가 날짜 칸을 누름 */
  pick(i: number): void;
  destroy(): void;
};

/** 글자판 가격 "274,873원" — 자리마다 0~9 띠가 굴러 멈춤 (오른쪽 자리부터 조금씩 늦게) */
function makeRoll() {
  let prevChars: string[] = [];
  return (board: HTMLElement, value: number) => {
    const chars = [...Math.round(value).toLocaleString("ko-KR"), "원"];
    const digits = "0123456789".repeat(3).split("").map((d) => `<span>${d}</span>`).join("");
    board.innerHTML = chars.map((ch) => (/\d/.test(ch) ? `<span class="c"><span class="s">${digits}</span></span>` : `<span class="c ${ch === "," ? "k" : "w"}"><span class="g">${ch}</span></span>`)).join("");
    const cells = [...board.querySelectorAll<HTMLElement>(".c")];
    const h = cells[0]?.getBoundingClientRect().height || 36;
    const rm = reduced();
    let place = 0;
    for (let i = chars.length - 1; i >= 0; i--) {
      const ch = chars[i];
      if (!/\d/.test(ch)) continue;
      const strip = cells[i].querySelector<HTMLElement>(".s");
      if (!strip) continue;
      const to = 10 + Number(ch); // 가운데 벌에서 멈춤
      const old = prevChars[i];
      const prev = old && /\d/.test(old) ? 10 + Number(old) : 0;
      const from = rm ? to : to <= prev ? prev - 10 : prev; // 늘 아래로 굴러감
      strip.style.transform = `translateY(${-to * h}px)`;
      if (!rm) {
        strip.animate([{ transform: `translateY(${-from * h}px)` }, { transform: `translateY(${-(to + 0.18) * h}px)`, offset: 0.85 }, { transform: `translateY(${-to * h}px)` }], {
          duration: 700 + place * 60,
          delay: place * 70,
          easing: "cubic-bezier(.4,0,.2,1)",
          fill: "backwards",
        });
      }
      place++;
    }
    prevChars = chars;
  };
}

export function createAirfareMotion(root: HTMLElement, cb: { onRange(text: string, atStart: boolean, atEnd: boolean): void; onGrow(): void; formatRange(a: string, b: string): string }): AirfareMotion {
  const scroller = q(root, "airfare-scroll") as HTMLElement;
  const track = scroller.firstElementChild as HTMLElement;
  const strip = scroller.parentElement as HTMLElement;
  const plane = q(root, "airfare-plane") as HTMLElement;
  const pass = q(root, "airfare-pass") as HTMLElement;
  const board = q(root, "airfare-board") as HTMLElement;
  const card = pass.parentElement as HTMLElement;
  const roll = makeRoll();

  const cells = () => [...track.querySelectorAll<HTMLElement>('[data-testid="airfare-day"]')];
  const selEl = () => track.querySelector<HTMLElement>(`[data-testid="${SEL}"]`) as HTMLElement;
  const cellW = () => cells()[0]?.getBoundingClientRect().width || 1;
  const perView = () => Math.max(1, Math.round(scroller.clientWidth / cellW()));
  const maxScroll = () => scroller.scrollWidth - scroller.clientWidth;
  const centerOf = (i: number) => Math.max(0, Math.min(maxScroll(), (i + 0.5) * cellW() - scroller.clientWidth / 2));
  const snapTo = (x: number) => Math.max(0, Math.min(maxScroll(), Math.round(x / cellW()) * cellW()));
  const bestIndex = () => Math.max(0, cells().findIndex((c) => c.dataset.best === "true"));

  let sel = 0;
  let flying = 0;
  let markTick = 0;
  let introShown = false;
  let shownOnce = false;
  let timers: number[] = [];
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.push(t);
  };

  function range() {
    const cs = cells();
    if (cs.length === 0) return;
    const a = Math.max(0, Math.min(cs.length - 1, Math.round(scroller.scrollLeft / cellW())));
    const b = Math.min(cs.length - 1, a + perView() - 1);
    cb.onRange(cb.formatRange(cs[a].dataset.depart ?? "", cs[b].dataset.depart ?? ""), scroller.scrollLeft < 2, scroller.scrollLeft > maxScroll() - 2);
  }
  const onScroll = () => range();
  scroller.addEventListener("scroll", onScroll, { passive: true });

  /** 고른 날 표시(파랑 둥근 네모)를 그 칸의 실제 픽셀 자리로 */
  function place(i: number, smooth: boolean) {
    const el = selEl();
    const cell = cells()[i];
    if (!cell) return;
    el.style.transition = smooth && !reduced() ? "" : "none";
    const c = cell.getBoundingClientRect();
    const t = track.getBoundingClientRect();
    el.style.width = `${c.width}px`;
    el.style.transform = `translateX(${c.left - t.left}px)`;
    if (!smooth) {
      void el.offsetWidth;
      el.style.transition = "";
    }
  }
  const onResize = () => {
    place(sel, false);
    range();
  };
  addEventListener("resize", onResize);

  /** 파랑 표시가 놓인 칸만 글자를 흰색으로 */
  function mark(i: number) {
    cells().forEach((el, k) => {
      if (k === i) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    });
  }

  /** 날짜 고르기: 표시가 미끄러져 옮겨 가고 · 글자판 가격이 그 날 값으로 · defer: 띠가 흘러갈 때 표시는 숨기고 비행기가 내려앉는 순간 칠함 */
  function select(i: number, o: PickOpts = {}) {
    const cell = cells()[i];
    if (!cell) return;
    sel = i;
    const el = selEl();
    if (o.defer) el.setAttribute("data-hide", "");
    else el.removeAttribute("data-hide");
    place(i, !!o.smooth);
    const tk = ++markTick;
    if (o.smooth && !reduced()) {
      mark(-1); // 파랑이 그 칸에 닿는 순간에 흰 글자 (먼저 바뀌면 흰 바탕에 흰 글자가 보임 · 늦으면 파랑 위에 짙은 글자가 보임)
      const t0 = performance.now();
      const watch = () => {
        if (tk !== markTick) return;
        const s = el.getBoundingClientRect();
        const c = cell.getBoundingClientRect();
        if (Math.abs(s.left + s.width / 2 - (c.left + c.width / 2)) <= c.width * 0.35 || performance.now() - t0 > 700) mark(sel);
        else requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    } else mark(o.defer ? -1 : i);
    if (o.roll) roll(board, Number(cell.dataset.price));
    if (o.fly) {
      pass.removeAttribute("data-flown");
      void pass.offsetWidth;
      requestAnimationFrame(() => pass.setAttribute("data-flown", ""));
    }
  }

  function land() {
    const el = selEl();
    markTick++;
    mark(sel);
    el.removeAttribute("data-hide");
    el.removeAttribute("data-land");
    void el.offsetWidth;
    el.setAttribute("data-land", "");
    scroller.style.scrollSnapType = "";
    range();
  }

  /** 비행기: 띠가 흘러가야 할 때만 뜸 — 떠나는 칸에서 떠서 띠가 따라 흐르는 동안 가장 싼 날 칸에 내려앉음 → 그 순간 파랑 */
  function flyToBest(delay: number, from: number, start: number, end: number) {
    const id = ++flying;
    const bi = sel;
    scroller.style.scrollSnapType = "none";
    scroller.scrollLeft = start;
    later(() => {
      if (id !== flying) return;
      const w = cellW();
      const x0 = (from + 0.5) * w;
      const x1 = (bi + 0.5) * w;
      const dir = x1 >= x0 ? 1 : -1;
      const s = strip.getBoundingClientRect();
      const sc = scroller.getBoundingClientRect();
      const offX = sc.left - s.left;
      const y0 = sc.top - s.top + sc.height / 2;
      const dur = Math.min(1700, 700 + Math.abs(x1 - x0) * 0.6);
      const lift = 34;
      const t0 = performance.now();
      plane.getAnimations().forEach((a) => a.cancel()); // 앞 비행의 사라지기 효과가 남아 있으면 두 번째부터 비행기가 안 보임
      plane.style.opacity = "1";
      const step = (t: number) => {
        if (id !== flying) {
          plane.style.opacity = "0";
          return;
        }
        const k = Math.min(1, (t - t0) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        scroller.scrollLeft = start + (end - start) * e;
        const x = x0 + (x1 - x0) * e - scroller.scrollLeft + offX;
        const y = y0 - Math.sin(Math.PI * e) * lift;
        const ang = (Math.atan2(-Math.cos(Math.PI * e) * Math.PI * lift, Math.max(60, Math.abs(x1 - x0))) * 180) / Math.PI;
        const sc2 = 1 + Math.sin(Math.PI * e) * 0.25;
        plane.style.transform = `translate(${x}px, ${y}px) scale(${dir * sc2}, ${sc2}) rotate(${ang}deg)`;
        if (k < 1) requestAnimationFrame(step);
        else {
          plane.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => {
            plane.style.opacity = "0";
          };
          land();
        }
      };
      requestAnimationFrame(step);
    }, delay);
  }

  function show({ animate, first, prev }: ShowOpts) {
    const keep = scroller.scrollLeft; // 도시를 바꿀 때: 보던 자리에서 이어 감
    const bi = bestIndex();
    sel = bi;
    const o: PickOpts = { roll: animate || !shownOnce, fly: true };
    shownOnce = true;
    flying++;
    plane.style.opacity = "0";
    scroller.style.scrollSnapType = "";
    if (!animate || reduced()) {
      select(bi, o);
      scroller.scrollLeft = snapTo(centerOf(bi));
    } else {
      const start = first ? 0 : Math.min(keep, maxScroll());
      const end = snapTo(centerOf(bi));
      scroller.scrollLeft = start;
      let wait = 80;
      if (first) {
        // 처음 한 번만 날짜가 왼쪽부터 떠오름 (도시를 바꿀 때는 날짜가 그대로 있어야 함)
        const n = perView();
        cells()
          .slice(0, n + 2)
          .forEach((el, i) => el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: 60 + i * 28, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }));
        wait = 60 + n * 28 + 260;
      }
      if (Math.abs(end - start) < 2) {
        // 띠가 움직이지 않음 → 기다리지 않고 바로 파랑 · 앞서 고른 칸이 있으면 거기서 미끄러져 옴
        if (prev !== null && prev !== bi && !first) {
          place(prev, false);
          select(bi, { ...o, smooth: true });
        } else {
          select(bi, o);
          const el = selEl();
          el.removeAttribute("data-land");
          void el.offsetWidth;
          el.setAttribute("data-land", "");
        }
      } else {
        select(bi, { ...o, defer: true });
        flyToBest(wait, first || prev === null ? 0 : prev, start, end);
      }
    }
    range();
    requestAnimationFrame(() => requestAnimationFrame(() => cb.onGrow()));
  }

  // 처음 화면에 들어오면 한 번 움직임 (탑승권은 왼쪽에서 들어옴 · 날짜가 떠오름 · 요일 막대가 자람)
  const rm0 = reduced();
  if (!rm0) pass.style.opacity = "0";
  const io = new IntersectionObserver(
    (es, obs) => {
      if (!es[0]?.isIntersecting) return;
      obs.disconnect();
      introShown = true;
      if (!reduced())
        pass.animate([{ opacity: 0, transform: "translateX(-48px)" }, { opacity: 1, transform: "none" }], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).onfinish = () => {
          pass.style.opacity = "1";
        };
      show({ animate: true, first: true, prev: null });
    },
    { threshold: 0.3 },
  );
  io.observe(card);

  return {
    show(o) {
      // 처음 화면에 들어오기 전의 첫 그림 = 움직임 없는 최종 상태 (들어오면 위 observer 가 한 번 움직임)
      if (!introShown && !o.animate) show(o);
      else if (!introShown) show({ ...o, animate: false });
      else show(o);
    },
    pick(i) {
      const mid = selEl().hasAttribute("data-hide"); // 비행 중에 누름
      flying++;
      plane.style.opacity = "0";
      scroller.style.scrollSnapType = "";
      if (i !== sel || mid) select(i, { smooth: !mid, roll: i !== sel, fly: i !== sel });
    },
    destroy() {
      flying++;
      io.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      timers.forEach(clearTimeout);
      timers = [];
    },
  };
}

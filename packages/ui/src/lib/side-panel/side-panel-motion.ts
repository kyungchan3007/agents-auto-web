// 사이드바 · 시트 공통 모션 (작업 0361 1단계 · 0356 "다른 나라 통화 보기" 모션 A 를 꺼냄 · 시안 .tmp/sian-retention/index.html 의 show() · hide() 기준) — React 없는 순수 DOM 움직임 (Web Animations API)
//   열 때: 시작 요소(버튼 · 누른 줄)가 그대로 늘어나 사이드바(0.68초 · cubic-bezier(.7,0,.25,1)) · 시작 요소 글은 0.16초에 사라짐 · 시작 요소의 날아갈 조각([data-fly])은 곡선을 그리며 목록의 제 자리([data-fly-to])로 날아가 앉음 · 다 펼쳐진 뒤 머리([data-side-head]) · 줄이 위에서부터 차례로
//   닫을 때: 조각이 시작 요소로 돌아가고 · 사이드바가 줄어들어 시작 요소가 되며 · 시작 요소가 한 번 살짝 튐
//   국기 날아가기는 넓은 화면 사이드바에서만(시트는 없음 · 작업 0366) · 목표 줄은 움직임을 시작하기 전(최종 크기 · 목록을 미리 내린 뒤)에 재고 · 목록 보이는 범위 밖 줄의 국기는 날지 않고 제 자리에서 작아지며 사라짐
//   시작 요소가 없으면 옆(넓은 화면) · 아래(좁은 화면)에서 밀려 들어오고 나감
//   움직임 줄이기면 부르는 쪽이 이 함수들을 거치지 않고 바로 열고 닫음 (여기서는 그리기만)
//   패널 안 약속: 머리 = [data-side-head] · 스크롤 목록 = [data-scroll-ok] · 닫기 단추 = [data-side-close] · 지금 줄 = [aria-current="page"]
export type MotionEls = { btn: HTMLElement | null; panel: HTMLElement; backdrop: HTMLElement | null; list: HTMLElement | null; head: HTMLElement | null };

/** 패널 안에서 머리 · 목록을 찾음 */
export const partsOf = (panel: HTMLElement) => ({ list: panel.querySelector<HTMLElement>("[data-scroll-ok]"), head: panel.querySelector<HTMLElement>("[data-side-head]") });

const MORPH = "cubic-bezier(.7,0,.25,1)";
const EASE = "cubic-bezier(.2,.8,.2,1)";
const OPEN_MS = 680;
const CLOSE_MS = 560;

/** 늘어나는 상자의 겉모습(작업 0370) — 선 없이 바탕과 그림자만: 시작 요소 자리에서는 옅은 남색(줄 hover 바탕) · 중간에 떠오른 그림자 · 끝은 열린 뒤 고정 값(흰 바탕 + 경계 그림자) */
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const liftRest = () => ({ backgroundColor: token("--hav-lift-rest"), boxShadow: "none" });
const liftMid = () => ({ backgroundColor: token("--hav-lift-mid"), boxShadow: token("--shadow-panel-lift") });
/** 열린 뒤 패널이 실제로 가진 바탕 · 그림자 (움직임 끝 값과 같아 툭 바뀌지 않음) */
const settled = (panel: HTMLElement) => {
  const cs = getComputedStyle(panel);
  return { backgroundColor: cs.backgroundColor, boxShadow: cs.boxShadow };
};

const rect = (el: Element) => el.getBoundingClientRect();

/** 열린 동안 버튼 숨기기 — visibility:hidden 은 쓰지 않음(풀어도 전역 transition 때문에 한 프레임 계산값이 hidden 이라 그 순간의 focus() 가 모두 실패했음) · opacity 0 은 숨겨도 포커스를 받음 */
export function hideBtn(btn: HTMLElement): void {
  btn.style.transition = "none";
  btn.style.opacity = "0";
}
export function showBtn(btn: HTMLElement): void {
  btn.style.opacity = "";
  btn.style.transition = "";
}
const frame = (r: DOMRect, radius: string) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: radius });
const flagsOf = (root: Element) => [...root.querySelectorAll<HTMLElement>("[data-fly]")];
const rowFlag = (list: HTMLElement, key: string) => list.querySelector<HTMLElement>(`[data-fly-to="${key}"]`);

/** 날아가는 국기 한 장 — 출발 자리에 같은 모양을 복제해 화면 맨 위에 올림 */
function clone(from: Element, r: DOMRect, kind: "fly" | "shrink" = "fly"): HTMLElement {
  const c = document.createElement("div");
  c.setAttribute("aria-hidden", "true");
  if (kind === "fly") c.dataset.sideFly = "";
  else c.dataset.sideShrink = "";
  c.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:90;pointer-events:none`;
  c.innerHTML = from.innerHTML;
  document.body.appendChild(c);
  return c;
}

/** 열리는 움직임이 아직 끝나지 않았을 때 닫으면 — 진행 중인 움직임 · 날아가던 국기를 멈추고 제자리로 (바로 닫는 움직임을 시작할 수 있게) */
export function settle(els: MotionEls): void {
  els.panel.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  document.querySelectorAll("[data-side-fly],[data-side-shrink]").forEach((c) => c.remove());
  els.list?.querySelectorAll<HTMLElement>("[data-fly-to]").forEach((f) => (f.style.opacity = ""));
}

/** 지금 통화 줄이 목록 안에 보이도록 목록을 미리 내려 둠 */
export function preScroll(list: HTMLElement, top: (rowTop: number, listHeight: number) => number): void {
  const cur = list.querySelector<HTMLElement>('[aria-current="page"]');
  if (!cur) return;
  const rowTop = rect(cur).top - rect(list).top + list.scrollTop;
  list.scrollTop = top(rowTop, list.clientHeight);
}

/** 시트인가 — 폭 전체를 쓰면 시트(국기 날아가기 없음) */
const isSheet = (panel: HTMLElement) => rect(panel).width >= innerWidth - 1;
/** 상자 안에 다 들어 있는가(약간의 오차 허용) */
const within = (r: DOMRect, box: DOMRect) => r.top >= box.top - 1 && r.bottom <= box.bottom + 1 && r.left >= box.left - 1 && r.right <= box.right + 1;

/** 시트(폭 전체)는 아래에서 · 사이드바는 옆에서 */
const slideFrom = (panel: HTMLElement) => (rect(panel).width >= innerWidth - 1 ? "translateY(100%)" : "translateX(100%)");

/** 시작 요소 → 사이드바 (패널은 이미 최종 자리에 그려져 있음) · label 은 시작 요소가 사라지며 잠깐 보일 글 · 시작 요소가 없으면 옆에서 밀려 들어옴 */
export function playOpen(els: MotionEls, label = ""): void {
  const { btn, panel, backdrop, list, head } = els;
  backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out", fill: "backwards" });
  if (!btn) {
    panel.animate([{ transform: slideFrom(panel) }, { transform: "none" }], { duration: 420, easing: EASE });
    return;
  }
  const final = rect(panel);
  const b = rect(btn);
  const radius = getComputedStyle(panel).borderRadius;
  // 날아갈 조각의 목표 줄 — 어떤 움직임도 시작하기 전(패널 최종 크기 · 목록은 미리 내려 둔 상태 · 줄 모두 제 자리)에 잼 · 시트는 날지 않음 · 목록 보이는 범위 밖 줄은 날지 않고 작아짐
  const listBox = list ? rect(list) : null;
  const sheet = isSheet(panel);
  const starts = sheet
    ? []
    : flagsOf(btn).map((el) => {
        const target = list ? rowFlag(list, el.dataset.fly ?? "") : null;
        const t = target ? rect(target) : null;
        return { from: el, r: rect(el), target, t, seen: !!(t && listBox && within(t, listBox)) };
      });
  hideBtn(btn);

  const ghost = document.createElement("div");
  ghost.textContent = label;
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;padding:0 22px;font-weight:800;font-size:1.0625rem;pointer-events:none";
  panel.appendChild(ghost);
  ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }).onfinish = () => ghost.remove();

  panel.animate([{ ...frame(b, getComputedStyle(btn).borderRadius), ...liftRest() }, { ...liftMid(), offset: 0.45 }, { ...frame(final, radius), ...settled(panel) }], { duration: OPEN_MS, easing: MORPH });
  head?.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 260, delay: 560, fill: "backwards", easing: EASE });
  if (!list) return;
  [...list.children].forEach((row, i) => row.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 280, delay: 600 + i * 28, fill: "backwards", easing: EASE }));

  starts.forEach(({ from, r, target, t, seen }, i) => {
    if (!target || !t || !seen) {
      // 목록에서 보이지 않는 줄 — 날지 않고 버튼 자리에서 작아지며 사라짐
      const el = clone(from, r, "shrink");
      el.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.2)", opacity: 0 }], { duration: 320, delay: 60 + i * 40, easing: EASE, fill: "forwards" }).onfinish = () => el.remove();
      return;
    }
    const el = clone(from, r);
    target.style.opacity = "0";
    const [sx, sy, dx, dy] = [t.width / r.width, t.height / r.height, t.left - r.left, t.top - r.top];
    const mid = `translate(${dx * 0.45}px,${dy * 0.45 - 40}px) scale(${1 + (sx - 1) * 0.5}) rotate(-8deg)`;
    el.style.transformOrigin = "0 0";
    el.animate([{ transform: "none" }, { transform: mid }, { transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` }], { duration: 640, delay: 260 + i * 60, easing: EASE, fill: "forwards" }).onfinish = () => {
      target.style.opacity = "";
      el.remove();
    };
  });
}

/** 사이드바 → 시작 요소 · 끝나면 resolve (그 뒤에 부르는 쪽이 사이드바를 치움) */
export function playClose(els: MotionEls): Promise<void> {
  const { btn, panel, backdrop, list, head } = els;
  backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 80, fill: "forwards" });
  if (!btn) {
    return panel.animate([{ transform: "none" }, { transform: slideFrom(panel) }], { duration: 360, easing: EASE, fill: "forwards" }).finished.then(
      () => undefined,
      () => undefined,
    );
  }
  const final = rect(panel);
  const b = rect(btn);
  const listBox = list ? rect(list) : null;
  const radius = getComputedStyle(panel).borderRadius;
  const btnRadius = getComputedStyle(btn).borderRadius;
  const clones: HTMLElement[] = [];

  // 시작 요소에 남을 조각(버튼에 남을 국기)이 제 자리에서 시작 요소로 돌아감 — 목록 밖으로 나가 있는 줄은 날지 않음
  flagsOf(btn).forEach((flag, i) => {
    if (isSheet(panel)) return; // 시트는 국기 날아가기 없음 (작업 0366)
    const src = list ? rowFlag(list, flag.dataset.fly ?? "") : null;
    if (!src || !listBox) return;
    const s = rect(src);
    if (s.top < listBox.top || s.bottom > listBox.bottom) return;
    const t = rect(flag);
    const el = clone(src, s);
    el.style.transformOrigin = "0 0";
    src.style.opacity = "0";
    clones.push(el);
    el.animate([{ transform: "none" }, { transform: `translate(${t.left - s.left}px,${t.top - s.top}px) scale(${t.width / s.width},${t.height / s.height})` }], { duration: 440, delay: i * 30, easing: EASE, fill: "forwards" });
  });

  head?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" });
  if (list) [...list.children].forEach((row) => row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }));
  const main = panel.animate([{ ...frame(final, radius), ...settled(panel) }, { ...liftMid(), offset: 0.55 }, { ...frame(b, btnRadius), ...liftRest() }], { duration: CLOSE_MS, delay: 120, easing: MORPH, fill: "forwards" });
  return main.finished.then(
    () => {
      clones.forEach((c) => c.remove());
      showBtn(btn);
      btn.animate([{ transform: "scale(.97)" }, { transform: "scale(1.02)" }, { transform: "none" }], { duration: 260, easing: EASE });
    },
    () => {
      clones.forEach((c) => c.remove());
      showBtn(btn);
    },
  );
}

/** 포커스를 사이드바 안에 가둠 — Tab 이 맨 끝에서 맨 앞으로 · Shift+Tab 은 반대 */
export function trapTab(e: { key: string; shiftKey: boolean; preventDefault: () => void }, panel: HTMLElement): void {
  if (e.key !== "Tab") return;
  const items = [...panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter((el) => el.getClientRects().length > 0);
  if (items.length === 0) return;
  const [first, last] = [items[0], items[items.length - 1]];
  const at = document.activeElement;
  if (!panel.contains(at)) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && at === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && at === last) {
    e.preventDefault();
    first.focus();
  }
}

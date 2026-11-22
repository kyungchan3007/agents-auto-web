// 어드민 화면끼리 주고받는 브라우저 이벤트 (작업 0303)
//   adm-toast: 아래 알림 한 줄 · adm-pick: 찾기 창에서 고른 요소에 보냄(요소가 직접 처리하면 preventDefault → 아니면 그 판으로 스크롤)
export const toast = (message: string) => window.dispatchEvent(new CustomEvent("adm-toast", { detail: message }));

export const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 판으로 스크롤하고 잠깐 테두리로 알림 */
export function flashPanel(el: Element | null) {
  const p = el?.closest(".adm-panel") ?? el;
  if (!(p instanceof HTMLElement)) return;
  p.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  p.classList.remove("flash");
  void p.offsetWidth;
  p.classList.add("flash");
}

/** 자리가 바뀌는 움직임 — 바꾸기 전 자리를 기억해 거꾸로 옮긴 뒤 풀어 줌 */
export function flip(els: HTMLElement[], change: () => void) {
  const before = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
  change();
  if (reduceMotion()) return;
  requestAnimationFrame(() => {
    for (const e of els) {
      if (e.hidden || !e.isConnected || !e.animate) continue;
      const a = before.get(e);
      const b = e.getBoundingClientRect();
      if (!a || (a.width === 0 && a.height === 0)) {
        e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
        continue;
      }
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (dx || dy) e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
  });
}

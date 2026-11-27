// 작업 0398 — 반응형 전수 점검의 화면 안 검사 (page.evaluate 로 보냄 · 바깥 값에 기대지 않는 한 함수)
//   a 가로 스크롤 · 화면 밖 · 글자 넘침(잘림 · 상자 밖) · 겹침 / b 나란한 큰 칸 아래 끝 차이 > 24 / c 899 이하 덩어리 좌우 여백 차 > 2 / d 구역 안 아래 빈 공간
//   값은 폭에 기대지 않는 key(이름표)와 val(숫자)로 나눠 같은 문제를 폭 범위로 묶음
export type Violation = { item: "a" | "b" | "c" | "d"; key: string; val: number };

export function auditDom(): Violation[] {
  const out: Violation[] = [];
  const W = document.documentElement.clientWidth;
  const label = (e: Element): string => {
    const t = (e as HTMLElement).dataset?.testid;
    const cls = typeof e.className === "string" ? e.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
    return `${t ? `[${t}]` : ""}${e.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
  };
  const add = (item: Violation["item"], key: string, val: number) => {
    if (!out.some((o) => o.item === item && o.key === key)) out.push({ item, key, val: Math.round(val) });
  };
  const shown = (e: Element): boolean => {
    const s = getComputedStyle(e);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const skip = (e: Element): boolean => !!e.closest("[inert],[aria-hidden='true'],script,style,noscript,svg *,[data-resp-skip],.sr-only");
  // 글자 줄 상자 — 요소 자체 상자(자식까지 품음)가 아니라 그 요소가 직접 가진 글자만의 상자
  const textRect = (e: Element): DOMRect | null => {
    const rs: DOMRect[] = [];
    for (const n of e.childNodes) {
      if (n.nodeType !== 3 || (n.textContent ?? "").trim() === "") continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) rs.push(r);
    }
    if (!rs.length) return null;
    const l = Math.min(...rs.map((r) => r.left));
    const t = Math.min(...rs.map((r) => r.top));
    const rr = Math.max(...rs.map((r) => r.right));
    const b = Math.max(...rs.map((r) => r.bottom));
    return new DOMRect(l, t, rr - l, b - t);
  };
  const fixedAncestor = (e: Element): boolean => {
    for (let n: Element | null = e; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") return true;
    }
    return false;
  };
  const clipped = (e: Element): boolean => {
    for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.overflowX !== "visible") {
        const r = n.getBoundingClientRect();
        if (r.left >= -1 && r.right <= W + 1) return true;
      }
    }
    return false;
  };
  const all = [...document.body.querySelectorAll("*")].filter((e) => shown(e) && !skip(e));

  // a — 가로 스크롤 · 화면 밖
  if (document.documentElement.scrollWidth > W + 1) add("a", "가로 스크롤", document.documentElement.scrollWidth - W);
  const offs = new Set<Element>();
  for (const e of all) {
    const r = e.getBoundingClientRect();
    if (r.width < 8 || (r.right <= W + 1 && r.left >= -1)) continue;
    if (fixedAncestor(e) || clipped(e)) continue;
    if (e.parentElement && offs.has(e.parentElement)) continue;
    offs.add(e);
    add("a", `화면 밖 ${label(e)}`, Math.max(r.right - W, -r.left));
  }
  // a — 글자 잘림 · 글자가 상자 밖
  const texts = all.filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== ""));
  for (const e of texts) {
    const he = e as HTMLElement;
    const s = getComputedStyle(he);
    if (s.overflowX !== "visible" && s.textOverflow !== "ellipsis" && he.scrollWidth > he.clientWidth + 1) add("a", `글자 잘림 ${label(e)}`, he.scrollWidth - he.clientWidth);
    let box: Element | null = null;
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const bs = getComputedStyle(n);
      const hasBorder = parseFloat(bs.borderTopWidth) > 0 || parseFloat(bs.borderLeftWidth) > 0;
      const hasBg = !/rgba\(0, 0, 0, 0\)|transparent/.test(bs.backgroundColor);
      if (parseFloat(bs.borderTopLeftRadius) > 0 && (hasBorder || hasBg)) {
        box = n;
        break;
      }
    }
    const tr0 = textRect(e);
    if (box && tr0 && !clipped(e)) {
      const br = box.getBoundingClientRect();
      const r = tr0;
      const over = Math.max(r.right - br.right, br.left - r.left);
      if (over > 1) add("a", `글자가 상자 밖 ${label(e)} ⊄ ${label(box)}`, over);
    }
  }
  // a — 글자끼리 겹침
  const tr = texts.filter((e) => !fixedAncestor(e)).map((e) => ({ e, r: textRect(e) })).filter((x): x is { e: Element; r: DOMRect } => x.r !== null);
  for (let i = 0; i < tr.length; i++)
    for (let j = i + 1; j < tr.length; j++) {
      const a = tr[i];
      const b = tr[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ox > 2 && oy > 2) add("a", `겹침 ${label(a.e)} × ${label(b.e)}`, Math.min(ox, oy));
    }

  // b — 나란한 큰 칸 아래 끝 차이
  for (const el of all) {
    const d = getComputedStyle(el).display;
    if (!(d.includes("grid") || d.includes("flex"))) continue;
    const kids = [...el.children].filter((k) => shown(k) && !skip(k) && getComputedStyle(k).position !== "absolute");
    if (kids.length < 2) continue;
    const R = kids.map((k) => k.getBoundingClientRect());
    const big = kids.filter((_, i) => R[i].height > 200);
    if (big.length < 2) continue;
    const BR = big.map((k) => k.getBoundingClientRect());
    const side = BR.every((a) => Math.abs(a.top - BR[0].top) < 60) && BR.every((a, i) => i === 0 || a.left > BR[i - 1].left + 40);
    if (!side) continue;
    const bottoms = BR.map((a) => a.bottom);
    const diff = Math.max(...bottoms) - Math.min(...bottoms);
    if (diff > 24) {
      const short = big[bottoms.indexOf(Math.min(...bottoms))];
      add("b", `두 칸 아래 끝 차이 ${label(el)} 짧은 칸=${label(short)}`, diff);
    }
  }

  // c — 899 이하: 같은 가운데 기둥 — 줄을 혼자 차지하는 덩어리(옆에 형제가 없는 블록)의 좌우 여백 차 > 2
  if (W <= 899) {
    const blockTags = new Set(["DIV", "SECTION", "ARTICLE", "FORM", "UL", "OL", "LI", "P", "H1", "H2", "H3", "NAV", "FIGURE", "IMG", "INPUT", "SELECT", "BUTTON", "A", "TABLE", "CANVAS", "DETAILS"]);
    const bad = new Set<Element>();
    const marginDiff = (e: Element): number => {
      const r = e.getBoundingClientRect();
      return r.left - (W - r.right);
    };
    for (const e of all) {
      if (!blockTags.has(e.tagName)) continue;
      const s = getComputedStyle(e);
      if (!(s.display === "block" || s.display === "flex" || s.display === "grid" || s.display === "list-item" || s.display === "table" || s.display === "flow-root")) continue;
      const r = e.getBoundingClientRect();
      if (r.width < W * 0.3 || r.height < 40 || r.width >= W - 1) continue;
      if (s.position === "absolute" || s.position === "fixed" || fixedAncestor(e)) continue;
      let scroller = false;
      for (let n: Element | null = e.parentElement; n && n !== document.body; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX;
        if (o === "auto" || o === "scroll") scroller = true;
      }
      if (scroller) continue;
      // 옆에 형제가 있으면(같은 줄) 한 줄 배치가 아님
      const sib = e.parentElement ? [...e.parentElement.children].filter((k) => k !== e && shown(k)) : [];
      if (sib.some((k) => { const kr = k.getBoundingClientRect(); return kr.top < r.bottom - 1 && kr.bottom > r.top + 1 && kr.width > 20; })) continue;
      const d = marginDiff(e);
      if (Math.abs(d) <= 2) continue;
      // 바깥 덩어리가 이미 어긋났으면 안쪽은 같은 문제라 따로 세지 않음
      let anc = false;
      for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) if (bad.has(n)) anc = true;
      if (anc) continue;
      bad.add(e);
      add("c", `가운데 기둥 어긋남 ${label(e)}`, d);
    }
  }

  // d — 구역 안 아래 빈 공간
  for (const e of [...document.body.querySelectorAll("section, article, [data-testid='home-hero'], [data-testid='budget']")]) {
    if (!shown(e) || skip(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.height < 200) continue;
    let last = r.top;
    for (const c of e.querySelectorAll("*")) {
      if (!shown(c) || skip(c)) continue;
      const cs = getComputedStyle(c);
      if (cs.position === "absolute") continue;
      const leaf = c.children.length === 0 || [...c.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "");
      if (!leaf) continue;
      const cr = c.getBoundingClientRect();
      if (cr.height > 0) last = Math.max(last, cr.bottom);
    }
    const es = getComputedStyle(e);
    const blank = r.bottom - last - parseFloat(es.paddingBottom) - parseFloat(es.borderBottomWidth);
    if (blank > 160 || blank > r.height * 0.25) add("d", `아래 빈 공간 ${label(e)}`, blank);
  }
  return out;
}

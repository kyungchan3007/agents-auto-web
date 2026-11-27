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
  // 닫힌 details 의 본문은 그려지지 않는데 상자 값은 남아 있음 — 점검에서 뺌
  const inClosedDetails = (e: Element): boolean => {
    const d = e.closest("details:not([open])");
    return !!d && !e.closest("summary");
  };
  const skip = (e: Element): boolean => inClosedDetails(e) || !!e.closest("[inert],[aria-hidden='true'],script,style,noscript,svg *,[data-resp-skip],.sr-only");
  // 글자가 overflow 로 잘려 보이지 않는 자리(굴러가는 숫자 줄 등)면 점검에서 뺌
  const hiddenByClip = (e: Element, r: DOMRect): boolean => {
    for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        const nr = n.getBoundingClientRect();
        const ox = Math.min(r.right, nr.right) - Math.max(r.left, nr.left);
        const oy = Math.min(r.bottom, nr.bottom) - Math.max(r.top, nr.top);
        if (ox < Math.min(r.width, 4) || oy < Math.min(r.height, 4)) return true;
      }
    }
    return false;
  };
  // 글자의 줄마다 상자(여러 줄로 감긴 글을 한 상자로 합치면 다른 글과 가짜로 겹침)
  const textLineRects = (e: Element): DOMRect[] => {
    const rs: DOMRect[] = [];
    for (const n of e.childNodes) {
      if (n.nodeType !== 3 || (n.textContent ?? "").trim() === "") continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) rs.push(new DOMRect(r.left, r.top + r.height * 0.1, r.width, r.height * 0.8));
    }
    return rs;
  };
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
    if (box && tr0 && !clipped(e) && !hiddenByClip(e, tr0)) {
      const br = box.getBoundingClientRect();
      const r = tr0;
      const over = Math.max(r.right - br.right, br.left - r.left);
      if (over > 1) add("a", `글자가 상자 밖 ${label(e)} ⊄ ${label(box)}`, over);
    }
  }
  // a — 글자끼리 겹침(줄마다 비교 · 줄 높이 위아래 10%는 뺌 · 4px 넘는 겹침만)
  const tr = texts
    .filter((e) => !fixedAncestor(e))
    .map((e) => ({ e, rs: textLineRects(e).filter((r) => !hiddenByClip(e, r)) }))
    .filter((x) => x.rs.length > 0);
  for (let i = 0; i < tr.length; i++)
    for (let j = i + 1; j < tr.length; j++) {
      const a = tr[i];
      const b = tr[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      let worst = 0;
      for (const ra of a.rs)
        for (const rb of b.rs) {
          const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ox > 4 && oy > 4) worst = Math.max(worst, Math.min(ox, oy));
        }
      if (worst > 0) add("a", `겹침 ${label(a.e)} × ${label(b.e)}`, worst);
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
    // 칸 안쪽 아래 끝(칸의 아래 안쪽 여백 · 테두리는 뺌 — 한쪽은 padding · 한쪽은 margin 으로 간격을 둬도 같은 배치)
    // 자기 테두리 · 배경 · 그림자가 있는 칸(카드)은 보이는 바닥이 상자 바닥 — 없는 칸(그냥 열)만 아래 안쪽 여백을 뺌
    const visualBox = (k: Element): boolean => {
      const cs = getComputedStyle(k);
      return parseFloat(cs.borderBottomWidth) > 0 || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || cs.boxShadow !== "none";
    };
    const bottoms = big.map((k, i) => (visualBox(k) ? BR[i].bottom : BR[i].bottom - parseFloat(getComputedStyle(k).paddingBottom)));
    const diff = Math.max(...bottoms) - Math.min(...bottoms);
    if (diff > 24) {
      const short = big[bottoms.indexOf(Math.min(...bottoms))];
      add("b", `두 칸 아래 끝 차이 ${label(el)} 짧은 칸=${label(short)}`, diff);
    }
  }

  // c — 899 이하: 기둥(구역 · 컨테이너)이 가운데이고, 상자 덩어리(카드 · 전광판 · 입력 · 버튼 줄 · 그림 · 표)는 기둥 폭을 채우거나 가운데 (lead 결정: 글 p · h1 · 인라인이 기둥 안에서 왼쪽 정렬인 것은 쏠림 아님)
  if (W <= 899) {
    const boxTags = new Set(["INPUT", "SELECT", "TEXTAREA", "IMG", "CANVAS", "TABLE", "BUTTON", "SVG"]);
    const isBox = (e: Element): boolean => {
      if (boxTags.has(e.tagName.toUpperCase())) return true;
      const cs = getComputedStyle(e);
      // 링크(a)는 바탕이 있거나 위·왼쪽까지 테두리가 둘러야 상자 — 밑줄만(border-bottom) 있는 링크는 글(lead 기준)
      if (e.tagName === "A") {
        const hasBg = !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || cs.backgroundImage !== "none";
        return hasBg || (parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderLeftWidth) > 0);
      }
      const border = ["Top", "Right", "Bottom", "Left"].some((d) => parseFloat(cs.getPropertyValue(`border-${d.toLowerCase()}-width`)) > 0 && cs.getPropertyValue(`border-${d.toLowerCase()}-style`) !== "none");
      const bg = !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || cs.backgroundImage !== "none";
      return border || bg || cs.boxShadow !== "none";
    };
    const boxes = all.filter((e) => e.tagName !== "BODY" && e.tagName !== "MAIN" && e.tagName !== "HTML" && isBox(e));
    const boxSet = new Set(boxes);
    const containerTags = new Set(["DIV", "SECTION", "ARTICLE", "FORM", "UL", "OL", "NAV", "DETAILS", "FIGURE"]);
    const hasBoxInside = (e: Element): boolean => boxes.some((x) => x !== e && e.contains(x));
    const bad = new Set<Element>();
    for (const e of all) {
      const asBox = boxSet.has(e);
      if (!asBox && !(containerTags.has(e.tagName) && hasBoxInside(e))) continue;
      const s = getComputedStyle(e);
      if (!(s.display === "block" || s.display === "flex" || s.display === "grid" || s.display === "list-item" || s.display === "table" || s.display === "flow-root" || s.display === "inline-flex" || s.display === "inline-block")) continue;
      if (e.closest("[data-testid='hero-passes']")) continue; // 탑승권 카드(가운데 놓인 장식 묶음) 안 요소는 기둥 점검 밖(lead 결정)
      if (e.tagName === "SPAN" || s.transform !== "none") continue; // 꼬리표 · 배지(span)와 기울인 장식은 글 줄의 일부
      const r = e.getBoundingClientRect();
      if (r.width < W * 0.3 || r.height < 24 || r.width >= W - 1) continue;
      if (s.position === "absolute" || s.position === "fixed" || fixedAncestor(e)) continue;
      let scroller = false;
      for (let n: Element | null = e.parentElement; n && n !== document.body; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX;
        if (o === "auto" || o === "scroll") scroller = true;
      }
      if (scroller) continue;
      // 옆에 형제가 있으면(같은 줄 · 위 세 단계 안) 한 줄 배치가 아님
      let beside = false;
      for (let n: Element = e, up = 0; up < 3 && n.parentElement && !beside; n = n.parentElement, up++) {
        const nr = n.getBoundingClientRect();
        const sib = [...n.parentElement.children].filter((k) => k !== n && shown(k));
        beside = sib.some((k) => {
          const kr = k.getBoundingClientRect();
          return kr.top < nr.bottom - 1 && kr.bottom > nr.top + 1 && kr.width > 20 && (kr.left >= nr.right - 1 || kr.right <= nr.left + 1);
        });
      }
      if (beside) continue;
      const d = r.left - (W - r.right);
      if (Math.abs(d) <= 2) continue; // 화면 가운데
      // lead 기준: 기둥(부모 안쪽 폭)보다 좁아도 왼쪽 끝이 기둥 왼쪽 끝과 같으면(±2) 왼쪽 정렬 내용으로 통과 · 실패 = ① 왼쪽 끝이 기둥과 어긋남 ② 칸 모양(바탕 · 테두리 · 입력)이 기둥의 60% 넘는데 꽉 채우지도 가운데도 아님
      const par = e.parentElement;
      const ps = par ? getComputedStyle(par) : null;
      const pr = par ? par.getBoundingClientRect() : null;
      if (par && ps && pr) {
        const colLeft = pr.left + parseFloat(ps.paddingLeft) + parseFloat(ps.borderLeftWidth);
        const colRight = pr.right - parseFloat(ps.paddingRight) - parseFloat(ps.borderRightWidth);
        const colW = colRight - colLeft;
        if (Math.abs(r.left - colLeft) <= 2) {
          const filled = r.width >= colW - 2;
          if (filled || !asBox || r.width <= colW * 0.6) continue;
          add("c", `칸이 기둥의 ${Math.round((r.width / colW) * 100)}% 인데 꽉 채우지도 가운데도 아님 ${label(e)}`, colW - r.width);
          bad.add(e);
          continue;
        }
        if (Math.abs((r.left - colLeft) - (colRight - r.right)) <= 2) continue; // 기둥 가운데
      }
      let anc = false;
      for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) if (bad.has(n)) anc = true;
      if (anc) continue;
      bad.add(e);
      add("c", `왼쪽 끝이 기둥과 어긋남 ${label(e)}`, d);
    }
  }

  // d — 구역 안 아래 빈 공간
  for (const e of [...document.body.querySelectorAll("section, article, [data-testid='home-hero'], [data-testid='budget']")]) {
    if (!shown(e) || skip(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.height < 200) continue;
    let last = r.top;
    for (const c of e.querySelectorAll("*")) {
      if (c.closest("svg") && c.tagName.toLowerCase() !== "svg") continue; // 그림(svg)은 하나의 덩어리로 셈
      // aria-hidden 글자판 · 전광판 글자(보이는 그림)도 내용으로 셈 — 읽는 이 숨김일 뿐 화면에는 보임
      if (!shown(c) || inClosedDetails(c) || c.closest("[inert],.sr-only,script,style,noscript")) continue;
      const cs = getComputedStyle(c);
      if (cs.position === "absolute") continue;
      const leaf = c.tagName.toLowerCase() === "svg" || c.children.length === 0 || [...c.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "");
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

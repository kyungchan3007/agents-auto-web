// 찾기 창 항목 (작업 0303 · 0312 에 admin-shell.tsx 에서 옮김)
//   모으기(collectItems)는 지금 화면의 [data-cmd] 요소를 읽음(브라우저) · 거르기 · 순위(rankItems)는 순수 함수
import { match } from "../../search/match";
import { flashPanel } from "../events/admin-events";

/** 어드민 화면 하나 — key 는 단축키(숫자 한 글자) · icon 은 틀의 아이콘 이름 */
export type AdminNavPage = { id: string; href: string; label: string; short: string; key: string; icon: "log" | "geo" | "how" | "marketing" | "traffic" | "instagram" };
export type SiteLink = { href: string; label: string };
export type PaletteItem = { group: string; label: string; hint: string; run: () => void };

/** 화면들 + 지금 화면의 판 · 질문 · 규칙 · 궁금한 것 + 사이트로 가기 */
export function collectItems(pages: AdminNavPage[], page: string, site: SiteLink): PaletteItem[] {
  const go = (href: string) => () => {
    location.href = href;
  };
  const screens = pages.map((p) => ({ group: "화면", label: p.label, hint: p.key, run: p.id === page ? () => scrollTo({ top: 0, behavior: "smooth" }) : go(p.href) }));
  const here = pages.find((p) => p.id === page)?.label ?? "";
  const dom = [...document.querySelectorAll<HTMLElement>("[data-cmd]")].map((el) => ({
    group: el.dataset.cmd ?? "",
    label: el.dataset.cmdLabel ?? el.textContent?.trim() ?? "",
    hint: here,
    run: () => {
      const ev = new CustomEvent("adm-pick", { cancelable: true, bubbles: true });
      if (el.dispatchEvent(ev)) flashPanel(el);
    },
  }));
  return [...screens, ...dom, { group: "할 일", label: "사이트로 가기", hint: site.label, run: go(site.href) }];
}

type Match = NonNullable<ReturnType<typeof match>>;

/** 이름이 맞거나(맞은 조각) 묶음 이름이 맞는 항목 — 찾는 글이 있으면 점수순 · 40개까지 */
export function rankItems<T extends { label: string; group: string }>(items: T[], q: string): { it: T; m: Match }[] {
  return items
    .map((it) => ({ it, m: match(it.label, q) ?? (q && match(it.group, q) ? { hits: [], score: 1 } : null) }))
    .filter((x): x is { it: T; m: Match } => x.m !== null)
    .sort((a, b) => (q ? b.m.score - a.m.score : 0))
    .slice(0, 40);
}

/** 고른 줄 — 목록이 줄어도 끝을 넘지 않게 */
export const clampSel = (sel: number, n: number) => Math.min(sel, Math.max(n - 1, 0));

/** 화살표로 다음 · 앞 줄 (끝에서 처음으로) */
export const stepSel = (cur: number, n: number, down: boolean) => (cur + (down ? 1 : -1) + n) % n;

/** 찾기 단축키 표시 — Mac · iPhone · iPad 는 ⌘K, 그 밖은 Ctrl K */
export const findKeyLabel = (platform: string) => (/Mac|iPhone|iPad/.test(platform) ? "⌘K" : "Ctrl K");

/** 단축키 칸 글 — "Ctrl K" → "CtrlK" */
export const kbdText = (label: string) => label.replace(" ", "");

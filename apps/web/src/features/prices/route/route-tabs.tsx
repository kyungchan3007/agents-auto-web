// 노선 고르기 탭 줄 + 설명 한 줄 (작업 0360 · 시안 11번) — 그리기만 · 탭 상태는 use-route-tabs · 기본 탭 글에 "기본" · 누르는 자리 44px
import { DEFAULT_TAB, type RouteTab, type RouteTabId } from "@hav/shared/route-tabs";

export function RouteTabs({ tabs, tab, note, onChoose }: { tabs: RouteTab[]; tab: RouteTabId; note: string; onChoose: (id: RouteTabId) => void }) {
  return (
    <div className="mb-3">
      <div data-testid="route-tabs" role="tablist" aria-label="노선 고르기" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-testid="route-tab"
            data-tab={t.id}
            aria-selected={t.id === tab}
            onClick={() => onChoose(t.id)}
            className={`tap-44 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill border px-4 text-[0.9375rem] font-bold whitespace-nowrap transition-colors duration-200 ${t.id === tab ? "border-fg bg-fg text-card" : "border-line bg-card text-fg hover:border-fg"}`}
          >
            {t.label}
            {t.id === DEFAULT_TAB && <small className={`text-[0.75rem] font-normal ${t.id === tab ? "text-card/80" : "text-fg-2"}`}>기본</small>}
          </button>
        ))}
      </div>
      <p data-testid="route-note" className="mt-2.5 text-small text-fg-2">
        {note}
      </p>
    </div>
  );
}

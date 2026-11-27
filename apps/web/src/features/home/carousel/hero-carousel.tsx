"use client";

// 첫 페이지 hero 캐러셀 (작업 0385) — 그리기만 · 두 장(블프 · 여행 타이밍)은 home 이 서버에서 만들어 넘긴 요소를 같은 grid 칸에 겹쳐 둠(높이 = 긴 장 · JS 로 재지 않음)
//   상태 · 시간표는 use-hero-carousel · 순서 · 이름은 carousel.ts · 보이는 모양은 carousel.css
import type { CSSProperties, ReactNode } from "react";
import { SLIDE_LABEL, SLIDE_MS, SLIDES, type SlideId } from "./carousel";
import "./carousel.css";
import { useHeroCarousel } from "./use-hero-carousel";

export function HeroCarousel({ slides }: { slides: Record<SlideId, ReactNode> }) {
  const c = useHeroCarousel();
  return (
    <div data-testid="hero-carousel" data-surface="dark" data-slide={c.active} data-auto={c.auto ? "on" : "off"} data-held={String(c.held)} className="hc" {...c.bind}>
      <div className="hc-stack">
        {SLIDES.map((id) => (
          <div key={id} id={`hc-slide-${id}`} data-testid="hero-slide" data-slide={id} data-active={String(id === c.active)} role="tabpanel" aria-label={SLIDE_LABEL[id]} aria-hidden={id !== c.active} inert={id !== c.active} className="hc-slide">
            {slides[id]}
          </div>
        ))}
      </div>
      <div className="hc-nav">
        <button type="button" data-testid="hero-prev" aria-label="이전 장" className="hc-arrow" onClick={c.prev}>
          ‹
        </button>
        <div role="tablist" data-testid="hero-tabs" aria-label="첫 화면 고르기" className="hc-tabs">
          {SLIDES.map((id) => (
            <button key={id} type="button" role="tab" data-testid="hero-tab" data-slide={id} aria-selected={id === c.active} aria-controls={`hc-slide-${id}`} className="hc-tab" onClick={() => c.pick(id)}>
              <span className="hc-dot" aria-hidden="true" />
              {SLIDE_LABEL[id]}
              {id === c.active && c.auto && <span key={c.epoch} data-testid="hero-progress" aria-hidden="true" className="hc-fill" style={{ "--dur": `${SLIDE_MS[id]}ms` } as CSSProperties} />}
            </button>
          ))}
        </div>
        <button type="button" data-testid="hero-next" aria-label="다음 장" className="hc-arrow" onClick={c.next}>
          ›
        </button>
      </div>
    </div>
  );
}

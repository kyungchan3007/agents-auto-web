"use client";

// 홈 흐름 2 "여행지 고르기" — 지구본은 화면에 고정 · 글 칸이 화면 가운데에 오면 그 도시로 돎 (docs/design.md)
// 숫자 · 신호는 빌드 때 받은 값만 · 없으면 "자료 없음" 글자 (FX-02 · TRV-02) · 3D 가 없어도 글은 그대로 읽힘
import type { Place } from "@hav/ui/three/lib/geo";
import { GlobeLazy } from "@hav/ui/three/scene/lazy";
import { EARTH_TEXTURE } from "../lib/places";
import { TripCard, type TripStop } from "./trip-card";
import { useActiveStep } from "../hooks/use-active-step";

export type { TripStop };

export function TripScenes({ origin, stops }: { origin: Place; stops: TripStop[] }) {
  const { active, stepRef } = useActiveStep();

  return (
    <div className="relative grid gap-0 lg:grid-cols-[1fr_1fr] lg:gap-10">
      {/* 휴대폰: 위에 고정 · 넓은 화면: 왼쪽에 고정 */}
      <div className="sticky top-(--hav-nav-h) z-0 h-[38svh] lg:h-[calc(100svh-3.25rem)]">
        <GlobeLazy
          className="h-full w-full"
          origin={origin}
          texture={EARTH_TEXTURE}
          focus={stops[active]?.place ?? null}
          arcs={stops.map((s) => ({ to: s.place, tone: s.signal }))}
        />
      </div>
      <div className="relative z-10">
        {stops.map((s, i) => (
          <article
            key={s.place.id}
            ref={stepRef(i)}
            data-index={i}
            aria-current={i === active ? "step" : undefined}
            className="flex min-h-[70svh] items-end py-10 lg:min-h-[85svh] lg:items-center"
          >
            <TripCard stop={s} active={i === active} />
          </article>
        ))}
      </div>
    </div>
  );
}

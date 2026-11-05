// 2 여행지 고르기 — 지구본 고정 · 스크롤로 도시를 옮김
import { SEOUL } from "./places";
import { TripScenes, type TripStop } from "./trip-scenes";

export function TripsSection({ stops }: { stops: TripStop[] }) {
  return (
    <section id="trips" data-surface="dark" className="bg-surface px-4 pt-24 text-fg sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <p className="text-eyebrow font-semibold text-fg-2">여행지 고르기</p>
        <h2 className="mt-3 text-title font-semibold tracking-tight">
          여행지 비교.
          <br />
          환율과 물가를 함께 확인합니다.
        </h2>
        <TripScenes origin={SEOUL} stops={stops} />
      </div>
    </section>
  );
}

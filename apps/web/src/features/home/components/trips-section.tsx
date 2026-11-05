// 2 여행지 고르기 — 지구본 고정 · 스크롤로 도시를 옮김
import { SEOUL } from "../lib/places";
import { TripScenes, type TripStop } from "./trip-scenes";
import { Eyebrow, Title } from "@hav/ui/text/heading";

export function TripsSection({ stops }: { stops: TripStop[] }) {
  return (
    <section id="trips" data-surface="dark" className="bg-surface px-4 pt-24 text-fg sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <Eyebrow>여행지 고르기</Eyebrow>
        <Title className="mt-3">
          여행지 비교.
          <br />
          환율과 물가를 함께 확인합니다.
        </Title>
        <TripScenes origin={SEOUL} stops={stops} />
      </div>
    </section>
  );
}

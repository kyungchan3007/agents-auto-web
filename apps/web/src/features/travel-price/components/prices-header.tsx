"use client";

// 여행 물가 맨 위 — 고른 나라가 있으면 "일본은 한국보다 물가가 12% 높습니다" + 그 나라 사진 + "다른 나라 보기" · 안 골랐거나 자료 없는 나라는 지금 문장(가장 싼 나라) · 지금 사진 (작업 0201)
// 서버 HTML 은 안 골랐을 때 문장 + 그 문장 속 나라 사진(작업 0209) · 마운트 뒤에 고른 값을 읽어 바뀜
import { PickTrip } from "@hav/ui/form/pick-trip";
import { usePickedTrip } from "@hav/ui/hooks/use-picked-trip";
import { PhotoHeader } from "@hav/ui/layout/photo-header";
import { EmphText } from "@hav/ui/text/emph";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { pickedHeadline } from "../lib/prices-copy";

export type HeaderRow = { country: string; name: string; relative: number; year: number };

export function PricesHeader({ rows, title, defaultCountry = null }: { rows: HeaderRow[]; /** 안 골랐을 때 문장 (가장 싼 나라 · 서버가 만든 값) */ title: string; /** 그 문장 속 나라 — 안 골랐을 때 머리 사진 (작업 0209) */ defaultCountry?: string | null }) {
  const picked = usePickedTrip();
  const mine = pickedHeadline(picked?.country, rows);
  return (
    <PhotoHeader name="swiss-traveler" country={picked?.country ?? defaultCountry} alt="스위스 풍경을 바라보는 여행자" veil="light" priority>
      <Eyebrow>여행 물가</Eyebrow>
      <Title as="h1" size="page" className="mt-3 text-cheap">
        <EmphText text={mine ? mine.title : title} />
      </Title>
      <p className="mt-6 max-w-[36em] text-body text-fg-2">세계은행 나라별 물가 수준(한국 = 100)과 오늘 그 나라 통화 신호를 함께 봅니다.</p>
      {picked && <PickTrip label="다른 나라 보기" testId="pick-trip-other" className="mt-6" />}
    </PhotoHeader>
  );
}

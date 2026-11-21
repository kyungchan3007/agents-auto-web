"use client";

// 여행 물가 맨 위 글 — 넓은 화면은 제목을 왼쪽 칼럼에 묶어(lg:max-w-7.4em) 시안처럼 세 줄 "인도는 한국보다 / 물가가 63% / 낮습니다" (작업 0220 사용자 지적) · 파랑 면 위: 굵은 큰 제목(제목 위 라벨 "여행 물가"는 작업 0265 에서 지움)(숫자 %는 노랑) · 지금 설명 (작업 0220 · 시안 B · 사진은 걷어 냄)
// 고른 나라가 있으면 "일본은 한국보다 물가가 12% 높습니다" + "다른 나라 보기" · 안 골랐거나 자료 없는 나라는 지금 문장(가장 싼 나라) (작업 0201)
// 서버 HTML 은 지금과 같고(검색 · AI 가 읽는 글) 마운트 뒤에 고른 값을 읽어 바뀜 · 파랑 면과 예산 카드는 price-page 가 그림
import { PickTrip } from "@hav/ui/form/pick-trip";
import { usePickedTrip } from "@hav/ui/hooks/use-picked-trip";
import { EmphText } from "@hav/ui/text/emph";
import { pickedHeadline } from "../lib/prices-copy";

export type HeaderRow = { country: string; name: string; relative: number; year: number };

export function PricesHeader({ rows, title }: { rows: HeaderRow[]; /** 안 골랐을 때 문장 (가장 싼 나라 · 서버가 만든 값) */ title: string }) {
  const picked = usePickedTrip();
  const mine = pickedHeadline(picked?.country, rows);
  return (
    <div data-surface="dark" className="text-fg">
      <h1 className="font-display text-[clamp(2.5rem,6.2vw,5.25rem)] leading-[1.08] font-extrabold tracking-display text-fg tabular-nums lg:max-w-[7.4em]">
        <EmphText text={mine ? mine.title : title} bg="sea" underline />
      </h1>
      <p className="mt-6 max-w-[36em] text-body text-fg-2 sm:text-[1.125rem]">세계은행 나라별 물가 수준(한국 = 100)과 오늘 그 나라 통화 신호를 함께 봅니다.</p>
      {picked && <PickTrip label="다른 나라 보기" testId="pick-trip-other" className="mt-6" />}
    </div>
  );
}

// 5 직구 계산기 입구 — 밝은 섹션
import { Reveal } from "@hav/ui/reveal";
import Link from "next/link";
import { MoneyCatLazy } from "@hav/ui/three/lazy";
import { Eyebrow, Title } from "@hav/ui/heading";

export function CalcSection() {
  return (
    <section id="calc" data-surface="light" className="bg-surface px-4 py-24 text-fg sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <Eyebrow>직구 계산기</Eyebrow>
          <Title className="mt-3">
            구매 전에,
            <br />
            세금 부과 여부를 확인합니다.
          </Title>
          <p className="mt-6 text-lead text-fg-2">물건 값과 배송비를 넣으면 원화로 얼마인지, 면세 한도 안인지, 넘으면 관세 · 부가세가 얼마쯤인지 바로 보여 줍니다.</p>
          <Link href="/calc" className="mt-8 inline-flex rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">
            직구 계산하기
          </Link>
        </Reveal>
        <MoneyCatLazy mood="happy" className="h-[260px] w-full sm:h-[320px]" />
      </div>
    </section>
  );
}

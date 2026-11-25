// 다음으로 볼 것 카드 셋 (작업 0344 · 시안 2-new) — ① 환전 ② 항공권 ③ 예산 · 카드마다 링크 하나 · 값이 없으면 "자료 없음"
import Link from "next/link";
import type { CountryView } from "./country-model";
import { nextCards } from "./next-card-view";

export function NextCards({ v }: { v: CountryView }) {
  return (
    <section aria-labelledby="country-next" className="mt-0">
      <h2 id="country-next" className="font-display text-[1.75rem] leading-tight font-extrabold tracking-display text-fg sm:text-[2.25rem]">
        {v.name} 여행, 다음으로 볼 것
      </h2>
      <p className="mt-2 text-small text-fg-2">물가를 봤다면 환율 · 항공권 · 예산 순서로 이어서 확인합니다.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {nextCards(v).map((c) => (
          <article key={c.kicker} data-testid="next-card" className="rounded-[1.5rem] border border-line bg-card p-5 text-fg shadow-ticket sm:p-6">
            <p className="text-[0.75rem] font-bold text-fg-2">{c.kicker}</p>
            <p className="mt-1 text-[1rem] font-bold">{c.title}</p>
            <p className="mt-3 text-[1.5rem] leading-tight font-bold tracking-display tabular-nums sm:text-[1.75rem]">{c.big}</p>
            <p className="mt-1 text-small text-fg-2">{c.say}</p>
            <Link href={c.href} data-track={c.track} className="mt-4 inline-block text-small font-bold text-fg underline-offset-2 hover:underline">
              {c.link} ›
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

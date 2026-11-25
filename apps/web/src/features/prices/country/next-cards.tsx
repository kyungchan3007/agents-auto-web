// 다음으로 볼 것 카드 셋 (작업 0344 · 시안 2-new) — ① 환전 ② 항공권 ③ 예산 · 카드마다 링크 하나 · 값이 없으면 "자료 없음"
import Link from "next/link";
import type { CountryView } from "./country-model";

type Card = { track: string; kicker: string; title: string; big: string; say: string; href: string; link: string };

/** 카드 셋의 글 — 순서 고정 (환전 · 항공권 · 예산) */
function cards(v: CountryView): Card[] {
  const fx: Card = v.exchange
    ? { track: "country_next_fx", kicker: "1 · 환전", title: v.exchange.title, big: `${v.exchange.value} / ${v.exchange.unit}`, say: v.exchange.note, href: `/currencies/${v.currency}`, link: "환율 1년 흐름 보기" }
    : { track: "country_next_fx", kicker: "1 · 환전", title: "환전은 지금 해도 될까", big: "자료 없음", say: "이 나라 통화의 오늘 환율을 받지 못했습니다", href: v.currency ? `/currencies/${v.currency}` : "/currencies", link: "통화 둘러보기" };
  const f = v.flight;
  const air: Card =
    f.kind === "fare"
      ? { track: "country_next_flight", kicker: "2 · 항공권", title: `${f.city}, 언제 떠나면 쌀까`, big: f.big, say: f.say, href: "/flights", link: `${f.city} 출발일 달력 보기` }
      : f.kind === "timing"
        ? { track: "country_next_flight", kicker: "2 · 항공권", title: `${v.name}, 언제 떠나면 쌀까`, big: f.big, say: `떠나기 싼 달 · ${f.say}`, href: "/flights", link: "항공권 달 보기" }
        : { track: "country_next_flight", kicker: "2 · 항공권", title: `${v.name}, 언제 떠나면 쌀까`, big: f.say, say: "항공권 자료를 받지 못했습니다", href: "/flights", link: "항공권 보기" };
  const budget: Card = { track: "country_next_budget", kicker: "3 · 예산", title: `${v.budget.days}일이면 얼마나 들까`, big: v.budget.text, say: `한국에서 하루 10만 원 쓰는 만큼 · 물가 비율 ${v.index}`, href: "#budget", link: "예산 다시 짜기" };
  return [fx, air, budget];
}

export function NextCards({ v }: { v: CountryView }) {
  return (
    <section aria-labelledby="country-next" className="mt-0">
      <h2 id="country-next" className="font-display text-[1.75rem] leading-tight font-extrabold tracking-display text-fg sm:text-[2.25rem]">
        {v.name} 여행, 다음으로 볼 것
      </h2>
      <p className="mt-2 text-small text-fg-2">물가를 봤다면 환율 · 항공권 · 예산 순서로 이어서 확인합니다.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {cards(v).map((c) => (
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

// 자주 묻는 질문 (작업 0344 · 시안 6-new) — <details> · 처음 두 개 펼침 · 같은 문항이 구조화 자료(FAQPage)에도 들어감
import { FaqList } from "@hav/ui/data/faq-list";
import type { FaqItem } from "./country-view";

export function CountryFaq({ name, year, items }: { name: string; year: number; items: FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="country-faq" className="mt-16 max-w-[44rem] max-lg:max-w-none">
      <h2 id="country-faq" className="font-display text-[1.75rem] leading-tight font-extrabold tracking-display text-fg sm:text-[2.25rem]">
        {name} 여행 물가, 자주 묻는 질문
      </h2>
      <p className="mt-2 text-small text-fg-2">숫자는 세계은행 {year}년 물가 자료와 오늘 받은 환율 · 항공권 자료 기준입니다.</p>
      <FaqList items={items} track="faq_open_prices" />
    </section>
  );
}

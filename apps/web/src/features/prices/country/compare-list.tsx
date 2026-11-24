// 견줘 볼 나라 (작업 0344 · 시안 2-new) — 그 나라 물가 기준으로 다시 계산한 % · 누르면 그 나라 페이지
import Link from "next/link";
import type { CountryView } from "./country-model";
import { countryPath, eunNeun } from "./country-view";

export function CompareList({ v }: { v: CountryView }) {
  if (v.compare.length === 0) return null;
  return (
    <section aria-labelledby="country-compare" className="mt-12">
      <h2 id="country-compare" className="text-[1.25rem] font-bold text-fg">
        {v.name}
        {eunNeun(v.name) === "은" ? "과" : "와"} 견줘 볼 나라
      </h2>
      <p className="mt-1 text-small text-fg-2">
        {v.name} 물가({v.index})를 기준으로 비교합니다 · 누르면 그 나라 페이지로 갑니다
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {v.compare.map((c) => (
          <li key={c.country}>
            <Link data-testid="compare-link" href={countryPath(c.country)} className="tap-44 flex h-full flex-wrap items-baseline justify-between gap-x-3 rounded-[0.75rem] border border-line bg-card px-4 py-3 text-fg hover:border-fg">
              <span className="font-bold">{c.name}</span>
              <span className="text-small text-fg-2">물가 {c.index}</span>
              <span className="w-full text-small font-bold">{c.diffText}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

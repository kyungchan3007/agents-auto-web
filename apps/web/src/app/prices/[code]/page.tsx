import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CountryPage } from "@/features/prices/country/country-page";
import { loadCountry, loadTargets } from "@/features/prices/country/load";
import { api } from "@hav/shared/api";
import { JsonLd } from "@/shared/seo/json-ld";
import { breadcrumbLd, faqLd, pageMeta } from "@/shared/seo/seo";
import { countryPath } from "@/features/prices/country/country-view";

// 나라마다 정적 페이지 — 빌드 때 받은 물가에 값이 있는 TRAVEL_COUNTRIES 나라 (alpha-3 대문자) · 그 밖의 주소는 404 (작업 0344)
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await loadTargets()).map((code) => ({ code }));
}

export async function generateMetadata({ params }: PageProps<"/prices/[code]">): Promise<Metadata> {
  const { code } = await params;
  const { view, descriptionLine } = await loadCountry(code);
  if (!view) return {};
  const description = `${view.title}. ${descriptionLine ? `${descriptionLine}. ` : ""}세계은행 ${view.year}년 물가 자료 · 환율 신호 · 항공권 · 하루 예산을 한 곳에서 봅니다`;
  return pageMeta({ path: countryPath(code), title: `${view.name} 물가 · ${view.title} · Flapfx`, description });
}

export default async function Page({ params }: PageProps<"/prices/[code]">) {
  const { code } = await params;
  const [{ view, levels }, signals] = await Promise.all([loadCountry(code), api.signals()]);
  if (!view || !levels) notFound();
  const faq = faqLd(view.faq);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "여행 물가", path: "/prices" }, { name: view.name, path: countryPath(code) }])} />
      {faq && <JsonLd data={faq} />}
      <CountryPage view={view} levels={levels} signals={signals} />
    </>
  );
}

import { buildTimeIso } from "@hav/shared/fx-schedule";
import type { Metadata } from "next";
import { currencyName } from "@hav/shared/currency";
import { CurrencyDetail } from "@/features/currencies/detail/currency-detail";
import { describeCurrency } from "@/features/currencies/page-data/describe";
import { loadDetail } from "@/features/currencies/page-data/load";
import { DEFAULT_CODE } from "@/features/currencies/browse/route";
import { api, mustHave } from "@hav/shared/api";
import { JsonLd } from "@/shared/seo/json-ld";
import { breadcrumbLd, faqLd, pageMeta, rateDatasetLd } from "@/shared/seo/seo";
import { detailFaq } from "@/features/currencies/detail/detail-faq";

// 통화마다 정적 페이지 — API 가 준 통화 전부 (FX-03) · API 가 안 되면 달러 하나만 ("자료 없음")
export const dynamicParams = false;

export async function generateStaticParams() {
  const latest = mustHave(await api.latest(), "통화 목록");
  const codes = latest.ok && latest.data.rates.length > 0 ? latest.data.rates.map((r) => r.currency) : [DEFAULT_CODE];
  return codes.map((code) => ({ code }));
}

export async function generateMetadata({ params }: PageProps<"/currencies/[code]">): Promise<Metadata> {
  const { code } = await params;
  // 설명 글에 기준일 · 값 · 신호 (작업 0093) — 빌드 때 받은 값만
  const d = await loadDetail(code);
  const description = describeCurrency(code, d.rate, d.signal.ok ? d.signal.data.signal : null);
  return pageMeta({ path: `/currencies/${code}`, title: `${currencyName(code)} ${code} 환율 · 1년 흐름 · 통화 둘러보기 · Flapfx`, description });
}

export default async function Page({ params }: PageProps<"/currencies/[code]">) {
  const { code } = await params;
  const d = await loadDetail(code);
  const faq = faqLd(detailFaq(d).items);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "통화 둘러보기", path: "/currencies" }, { name: `${currencyName(code)} ${code}`, path: `/currencies/${code}` }])} />
      {d.rate && <JsonLd data={rateDatasetLd(code, d.rate)} />}
      {faq && <JsonLd data={faq} />}
      <CurrencyDetail {...d} builtAt={buildTimeIso()} />
    </>
  );
}

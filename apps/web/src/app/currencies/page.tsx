import type { Metadata } from "next";
import { CurrencyDetail } from "@/features/currencies/detail/currency-detail";
import { loadDetail } from "@/features/currencies/page-data/load";
import { BrowseList } from "@/features/currencies/browse/browse-list";
import { DEFAULT_CODE } from "@/features/currencies/browse/route";
import { JsonLd } from "@/shared/seo/json-ld";
import { breadcrumbLd, pageMeta } from "@/shared/seo/seo";

export const metadata: Metadata = pageMeta({ path: "/currencies" });

// /currencies — 달러를 먼저 보여 줌
export default async function Page() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "통화 둘러보기", path: "/currencies" }])} />
      <CurrencyDetail {...await loadDetail(DEFAULT_CODE)} />
      <BrowseList />
    </>
  );
}

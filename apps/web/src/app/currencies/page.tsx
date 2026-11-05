import type { Metadata } from "next";
import { CurrencyDetail } from "@/features/currencies/components/currency-detail";
import { loadDetail } from "@/features/currencies/lib/load";
import { DEFAULT_CODE } from "@/features/currencies/lib/route";

export const metadata: Metadata = { alternates: { canonical: "/currencies" } };

// /currencies — 달러를 먼저 보여 줌
export default async function Page() {
  return <CurrencyDetail {...await loadDetail(DEFAULT_CODE)} />;
}

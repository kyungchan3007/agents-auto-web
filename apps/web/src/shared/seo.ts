// 검색 · 공유 정보 도우미 (작업 0304) — 페이지마다 같은 모양의 메타(og:url · twitter) · 구조화 자료(JSON-LD) 를 한 곳에서 만듦
// 구조화 자료의 값은 받은 자료에서만 (받지 못한 값은 넣지 않음 · AGENTS 규칙 7)
import type { Metadata } from "next";
import { SOURCE_NAME, currencyName } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

/** 홈 전용 설명 — 지금 화면 · docs/domain 사실만 (신호는 최근 90일 비교 · 환율은 한국수출입은행) */
export const HOME_DESCRIPTION = "한국수출입은행 환율이 최근 90일 중 낮은지 높은지 신호로 알려 주고 · 여행 물가와 직구 세금 예상까지 한 곳에서 보여 줍니다";

/** 페이지 메타 — canonical · og:url 은 같은 주소 · og · twitter 제목 · 설명을 명시 (페이지에서 openGraph 를 쓰면 공통 값이 통째로 바뀌므로 siteName · locale · type 도 여기서 같이) */
export function pageMeta(p: { path: string; title?: string; description?: string }): Metadata {
  const title = p.title ?? SITE_NAME;
  const description = p.description ?? SITE_DESCRIPTION;
  return {
    ...(p.title ? { title: p.title } : {}),
    ...(p.description ? { description: p.description } : {}),
    alternates: { canonical: p.path },
    openGraph: { siteName: SITE_NAME, locale: "ko_KR", type: "website", url: p.path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** 사이트 이름 · 운영자 */
export function siteLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: "ko", description: HOME_DESCRIPTION },
      { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
    ],
  };
}

/** 경로 — 첫 항목은 홈 */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "홈", path: "/" }, ...items].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path === "/" ? "" : it.path}` })),
  };
}

/** 통화 상세 환율 자료 — 기준일 · 출처 · 값은 받은 환율에서만 */
export function rateDatasetLd(code: string, rate: Pick<FxRate, "date" | "baseRate" | "unit" | "source">) {
  const name = `${currencyName(code)} ${code} 환율`;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description: `${name} — ${rate.date} 기준 매매기준율 (${SOURCE_NAME[rate.source]})`,
    url: `${SITE_URL}/currencies/${code}`,
    inLanguage: "ko",
    dateModified: rate.date,
    creator: { "@type": "Organization", name: SOURCE_NAME[rate.source] },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    variableMeasured: { "@type": "PropertyValue", name: "매매기준율", value: rate.baseRate, unitText: `원 / ${rate.unit} ${code}` },
  };
}

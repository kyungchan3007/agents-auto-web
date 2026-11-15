import type { Metadata, Viewport } from "next";
import { Gasoek_One, IBM_Plex_Sans_KR } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/shared/site";
import { outageActive } from "@/shared/outage";
import { OutageNotice } from "@/shared/outage-notice";
import "./globals.css";

// 글꼴 — 큰 제목 · 큰 숫자 Gasoek One · 본문 IBM Plex Sans KR (400 · 600) · 빌드 때 받아 자체 호스팅 (런타임 외부 요청 없음 · next.config 변경 없음 · 작업 0168)
//   CSS 변수는 tokens.css 의 --font-display · --font-sans 가 읽음 · 한글 조각은 글자가 쓰일 때만 받음 (unicode-range)
const display = Gasoek_One({ weight: "400", subsets: ["latin"], variable: "--font-gasoek-one", display: "swap" });
const sans = IBM_Plex_Sans_KR({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-ibm-plex-sans-kr", display: "swap" });

// 공유 미리보기 — 이미지는 app/opengraph-image.tsx · 페이지마다 제목 · 설명은 각 page 의 metadata (작업 0076)
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: { siteName: SITE_NAME, locale: "ko_KR", type: "website" },
  twitter: { card: "summary_large_image" },
  // 홈 화면에 추가했을 때 iOS 위 막대 · 이름 (작업 0091 · 아이콘은 app/apple-icon.png)
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  // Google Search Console · Bing Webmaster Tools 소유권 확인 — 공개 값 · 지우면 확인이 풀림 (작업 0116 · 0117)
  verification: { google: "R0iWKilXNc-qRD85sm-ZvPjOdQOBP_GYUn-0hBPZAsY", other: { "msvalidate.01": "80D88D51D528F03400697BF62BD604BF" } },
};

// 휴대폰 주소창 색 — 사이트 바탕(하늘 종이) 한 값 · 밝은 화면 하나만 (작업 0173)
export const viewport: Viewport = {
  themeColor: "#EAF4F2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-surface="light" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-surface text-fg">
        {/* 장애 안내 — 모든 페이지 맨 위 (빌드 때 끝난 시각이면 안 넣음) */}
        <OutageNotice show={outageActive()} />
        {children}
      </body>
    </html>
  );
}

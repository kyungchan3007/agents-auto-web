import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import { SITE_NAME } from "@hav/shared/site";
import "./globals.css";

// 어드민 앱 뿌리 (작업 0312 · 운영 apps/web/src/app/layout.tsx 에서 어드민이 쓰는 것만)
//   글꼴 — 본문 IBM Plex Sans KR · 숫자 · 시각 · 경로는 IBM Plex Mono(--font-adm-mono) · 빌드 때 받아 자체 호스팅 (작업 0168 · 0303)
const sans = IBM_Plex_Sans_KR({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-ibm-plex-sans-kr", display: "swap" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-adm-mono", display: "swap" });

// 어드민은 검색에 막음 — 페이지마다 metadata 에도 같은 값 · Worker 가 X-Robots-Tag 도 붙임 (작업 0302)
export const metadata: Metadata = {
  title: SITE_NAME,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-surface="light" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-surface text-fg">
        {/* 본문 바로가기 — 평소엔 숨김 · 첫 Tab 에서 보이고 누르면 main 으로 (작업 0213) */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-pill focus:border-2 focus:border-cheap focus:bg-card focus:px-5 focus:py-2.5 focus:text-body focus:font-semibold focus:text-cheap"
        >
          본문 바로가기
        </a>
        {children}
      </body>
    </html>
  );
}

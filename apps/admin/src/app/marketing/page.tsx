import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Metadata } from "next";
import { MarketingPage } from "@/features/marketing/marketing-page";
import { type Draft, draftDays, imageSources, parseDraft } from "@/features/marketing/drafts/drafts";
import { ADMIN_URL, MARKETING_IMAGE_BASE, REPO_URL } from "@/shared/site";

// 알리기 (작업 0307) — 어드민 · 검색에 막음 · 소재 초안은 빌드 때 저장소 docs/marketing 에서 읽음(없으면 빈 상태)
export const metadata: Metadata = {
  title: "알리기 · Flapfx",
  description: "Meta 광고 소재 초안 — 날짜별 이미지 · 문구 · 쓴 숫자",
  alternates: { canonical: `${ADMIN_URL}/marketing` },
  robots: { index: false, follow: false },
};

/** 그림은 R2 공개 주소({날짜}.jpg)가 먼저 · 안 열리면 브라우저에서 공개 저장소 main 의 원본 파일 주소로 되돌림 (정적 내보내기에 그림을 싣지 않고 빌드가 바깥 주소에 기대지 않음 · 작업 0310) */
const RAW = REPO_URL.replace("https://github.com/", "https://raw.githubusercontent.com/") + "/main/docs/marketing/";

function repoRoot(): string | null {
  let d = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(d, ".agents"))) return d;
    d = dirname(d);
  }
  return null;
}

function readDrafts(): Draft[] {
  const root = repoRoot();
  if (!root) return [];
  const dir = join(root, "docs/marketing");
  try {
    return draftDays(readdirSync(dir)).flatMap((day) => {
      const md = join(dir, day, "문구.md");
      if (!existsSync(md)) return [];
      const { image, imageFallback } = imageSources(day, MARKETING_IMAGE_BASE, RAW, existsSync(join(dir, day, "image.png")));
      return [parseDraft(day, readFileSync(md, "utf8"), image, imageFallback)];
    });
  } catch {
    return [];
  }
}

export default function Page() {
  return <MarketingPage drafts={readDrafts()} />;
}

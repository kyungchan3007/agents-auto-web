// 구조화 자료 한 덩어리를 <script type="application/ld+json"> 로 (작업 0304) — 서버에서 그림 · 글 만들기는 seo.ts 의 jsonLdText
import { jsonLdText } from "./seo";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />;
}

// 구조화 자료 한 덩어리를 <script type="application/ld+json"> 로 (작업 0304) — 서버에서 그림 · "<" 는 이스케이프해 글이 태그를 닫지 못하게
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

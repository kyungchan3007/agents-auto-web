// wrangler 가 .html 을 글로 묶음 — 그 글을 가져오는 타입 (작업 0387)
declare module "*.html" {
  const html: string;
  export default html;
}

// owner 세션의 HTML 응답에만 <html data-viewer="owner"> 를 붙임 (작업 0403)
//   메뉴는 정적 HTML 에 여섯 개를 그리고 회사용이 아닌 항목은 CSS 가 html:not([data-viewer=owner]) 일 때 숨김 → 첫 그림부터 최종 모양(/session 을 기다리지 않음)
//   서버 막기(gate/owner-only.ts)는 따로 있어 이 표시는 화면 정리일 뿐
//   응답이 세션마다 다르므로 Vary: Cookie (브라우저가 다른 세션의 HTML 을 다시 쓰지 않게)
//   HTMLRewriter 는 Workers 전역 — 단위 테스트에서는 만드는 쪽을 주입

type Rewriter = {
  on(selector: string, handlers: { element(el: { setAttribute(name: string, value: string): void }): void }): Rewriter;
  transform(res: Response): Response;
};
export type RewriterFactory = () => Rewriter;

const workersRewriter = (): RewriterFactory | null => {
  const ctor = (globalThis as unknown as { HTMLRewriter?: new () => Rewriter }).HTMLRewriter;
  return ctor ? () => new ctor() : null;
};

const isHtml = (res: Response) => (res.headers.get("content-type") ?? "").includes("text/html");

/** 정적 파일 응답 — HTML 이면 Vary: Cookie · owner 이면 data-viewer 도 붙임 (HTMLRewriter 가 없으면 표시 없이 그대로) */
export function withViewer(res: Response, owner: boolean, make: RewriterFactory | null = workersRewriter()): Response {
  if (res.status !== 200 || !isHtml(res)) return res;
  const out = new Response(res.body, res);
  out.headers.append("vary", "Cookie");
  if (!owner || !make) return out;
  return make()
    .on("html", {
      element(el) {
        el.setAttribute("data-viewer", "owner");
      },
    })
    .transform(out);
}

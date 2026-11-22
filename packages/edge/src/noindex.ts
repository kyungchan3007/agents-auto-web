// 검색에 막기 — 어드민 주소 전체에 씀 (작업 0302 · 0312 에 Worker 공용으로)
export const NOINDEX = "noindex, nofollow";
/** robots.txt — 모든 봇에 전부 막음 */
export const DISALLOW_ALL_ROBOTS = "User-agent: *\nDisallow: /\n";

/** 응답에 검색 막음 머리글을 더한 새 응답 (원래 응답의 머리글은 바꿀 수 없을 수 있어 복사) */
export function withNoindex(res: Response): Response {
  const out = new Response(res.body, res);
  out.headers.set("X-Robots-Tag", NOINDEX);
  return out;
}

export function robotsDisallowAll(): Response {
  return new Response(DISALLOW_ALL_ROBOTS, { headers: { "content-type": "text/plain; charset=utf-8", "X-Robots-Tag": NOINDEX } });
}

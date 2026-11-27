// 점검 화면 응답 (작업 0387) — 모든 경로 · robots.txt 도 503 + 다시 오라는 시간 1시간 + 저장하지 않음 · 응답 만드는 부분만 순수 함수로 떼어 단위 테스트
export const RETRY_AFTER_SECONDS = 3600;

export function maintenanceResponse(html: string): Response {
  return new Response(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "retry-after": String(RETRY_AFTER_SECONDS),
      "cache-control": "no-store",
    },
  });
}

/** 주소 · 방법과 상관없이 같은 점검 응답 (/robots.txt · POST · HEAD · 조건부 헤더도 503) */
export function handle(_request: Request, html: string): Response {
  return maintenanceResponse(html);
}

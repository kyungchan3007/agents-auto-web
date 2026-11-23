// 소유 확인 태그 조립 (작업 0317) — Bing 은 늘 · 네이버는 값이 있을 때만 · 순수 함수
export function verificationOther(naver: string): Record<string, string> {
  const other: Record<string, string> = { "msvalidate.01": "80D88D51D528F03400697BF62BD604BF" };
  const value = naver.trim();
  if (value) other["naver-site-verification"] = value;
  return other;
}

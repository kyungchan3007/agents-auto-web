// 로고 끝 강조 글자 나누기 (작업 0216 · 0312 에 nav-bar.tsx 에서 옮김) · 순수 함수 — title 이 accent 로 끝날 때만 나눔
export function splitAccent(title: string, accent: string): { head: string; tail: string } {
  return accent && title.endsWith(accent) ? { head: title.slice(0, -accent.length), tail: accent } : { head: title, tail: "" };
}

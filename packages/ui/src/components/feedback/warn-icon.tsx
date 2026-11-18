// 경고 아이콘 — 경고 이모지 글자 대신 그림 (작업 0213) · 글자색(currentColor)을 따르고 글자 한 줄 높이에 맞춤 · 뜻은 옆 글이 전하므로 화면 읽기 도구는 건너뜀
export function WarnIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`inline-block size-[1.1em] shrink-0 align-[-0.2em] ${className}`}>
      <path d="M10 2.5 18.5 17h-17L10 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 8v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.4" r="0.95" fill="currentColor" />
    </svg>
  );
}

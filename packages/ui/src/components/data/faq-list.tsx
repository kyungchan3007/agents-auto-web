// 자주 묻는 질문 목록 — <details> · 처음 두 개 펼침(open) · 같은 문항이 구조화 자료(FAQPage)에도 들어감 (작업 0344 나라 페이지 · 0345 통화 상세가 같이 씀)
// href 가 있으면 답 아래 링크 (나라 페이지로 잇기 · 정적 사이트라 일반 링크) · 서버 부품 (브라우저 전용 훅 없음)
export type FaqListItem = { q: string; a: string; open: boolean; href?: string | null };

export function FaqList({ items, linkText = "자세히 보기" }: { items: FaqListItem[]; linkText?: string }) {
  return (
    <div className="mt-4 border-t border-line">
      {items.map((it) => (
        <details key={it.q} data-testid="faq-item" open={it.open} className="group border-b border-line py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.0625rem] font-bold text-fg [&::-webkit-details-marker]:hidden">
            {it.q}
            <span aria-hidden className="text-fg-2 group-open:hidden">+</span>
            <span aria-hidden className="hidden text-fg-2 group-open:inline">−</span>
          </summary>
          <p className="mt-2 text-small text-fg-2">{it.a}</p>
          {it.href && (
            <a data-testid="faq-link" href={it.href} className="tap-44 mt-2 inline-block text-small font-bold text-fg underline-offset-2 hover:underline">
              {linkText} ›
            </a>
          )}
        </details>
      ))}
    </div>
  );
}

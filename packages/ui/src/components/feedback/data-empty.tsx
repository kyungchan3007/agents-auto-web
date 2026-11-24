// 빈 상태 공통 부품 (작업 0346 · 시안 3-new) — 값을 못 받은 날 "자료 없음" 글자만 남지 않게: 흰 카드 · 이름표 · 제목 · 이유(다시 받는 시각) · "그동안 볼 수 있는 것" 링크 칩
// 글 · 링크는 부품이 정하지 않고 받은 것만 그림(쓰는 화면이 emptyCopy · checkedAtText 로 만들어 넘김) · 흰 카드라 파랑 면 위에 올려도 글자가 보임 · 훅 · 브라우저 전용 값 없음(서버에서 그려도 됨)
type Props = { checked: string; title: string; reason: string; links: { label: string; href: string }[]; linksTitle?: string };

export function DataEmpty({ checked, title, reason, links, linksTitle = "그동안 볼 수 있는 것" }: Props) {
  return (
    <section data-testid="data-empty" data-surface="light" className="rounded-[1.5rem] border border-line bg-card p-5 text-fg shadow-ticket sm:p-7">
      <p className="inline-block rounded-pill bg-surface-2 px-3 py-1 text-small font-bold text-fg-2">{checked}</p>
      <h2 className="mt-3 text-[1.25rem] leading-snug font-bold text-fg sm:text-[1.5rem]">{title}</h2>
      <p className="mt-2 text-body text-fg-2">{reason}</p>
      {links.length > 0 && (
        <>
          <h3 className="mt-5 text-small font-bold text-fg">{linksTitle}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <a href={l.href} className="tap-44 inline-flex items-center gap-1 rounded-pill border-2 border-line bg-card px-4 py-2 text-small font-bold text-fg hover:bg-surface-2">
                  {l.label}
                  <span aria-hidden>›</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

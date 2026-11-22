// 어드민 판 — 제목 줄(제목 · 링크 복사 · 오른쪽 메타) + 내용 (작업 0303)
//   찾기 창이 판 제목으로 찾음(data-cmd) · id 로 링크(#id)를 걸면 그 판으로 스크롤
import type { ReactNode } from "react";
import { PermaLink } from "./perma-link";

export function Panel({ id, title, meta, children, className = "", testId }: { id: string; title: string; meta?: ReactNode; children: ReactNode; className?: string; testId?: string }) {
  return (
    <section id={id} data-testid={testId} aria-labelledby={`${id}-t`} className={`adm-panel ${className}`} data-cmd="판" data-cmd-label={title}>
      <div className="adm-ph">
        <h2 id={`${id}-t`}>
          {title}
          <PermaLink id={id} title={title} />
        </h2>
        {meta}
      </div>
      {children}
    </section>
  );
}

export const Stamp = ({ children, live = false }: { children: ReactNode; live?: boolean }) => (
  <span className="adm-stamp">
    {live && <i className="adm-dot live" aria-hidden />}
    {children}
  </span>
);

// 저장소 원본 링크 (작업 0303 · 0312 에 how-page.tsx 에서 나눔) — 만드는 방식 판들이 같이 씀
import { srcHref } from "./how";

export const SrcLink = ({ path, label }: { path: string; label?: string }) => (
  <a className="adm-link src" href={srcHref(path)} target="_blank" rel="noreferrer">
    {label ?? path} ↗
  </a>
);

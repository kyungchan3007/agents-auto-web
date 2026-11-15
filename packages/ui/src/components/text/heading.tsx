// 작은 제목 · 큰 제목 — 페이지 머리에 반복되는 글자 모양 (작업 0168 새 테마)
//   큰 제목은 Gasoek One (포스터 글자 · 굵기 하나라 font-normal — 굵게 만들면 글꼴이 번져 보임) · 작은 제목은 바다 청록(accent) · 16px 보통 굵기 (Figma 라벨 · 작업 0170)
import type { HTMLAttributes, ReactNode } from "react";

export function Eyebrow({ className = "", children }: { className?: string; children: ReactNode }) {
  return <p className={`text-base font-normal text-accent ${className}`}>{children}</p>;
}

type TitleProps = HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "p"; size?: "section" | "poster" | "page" };

/** size: section(구간 제목 48) · poster(홈 첫 제목 96 · 모바일 약 48) · page(하위 화면 큰 제목 56 · 줄 간격 75) */
export function Title({ as: Tag = "h2", size = "section", className = "", ...rest }: TitleProps) {
  return <Tag className={`font-display font-normal tracking-tight ${size === "poster" ? "text-poster" : size === "page" ? "max-w-[42rem] text-page" : "text-title"} ${className}`} {...rest} />;
}

/** 구간 제목 · 카드 제목 · 단계 제목 · 역할 이름 — IBM Plex 굵게 700 (작업 0173 · 포스터 글씨 Gasoek 는 맨 위 큰 제목 · 큰 숫자 · 로고에만) · 크기 · 색은 부르는 쪽이 className 으로 */
export function SectionTitle({ as: Tag = "h2", className = "", ...rest }: HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" | "p" }) {
  return <Tag className={`font-sans font-bold tracking-tight ${className}`} {...rest} />;
}

/** 페이지 안 작은 구역 제목 */
export function SubTitle({ className = "", ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold tracking-tight ${className}`} {...rest} />;
}

"use client";

// 칩 아래 숫자 칸 (작업 0393) — 공통 숫자 칸(shared/facts)에 값을 넘겨 그림 · 값은 deck.facts(맨 앞 탑승권 도시를 따라가고 · 고르면 고른 곳)
import { FactsCard, type FactsIds } from "@/shared/facts/facts-card";
import { useHeroDeckValue } from "./use-hero-deck-context";

const IDS: FactsIds = { root: "hero-facts", title: "hero-facts-title", mine: "hero-facts-mine", rate: "hero-fact-rate", tenk: "hero-fact-tenk", price: "hero-fact-price", bar: "hero-fact-bar", position: "hero-fact-position", link: "hero-fact-link", none: "hero-fact-none" };

export function HeroPickFacts() {
  const { facts, link, mine } = useHeroDeckValue();
  if (!facts) return null;
  return <FactsCard facts={facts} ids={IDS} label="고른 곳 숫자" mine={mine} link={link ? { href: link.href, text: `${link.name} 물가 · 환율 자세히 보기 ›` } : null} className="hp-facts-place" />;
}

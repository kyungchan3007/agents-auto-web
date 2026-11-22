"use client";

// 일반 질문 표 상태 (작업 0303) — 걸러 보기(낱자 · 초성) · 정렬 · 줄이 미끄러져 자리를 찾음 · 찾기 창에서 고른 질문(adm-pick)
import { flashPanel, reduceMotion } from "@hav/ui/lib/admin-events";
import { match } from "@hav/ui/lib/match";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AnswerCount } from "../lib/rename-compare";

export type QuestionRow = { question: string; before: AnswerCount; after: AnswerCount };
export type QuestionSort = "base" | "name" | "long";

export function useQuestionTable(rows: QuestionRow[]) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<QuestionSort>("base");
  const [hit, setHit] = useState<string | null>(null);
  const body = useRef<HTMLTableSectionElement>(null);
  const list = useMemo(() => {
    const found = rows.map((r, i) => ({ r, i, m: match(r.question, q) })).filter((x) => x.m !== null);
    if (sort === "name") return [...found].sort((a, b) => a.r.question.localeCompare(b.r.question, "ko"));
    if (sort === "long") return [...found].sort((a, b) => (a.r.before.measured === 0 ? 1000 : 0) + a.i - ((b.r.before.measured === 0 ? 1000 : 0) + b.i));
    return found;
  }, [rows, q, sort]);

  // 줄 자리가 바뀌면 앞 자리 → 새 자리로 미끄러지게
  const prev = useRef<Map<string, DOMRect>>(new Map());
  useLayoutEffect(() => {
    const els = [...(body.current?.querySelectorAll<HTMLTableRowElement>("tr[data-q]") ?? [])];
    const now = new Map(els.map((e) => [e.dataset.q ?? "", e.getBoundingClientRect()]));
    if (prev.current.size > 0 && !reduceMotion()) {
      for (const e of els) {
        const a = prev.current.get(e.dataset.q ?? "");
        const b = now.get(e.dataset.q ?? "");
        if (!b || !e.animate) continue;
        if (!a) e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
        else if (a.top !== b.top) e.animate([{ transform: `translateY(${a.top - b.top}px)` }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    }
    prev.current = now;
  }, [list]);

  // 찾기 창에서 질문을 고르면 그 질문으로 걸러 보고 줄을 잠깐 강조
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    let t = 0;
    const onPick = (e: Event) => {
      const tr = (e.target as HTMLElement).closest("tr");
      const text = tr?.dataset.q;
      if (!text) return;
      e.preventDefault();
      setQ(text);
      setHit(text);
      flashPanel(tr);
      window.clearTimeout(t);
      t = window.setTimeout(() => setHit(null), 1600);
    };
    el.addEventListener("adm-pick", onPick);
    return () => {
      el.removeEventListener("adm-pick", onPick);
      window.clearTimeout(t);
    };
  }, []);

  return { q, setQ, sort, setSort, hit, list, body };
}

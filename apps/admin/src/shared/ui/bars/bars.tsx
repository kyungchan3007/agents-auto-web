"use client";

// 어드민 가로 막대 (작업 0303) — 이름 → 막대 → 숫자 · 첫 줄(가장 큰 값)만 파랑 · 화면에 들어올 때 왼쪽에서 채움
//   막대마다 같은 숫자를 글로 함께 둠(보이는 숫자) · 처음부터 끝까지 채운 모습이 기본(자바스크립트 없을 때 · 움직임 줄이기)
import { useEffect, useRef } from "react";
import { reduceMotion } from "../events/admin-events";

/** 막대 한 줄 — pct 는 가장 큰 값을 100 으로 · text 는 막대 옆 숫자 글 */
export type BarRow = { label: string; value: number; pct: number; text: string };

export function Bars({ rows, lead = true, testId = "bar-row" }: { rows: BarRow[]; lead?: boolean; testId?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || !("IntersectionObserver" in window)) return;
    el.classList.add("adm-pre");
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting) continue;
          requestAnimationFrame(() => el.classList.remove("adm-pre"));
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("adm-pre");
    };
  }, []);
  return (
    <ul ref={ref} className="adm-bars">
      {rows.map((r, i) => (
        <li key={r.label} data-testid={testId} data-value={r.value}>
          <span className="l" title={r.label}>
            {r.label}
          </span>
          <span className="adm-track" aria-hidden>
            <span className={`adm-fill${lead && i === 0 ? " lead" : ""}`} style={{ width: `${r.pct}%` }} />
          </span>
          <b className="n">{r.text}</b>
        </li>
      ))}
    </ul>
  );
}

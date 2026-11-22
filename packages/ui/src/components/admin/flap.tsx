"use client";

// 안내판 숫자 (작업 0303) — 숫자 글자가 몇 번 넘어간 뒤 제 값에서 멈춤(왼쪽부터 차례로) · 화면 읽기는 처음부터 최종 값 · 움직임 줄이기면 그대로
//   서버 HTML 에는 최종 값이 그대로 있음(검색 · 화면 읽기 · 자바스크립트 없을 때) · replay 가 바뀌면 다시 넘어감
import { useEffect, useRef } from "react";
import { reduceMotion } from "../../lib/admin-events";

const DIGITS = "0123456789";

export function Flap({ text, order = 0, replay = 0 }: { text: string; order?: number; replay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || reduceMotion()) return;
    const timers: number[] = [];
    [...root.querySelectorAll<HTMLElement>("i")].forEach((cell, k) => {
      const fin = cell.dataset.f ?? "";
      if (!/[0-9]/.test(fin)) return;
      const stop = 6 + k * 2 + order * 3;
      let t = 0;
      cell.classList.add("on");
      const id = window.setInterval(() => {
        t += 1;
        if (t >= stop) {
          window.clearInterval(id);
          cell.textContent = fin;
          cell.classList.remove("on");
          return;
        }
        cell.textContent = DIGITS[(Number(fin) + stop - t) % 10] ?? fin;
      }, 55);
      timers.push(id);
    });
    return () => {
      timers.forEach((id) => window.clearInterval(id));
      root.querySelectorAll<HTMLElement>("i").forEach((c) => {
        c.textContent = c.dataset.f ?? "";
        c.classList.remove("on");
      });
    };
  }, [text, order, replay]);
  return (
    <span ref={ref} className="adm-flap" aria-label={text} role="img">
      {[...text].map((c, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 글자 자리가 곧 키
        <i key={i} aria-hidden data-f={c} style={c === " " ? { width: "0.35em" } : { minWidth: /[0-9]/.test(c) ? "0.6em" : undefined }}>
          {c}
        </i>
      ))}
    </span>
  );
}

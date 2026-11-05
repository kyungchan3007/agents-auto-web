"use client";

// 환율 계산기 상태 — 어느 쪽 칸에 썼는지 · 입력 글자 (계산은 convert.ts · 작업 0086)
import type { FxRate } from "@hav/shared/fx";
import { type ChangeEvent, useState } from "react";
import { type Side, amountText, convert, convertRemit, parseInput, presets } from "./convert";

export function useConverter(rate: FxRate) {
  const [side, setSide] = useState<Side>("foreign");
  const [text, setText] = useState(String(presets("foreign", rate)[2]));
  const amount = parseInput(text);
  const result = amount == null ? null : convert(amount, side, rate);
  return {
    side,
    text,
    amount,
    other: (side === "won" ? "foreign" : "won") as Side,
    result,
    remit: amount == null ? null : convertRemit(amount, side, rate),
    invalid: text.trim() !== "" && amount == null,
    value: (s: Side) => (s === side ? text : result == null ? "" : amountText(result, s, rate)),
    edit: (s: Side) => (e: ChangeEvent<HTMLInputElement>) => {
      setSide(s);
      setText(e.target.value);
    },
    pick: (s: Side, n: number) => {
      setSide(s);
      setText(String(n));
    },
  };
}

"use client";

// 머리 맨 위 국기 라벨 줄 — 국기 + "이름 · 코드" (작업 0231) · 통화를 바꾸면 칩의 국기가 포물선으로 이 자리까지 날아와 앉음(그동안 이 자리 국기는 숨음) · 날아가는 국기(flag-fly)는 전환 중에만 DOM 에 있음
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import { Eyebrow } from "@hav/ui/text/heading";
import { createPortal } from "react-dom";
import { useFlagFly } from "./use-flag-fly";
import { useSwitchFrom } from "../../switch/use-switch-from";
import { FLAG_FLY_ID } from "../../switch/switch-motion";

export function CurrencyKicker({ code, label }: { code: string; label: string }) {
  const from = useSwitchFrom(code);
  const { flying, fly, target } = useFlagFly(code, from);
  return (
    <>
      <Eyebrow>
        <span className="inline-flex items-center gap-2">
          <span ref={target} className={`inline-flex ${flying ? "opacity-0" : "transition-opacity duration-200"}`}>
            <CurrencyFlag currency={code} className="h-4 w-6 shrink-0" />
          </span>
          <span>{label}</span>
        </span>
      </Eyebrow>
      {flying &&
        createPortal(
          <div ref={fly} data-testid={FLAG_FLY_ID} aria-hidden className="pointer-events-none fixed z-[60] origin-top-left overflow-hidden rounded-[0.25rem] opacity-0 shadow-ticket [&_svg]:block [&_svg]:size-full">
            <CurrencyFlag currency={code} className="h-full w-full" />
          </div>,
          document.body,
        )}
    </>
  );
}

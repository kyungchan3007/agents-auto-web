"use client";

// 머리 큰 환율 숫자 — 통화를 바꾸면 직전 값에서 새 값으로 카운트업 (작업 0231) · 처음 들어옴 · 새로 고침은 지금처럼 한 번 카운트업 · 지금 값은 전환 기억에 적어 둠
import { CountUp } from "@hav/ui/motion/count-up";
import { useSwitchFrom, useSwitchRecord } from "../../switch/use-switch-from";

export function BigRateNumber({ code, value, digits, suffix }: { code: string; value: number; digits: number; suffix: string }) {
  const from = useSwitchFrom(code);
  useSwitchRecord(code, { big: value });
  return <CountUp value={value} digits={digits} suffix={suffix} from={from?.big ?? null} delayMs={220} />;
}

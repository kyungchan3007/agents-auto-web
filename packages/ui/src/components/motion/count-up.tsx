"use client";

// 숫자 카운트업 — 화면에 들어올 때 한 번 최종 값 근처에서 시작해 약 1초 동안 최종 값으로 (작업 0216)
//   <CountUp value={1338.8} digits={1} suffix="원" /> — 쉼표 · 소수 자리 · 단위 그대로 · 글자 폭이 흔들리지 않게 tabular-nums
//   서버 첫 그림 · 움직임 줄이기는 바로 최종 값 · 숫자 글은 한 번만 — 보이는 값 하나(복사본 없음) · 서버 첫 그림이 최종 값이라 자바스크립트 없이 · 크롤러 · 화면 읽기가 최종 값을 읽음 (움직이는 1초 동안은 중간 값일 수 있음)
import { useCountUp } from "../../hooks/use-count-up";
import { formatCount } from "../../lib/count-up";

type Props = { value: number; digits?: number; prefix?: string; suffix?: string; className?: string };

export function CountUp({ value, digits = 0, prefix = "", suffix = "", className = "" }: Props) {
  const { ref, value: shown } = useCountUp<HTMLSpanElement>(value, { digits });
  const final = `${prefix}${formatCount(value, digits)}${suffix}`;
  return (
    <span ref={ref} data-testid="count-up" data-final={final} className={`tabular-nums ${className}`}>
      {`${prefix}${formatCount(shown, digits)}${suffix}`}
    </span>
  );
}

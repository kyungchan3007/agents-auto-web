"use client";

// 굴러가는 숫자 — 값이 바뀌면 자리마다 0~9 띠가 위(커짐) · 아래(작아짐)로 굴러 멈춤 (작업 0227 · 모션 4번)
//   <RollingNumber value={242136} suffix="원" slot="big" /> — 쉼표 · 앞 기호 · 단위는 굴러가지 않음 · 오른쪽 자리부터 조금씩 늦게 출발
//   처음 값은 그대로 보임(서버 첫 그림도 최종 값) · 움직이는 중 새 값이 오면 지금 보이는 위치에서 이어 감(되감기 없음)
//   움직임 줄이기면 굴리지 않고 바로 최종 값 · 화면 읽기에는 최종 값 한 번(roll-sr) · 나머지는 aria-hidden
//   굴러가는 칸(data-moving)만 위아래 가장자리가 흐려짐 — 색 그라데이션이 아니라 가리개(mask) · 시안 .rc.moving 과 같음
//   띠 움직임은 웹 애니메이션(.animate) — 타이머로 숫자를 바꾸지 않음 · 다른 곳(통화 글자판 등)에서도 쓰도록 className 으로 크기 · 색만 받음
//   from(작업 0231): 처음 그릴 때 그 값에서 굴러 시작(통화를 바꿀 때 직전 글자판 값에서) · startDelay: 굴러가기 시작을 늦춤(ms)
//   board(작업 0231): 글자판형 — 칸마다 판 칸 모양(칸 · 줄 높이 · 글자 모양은 쓰는 쪽이 class 로 정함) · 앞은 빈 칸으로 cols 칸에 맞춤 · 쉼표 · 단위도 칸 · 칸 안에서 굴러감(이음선 위)
import { type DigitArgs, useRollingDigit, useRollingRoot } from "../../hooks/motion/use-rolling-number";
import { padCols, rollCells, rollFrom, rollRows, rollText, rollValue } from "../../lib/motion/rolling-number";

type Board = { cols: number; /** 칸 모양(크기 · 바탕 · 글자 · 글꼴) */ cell: string; /** 띠 한 줄 높이(칸 높이와 같게) */ row: string };
type Props = { value: number; suffix?: string; prefix?: string; slot?: string; className?: string; from?: number | null; startDelay?: number; board?: Board };

type DigitProps = DigitArgs & { board?: Board };

function Digit({ digit, place, value, mounted, onMove, fromDigit, fromDir, startDelay, board }: DigitProps) {
  const { cellRef, stripRef, startShift } = useRollingDigit({ digit, place, value, mounted, onMove, fromDigit, fromDir, startDelay });
  const rows = rollRows();
  const mask = "data-[moving=true]:[mask-image:linear-gradient(transparent,#000_22%,#000_78%,transparent)]";
  if (board)
    return (
      <span ref={cellRef} data-testid="roll-cell" data-kind="digit" data-digit={digit} className={`relative isolate inline-block flex-none overflow-hidden ${board.cell} ${mask}`}>
        <span ref={stripRef} data-testid="roll-strip" className="absolute inset-x-0 top-0 flex flex-col will-change-transform" style={{ transform: startShift }}>
          {rows.map((d, k) => (
            <span key={k} className={`flex items-center justify-center ${board.row}`}>
              {d}
            </span>
          ))}
        </span>
        <span aria-hidden className="absolute inset-x-0 top-1/2 -z-10 h-px bg-on-band" />
      </span>
    );
  return (
    <span ref={cellRef} data-testid="roll-cell" data-kind="digit" data-digit={digit} className={`relative inline-block h-[1.18em] w-[1ch] flex-none overflow-hidden ${mask}`}>
      <span ref={stripRef} data-testid="roll-strip" className="flex flex-col will-change-transform" style={{ transform: startShift }}>
        {rows.map((d, k) => (
          <span key={k} className="block h-[1.18em] text-center leading-[1.18em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollingNumber({ value, suffix = "", prefix = "", slot, className = "", from = null, startDelay = 0, board }: Props) {
  const rounded = rollValue(value);
  const { rootRef, mounted, onMove } = useRollingRoot();
  const cells = rollCells(rounded);
  const final = rollText(rounded, suffix, prefix);
  // 이전 값 — 자리마다 이전 숫자(없던 자리는 0) · 같은 값이면 쓰지 않음 (rollFrom)
  const prev = rollFrom(rounded, from);
  const digit = (c: (typeof cells)[number]) => (
    <Digit key={`d${c.place}`} digit={c.digit ?? 0} place={c.place ?? 0} value={rounded} mounted={mounted} onMove={onMove} fromDigit={prev.digitAt(c.place ?? 0)} fromDir={prev.dir} startDelay={startDelay} board={board} />
  );
  if (board) {
    const tile = "relative isolate flex flex-none items-center justify-center";
    return (
      <span ref={rootRef} data-testid="rolling-number" data-slot={slot} data-value={rounded} data-final={final} data-state="idle" className={className}>
        {Array.from({ length: padCols(board.cols, cells.length, !!suffix) }, (_, i) => (
          <span key={`p${i}`} aria-hidden className={`${tile} ${board.cell}`}>
            <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-on-band" />
          </span>
        ))}
        {cells.map((c, i) =>
          c.kind === "comma" ? (
            <span key={`c${cells[i + 1]?.place}`} aria-hidden data-testid="roll-cell" data-kind="comma" className={`${tile} ${board.cell}`}>
              ,
              <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-on-band" />
            </span>
          ) : (
            digit(c)
          ),
        )}
        {suffix && (
          <span data-testid="roll-suffix" aria-hidden="true" className={`${tile} ${board.cell}`}>
            {suffix}
            <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-on-band" />
          </span>
        )}
        <span data-testid="roll-sr" className="sr-only">
          {final}
        </span>
      </span>
    );
  }
  return (
    <span ref={rootRef} data-testid="rolling-number" data-slot={slot} data-value={rounded} data-final={final} data-state="idle" className={`inline-flex items-center whitespace-nowrap tabular-nums ${className}`}>
      {prefix && (
        <span data-testid="roll-prefix" aria-hidden="true" className="leading-[1.18em]">
          {prefix}
        </span>
      )}
      <span aria-hidden="true" className="inline-flex items-center">
        {cells.map((c, i) =>
          c.kind === "comma" ? (
            <span key={`c${cells[i + 1]?.place}`} data-testid="roll-cell" data-kind="comma" className="inline-block h-[1.18em] flex-none text-center leading-[1.18em]">
              ,
            </span>
          ) : (
            digit(c)
          ),
        )}
      </span>
      {suffix && (
        <span data-testid="roll-suffix" aria-hidden="true" className="leading-[1.18em]">
          {suffix}
        </span>
      )}
      <span data-testid="roll-sr" className="sr-only">
        {final}
      </span>
    </span>
  );
}

// 오늘 발견된 버그 · 보안 — 찾아서 고쳐 머지한 것만 셈 (작업 0122)
import { CountUp } from "@hav/ui/count-up";
import type { todayPatchCounts } from "@hav/shared/tasks";

export function TodayPatches({ counts }: { counts: ReturnType<typeof todayPatchCounts> }) {
  return (
    <section data-surface="elevated" aria-labelledby="today-patch-title" className="bg-surface px-4 py-24 text-fg sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 id="today-patch-title" className="text-title font-semibold tracking-tight">
          오늘 발견된 버그와 보안.
        </h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          <Stat value={counts.bug} label="오늘 발견된 버그" />
          <Stat value={counts.security} label="오늘 발견된 보안 문제" />
        </div>
        <p className="mt-8 text-sm text-fg-2">찾아서 고쳐 머지한 것만 셉니다. 무엇을 고쳤는지는 위 패치 내역에 있습니다.</p>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-hero font-bold tracking-tighter">
        <CountUp text={String(value)} className="text-aurora" />
      </p>
      <p className="mt-2 text-lead text-fg-2">{label}</p>
    </div>
  );
}


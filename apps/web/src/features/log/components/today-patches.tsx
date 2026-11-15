// 오늘 발견된 버그 · 보안 — 찾아서 고쳐 머지한 것만 셈 (작업 0122)
import type { todayPatchCounts } from "@hav/shared/tasks";
import { Title } from "@hav/ui/text/heading";

export function TodayPatches({ counts }: { counts: ReturnType<typeof todayPatchCounts> }) {
  return (
    <section aria-labelledby="today-patch-title" className="bg-surface px-4 py-16 text-fg sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Title id="today-patch-title">
          오늘 발견된 버그와 보안.
        </Title>
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
      <p className="font-display text-hero font-normal tracking-tighter tabular-nums">
        <span className="text-figure">{value}</span>
      </p>
      <p className="mt-2 text-lead text-fg-2">{label}</p>
    </div>
  );
}


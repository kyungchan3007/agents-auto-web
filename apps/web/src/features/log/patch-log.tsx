// 패치 내역 — 매일 보안 점검(security-audit.yml)에서 나와 고쳐 머지한 것 (작업 0113) · 원본은 머지된 PR 제목
import { type PatchKind, type TasksSummary, patchesOf } from "@hav/shared/tasks";
import type { Fetched } from "../../shared/api";

const SHOWN = 10;
const KIND: Record<PatchKind, { label: string; tone: string }> = {
  security: { label: "보안", tone: "text-expensive" },
  bug: { label: "버그", tone: "text-cheap" },
};
const day = (iso: string) => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(iso));

export function PatchLog({ tasks }: { tasks: Fetched<TasksSummary> }) {
  const patches = tasks.ok ? patchesOf(tasks.data.done) : [];
  return (
    <section data-surface="dark" aria-labelledby="patch-title" className="bg-surface px-4 pt-4 text-fg sm:px-8">
      <div className="mx-auto max-w-3xl rounded-card bg-surface-2 p-5 ring-1 ring-line sm:p-6">
        <p id="patch-title" className="text-xs font-semibold text-fg-2">
          패치 내역
        </p>
        <p className="mt-2 text-sm text-fg-2">매일 보안 취약점을 점검합니다. 고칠 것이 없는 날은 기록이 남지 않습니다.</p>
        {!tasks.ok ? (
          <p className="mt-4 text-sm text-fg-2">내역을 받지 못했습니다 ({tasks.reason})</p>
        ) : patches.length === 0 ? (
          <p className="mt-4 text-sm text-fg-2">아직 패치한 것이 없습니다.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line text-sm">
            {patches.slice(0, SHOWN).map((p) => (
              <li key={p.number} className="flex items-baseline gap-3 py-2.5">
                <span className={`shrink-0 text-xs font-semibold ${KIND[p.kind].tone}`}>{KIND[p.kind].label}</span>
                <a href={p.url} className="min-w-0 flex-1 text-fg hover:underline">
                  {p.summary}
                </a>
                <span className="shrink-0 text-xs text-fg-2">{day(p.mergedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

"use client";

// 이름 바꾼 날 전후 비교 (작업 0205 · #243) — /geo 맨 위 구간: 봇 방문 · AI 서비스 유입 · AI 답변 · 검색 노출을 기준일(2026-11-17) 앞뒤로
// 하루 평균 = 합계 ÷ 그 기간의 달력 날짜 수 (방문 없는 날 포함) · 막대에는 같은 숫자를 글(aria-label)로 · 자료가 없는 칸은 "아직 없음"
import { numberText } from "@hav/shared/format";
import type { GeoReport } from "@hav/shared/geo";
import { DataTable } from "@hav/ui/data/data-table";
import type { ReactNode } from "react";
import { useRenameCompare } from "../hooks/use-rename-compare";
import { type AnswerCount, type BrandSummary, type DayHits, type Period, perDayText } from "../lib/rename-compare";

const NONE = "아직 없음";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-small font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const periodText = (p: Period | null) => (p ? `하루 ${perDayText(p.perDay)}회 (합계 ${numberText(p.total)}회)` : "기록 없음");
const answerText = (c: AnswerCount) => (c.measured === 0 ? "측정 전" : `찾음 ${c.found} · 인용 ${c.cited} / ${c.measured}회`);

/** 날짜별 작은 막대 — 기준일 위치에 세로선 · 같은 숫자를 aria-label 글로 */
function DayBars({ name, daily, dayMark }: { name: string; daily: DayHits[]; dayMark: string }) {
  const n = daily.length;
  if (n === 0) return <span className="text-fg-2">{NONE}</span>;
  const max = Math.max(1, ...daily.map((d) => d.hits));
  const w = 100 / n;
  const at = daily.findIndex((d) => d.day === dayMark);
  const label = `${name} 날짜별 방문: ${daily.map((d) => `${d.day.slice(5)} ${d.hits}회`).join(", ")}${at >= 0 ? ` (${dayMark} 이름 바꾼 날)` : ""}`;
  return (
    <svg role="img" aria-label={label} data-testid="rename-bars" viewBox="0 0 100 30" preserveAspectRatio="none" className="block h-8 w-40">
      <line x1="0" x2="100" y1="29.5" y2="29.5" stroke="var(--hav-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {daily.map((d, i) => (
        <rect key={d.day} x={i * w + w * 0.1} width={w * 0.8} y={29 - (d.hits / max) * 27} height={(d.hits / max) * 27} fill="var(--hav-cheap)" />
      ))}
      {at >= 0 && <line x1={at * w} x2={at * w} y1="0" y2="30" stroke="var(--hav-fg-2)" strokeWidth={1.5} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

export function RenameCompare({ report, asOf }: { report: GeoReport; asOf: string }) {
  const c = useRenameCompare(report, asOf);
  const before = `바꾸기 전 ${c.beforeDays}일`;
  const after = `바꾼 뒤 ${c.afterDays}일`;
  return (
    <section data-testid="rename-compare" aria-labelledby="rename-compare-title" className="mb-6 rounded-card bg-foam px-6 pt-[22px] pb-[25px]">
      <h2 id="rename-compare-title" className="text-lg font-semibold">
        이름 바꾼 날 전후 비교
      </h2>
      <p data-testid="rename-day" className="mt-1 text-body text-fg-2">
        이름 바꾼 날 {c.day} (Tripfx → Flapfx · tripfx.pages.dev → flapfx.com) · 하루 평균은 방문 없는 날을 포함한 달력 날짜 수로 나눕니다 ({before} · {after}).
      </p>
      <p data-testid="rename-asof" className="mt-1 text-small text-fg-2">
        자료 기준일 {c.asOf} · 바꾸기 전 = {c.beforeRange ?? "기록 없음"} (응답에 남은 첫 기록일부터) · 바꾼 뒤 = {c.day} ~ {c.asOf}
      </p>
      {c.beforeShort && (
        <p data-testid="rename-before-short" className="mt-1 text-small text-fg-2">
          전 기간이 {c.beforeDays}일로 짧아 비교는 참고용입니다.
        </p>
      )}
      {c.short && (
        <p data-testid="rename-short" className="mt-1 text-small text-fg-2">
          후 기간이 {c.afterDays}일로 짧아 비교는 참고용입니다.
        </p>
      )}

      <Block title="봇 방문 (하루 평균)">
        {c.bots && c.bots.length > 0 ? (
          <DataTable
            head={["봇 (막대: 날짜별 · 점선 = 이름 바꾼 날)", before, after]}
            rows={c.bots.map((b) => [
              <div key={b.name} className="space-y-1.5">
                <div>{b.name}</div>
                <DayBars name={b.name} daily={b.daily} dayMark={c.day} />
              </div>,
              periodText(b.before),
              periodText(b.after),
            ])}
            caption="일반 검색 엔진 · AI 봇 모두 · 운영 확인 방문 제외"
          />
        ) : (
          <p className="text-small text-fg-2">{NONE}</p>
        )}
      </Block>

      <Block title="AI 서비스 유입">
        {c.referrals && c.referrals.rows.length > 0 ? (
          <DataTable
            head={["서비스", before, after]}
            rows={[...c.referrals.rows.map((x) => [x.name, periodText(x.before), periodText(x.after)]), ["합계", periodText(c.referrals.sum.before), periodText(c.referrals.sum.after)]]}
          />
        ) : (
          <p className="text-small text-fg-2">{NONE}</p>
        )}
      </Block>

      <Block title="AI 답변 — 일반 질문은 같은 질문끼리 이어서">
        {c.answers && c.answers.general.length > 0 ? (
          <DataTable
            head={["질문", "바꾸기 전", "바꾼 뒤"]}
            rows={c.answers.general.map((g) => [g.question, answerText(g.before), answerText(g.after)])}
            caption="찾음 = 검색 결과에 나옴 · 인용 = 답의 출처에 나옴 · 응답을 받은 측정 횟수 기준"
          />
        ) : (
          <p className="text-small text-fg-2">{NONE}</p>
        )}
        <ul data-testid="rename-brand" className="mt-3 list-disc space-y-1 pl-5 text-small text-fg-2">
          <li>Tripfx 시기(1 · 2판): {brandText(c.answers?.brand.tripfx ?? null)}</li>
          <li>Flapfx 시기(3판): {brandText(c.answers?.brand.flapfx ?? null)}</li>
          <li>브랜드 질문은 이름이 달라 이어 비교하지 않고 시기별로 따로 봅니다.</li>
        </ul>
      </Block>

      <Block title="검색 노출 (Search Console)">
        <ul data-testid="rename-search" className="list-disc space-y-1 pl-5 text-small text-fg-2">
          <li>옛 속성(tripfx.pages.dev): {c.search.old ? `노출 ${numberText(c.search.old.impressions)}회 · 클릭 ${numberText(c.search.old.clicks)}회 (${c.search.old.range})` : NONE}</li>
          <li>새 속성(flapfx.com): 아직 없음 (Search Console 새 속성 등록 대기 #214)</li>
        </ul>
      </Block>
    </section>
  );
}

function brandText(b: BrandSummary | null): string {
  if (!b) return "측정 전";
  return `${b.days}일 측정 (${b.first} ~ ${b.last}) · ${answerText(b)}`;
}

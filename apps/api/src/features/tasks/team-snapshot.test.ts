// 작업 0341 — 작업실 "오늘 팀이 한 일 · 자동 검사" 자료 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구: 오늘 할 일 이슈의 체크 항목(끝남 · 남음 · 굵은 머리만) · 최근 검사 실행 요약(통과 · 실패 · 가운데 값 · 최근 한 번 · 실패 줄 최대 3) · 저장 SQL 이스케이프 · 응답에 두 값
//
// builder 가 만들 것 — apps/api/src/features/tasks/team-snapshot.ts (의존성 없이 · node --experimental-strip-types 로 돎)
//   export type TodayItem = { done: boolean; head: string }
//   export function parseTodayItems(body: string): TodayItem[]        // "- [ ]" · "- [x]" 줄 중 굵은 머리("**머리:**" · "**머리**")가 있는 것만 · 머리 끝의 ":" 뗌 · 최대 30개 · 머리 최대 80자
//   export function pickTodayIssue(items: unknown[]): { number: number; title: string; url: string; body: string } | null
//       // 주인(author_association OWNER)이 연 이슈(PR 아님) 중 제목이 "오늘 할 일 " 로 시작하는 것 · 번호가 가장 큰 것 · url 모양이 이상하면 버림
//   export function summarizeRuns(runs: unknown[], prByBranch?: Record<string, { number: number; url: string }>): GateRuns | null
//       // status "completed" 이고 conclusion 이 success · failure 인 것만 (취소 · 건너뜀 제외) · 최근 20번 · 입력은 최근부터
//       // GateRuns = { total, pass, fail, medianSec, latestSec, failed: { branch, runUrl, prNumber, prUrl }[] }  (failed 최대 3 · 모양은 packages/shared tasks 의 GateRuns)
//   export function snapshotSql(entries: { key: "today-issue" | "gate-runs"; value: unknown }[], syncedAt: string): string
//       // value 가 null 이면 그 key 줄 지움 · 아니면 INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) · body 는 JSON · 작은따옴표 두 번
// apps/api/src/features/tasks/summary.ts — summarize(rows, snagRows, snapshots) 의 세 번째 인자: { key: string; body: string; syncedAt: string }[] → 응답에 today · gate (없거나 깨졌으면 null)
// packages/shared/src/contracts/tasks.ts — TodayIssue · GateRuns 계약 · TasksSummary 에 today · gate (기본 null)
import { GateRuns, TasksSummary, TodayIssue } from "@hav/shared/tasks";
import { describe, expect, it } from "vitest";
import { summarize } from "./summary";
import { parseTodayItems, pickTodayIssue, snapshotSql, summarizeRuns } from "./team-snapshot";

const U = "https://github.com/kyungchan3007/agents-auto-web";

// 실제 오늘 할 일 이슈 #395 본문 모양 (2026-11-24 gh issue view)
const BODY = `## 오늘 할 일

- [ ] **오늘 환율 수집 확인:** 화요일 12:00 회차가 들어왔는지, 공식 값 개수와 받은 날짜를 확인하고 데이터 점검 기록을 남깁니다.
- [x] **새벽 예약 수집 확인:** 검색 노출(04:20) · 인스타 유입(04:40) · GA4 유입(04:50) 수집이 오늘 돌았는지 확인합니다.
- [X] **검색 안 되는 이유 조사(#157):** 11-24 조사 댓글을 남깁니다.
- [ ] **하루 마무리** 운영 화면이 바뀌었으면 버전을 올립니다.
- [ ] 굵은 머리가 없는 줄은 뺍니다.

## 지금 상태

- 체크 상자가 아닌 불릿은 뺍니다.
- [ ] 이 아래 칸도 굵은 머리가 없으면 뺍니다.
`;

describe("오늘 할 일 이슈 본문 → 체크 항목 (요구 1)", () => {
  it("'- [ ]' 는 남음 · '- [x]' · '- [X]' 는 끝남 · 굵은 머리만 · 머리 끝의 ':' 는 뗌 · 순서 그대로", () => {
    expect(parseTodayItems(BODY)).toEqual([
      { done: false, head: "오늘 환율 수집 확인" },
      { done: true, head: "새벽 예약 수집 확인" },
      { done: true, head: "검색 안 되는 이유 조사(#157)" },
      { done: false, head: "하루 마무리" },
    ]);
  });

  it("본문이 비었거나 체크 항목이 없으면 빈 목록 (지어내지 않음)", () => {
    expect(parseTodayItems("")).toEqual([]);
    expect(parseTodayItems("## 오늘 할 일\n\n- 그냥 불릿\n")).toEqual([]);
  });

  it("남이 쓸 수 있는 글: 항목은 30개까지 · 머리는 80자까지 · 줄바꿈 · 제어 문자는 공백", () => {
    const many = Array.from({ length: 40 }, (_, i) => `- [ ] **항목 ${i}:** 설명`).join("\n");
    expect(parseTodayItems(many)).toHaveLength(30);
    const long = parseTodayItems(`- [ ] **${"가".repeat(200)}:** 설명`)[0];
    expect(long.head).toHaveLength(80);
    expect(parseTodayItems("- [ ] **a\u0007b:** x")[0].head).toBe("a b");
  });

  it("가장 최근 '오늘 할 일 ' 이슈 — 주인이 연 이슈 · 번호가 가장 큰 것 · PR · 남이 연 이슈 · 이상한 주소는 버림", () => {
    const issues = [
      { number: 380, title: "오늘 할 일 2026-11-23 (월)", html_url: `${U}/issues/380`, author_association: "OWNER", body: "- [x] **어제:** a" },
      { number: 395, title: "오늘 할 일 2026-11-24 (화)", html_url: `${U}/issues/395`, author_association: "OWNER", body: BODY },
      { number: 399, title: "오늘 할 일 가짜", html_url: `${U}/issues/399`, author_association: "NONE", body: "- [x] **남이 연 것:** a" },
      { number: 400, title: "오늘 할 일 PR 이름", html_url: `${U}/pull/400`, author_association: "OWNER", pull_request: { merged_at: null }, body: "x" },
      { number: 401, title: "오늘 할 일 주소 이상", html_url: "https://evil.example/x", author_association: "OWNER", body: "x" },
      { number: 396, title: "다른 이슈", html_url: `${U}/issues/396`, author_association: "OWNER", body: "x" },
    ];
    expect(pickTodayIssue(issues)).toEqual({ number: 395, title: "오늘 할 일 2026-11-24 (화)", url: `${U}/issues/395`, body: BODY });
  });

  it("오늘 할 일 이슈가 하나도 없으면 null", () => {
    expect(pickTodayIssue([])).toBeNull();
    expect(pickTodayIssue([{ number: 1, title: "다른 이슈", html_url: `${U}/issues/1`, author_association: "OWNER", body: "" }])).toBeNull();
  });
});

// 실제 checks.yml 실행 목록 모양 (2026-11-24 gh api · 최근부터)
const run = (o: { c: string; s?: string; start: string; end: string; branch: string; pr?: number; id?: number }) => ({
  id: o.id ?? 1,
  status: o.s ?? "completed",
  conclusion: o.c,
  run_started_at: o.start,
  updated_at: o.end,
  head_branch: o.branch,
  html_url: `${U}/actions/runs/${o.id ?? 1}`,
  pull_requests: o.pr ? [{ number: o.pr }] : [],
});

describe("검사 실행 → 요약 (요구 2)", () => {
  it("통과 · 실패 수 · 걸린 시간 가운데 값(짝수면 두 값의 평균) · 최근 한 번", () => {
    const runs = [
      run({ c: "success", start: "2026-11-24T03:06:34Z", end: "2026-11-24T03:08:12Z", branch: "main" }), // 98초 (최근)
      run({ c: "success", start: "2026-11-24T03:05:41Z", end: "2026-11-24T03:07:39Z", branch: "task/0337" }), // 118초
      run({ c: "failure", start: "2026-11-24T03:03:18Z", end: "2026-11-24T03:05:59Z", branch: "task/0340", id: 7 }), // 161초
      run({ c: "success", start: "2026-11-24T03:03:13Z", end: "2026-11-24T03:05:09Z", branch: "main" }), // 116초
    ];
    const g = summarizeRuns(runs)!;
    expect(g).toMatchObject({ total: 4, pass: 3, fail: 1, latestSec: 98, medianSec: 117 }); // 정렬 98 · 116 · 118 · 161 → (116+118)/2
    expect(GateRuns.parse(g)).toEqual(g); // 계약 모양
  });

  it("취소 · 건너뜀 · 아직 도는 실행은 세지 않음 · 최근 20번까지만", () => {
    const base = { start: "2026-11-24T03:00:00Z", end: "2026-11-24T03:02:00Z", branch: "main" };
    const runs = [
      run({ ...base, c: "cancelled" }),
      run({ ...base, c: "skipped" }),
      run({ ...base, c: "", s: "in_progress" }),
      ...Array.from({ length: 25 }, () => run({ ...base, c: "success" })),
    ];
    const g = summarizeRuns(runs)!;
    expect(g.total).toBe(20);
    expect(g.pass).toBe(20);
    expect(g.fail).toBe(0);
    expect(g.failed).toEqual([]);
  });

  it("실패 줄은 최대 3개 · 최근부터 · 브랜치 + 실행 링크 · PR 번호가 실행에 있으면 PR 링크도", () => {
    const f = (id: number, branch: string, pr?: number) => run({ id, c: "failure", start: "2026-11-24T03:00:00Z", end: "2026-11-24T03:02:00Z", branch, pr });
    const g = summarizeRuns([f(11, "task/a", 5), f(12, "task/b"), f(13, "task/c"), f(14, "task/d")])!;
    expect(g.fail).toBe(4);
    expect(g.failed).toEqual([
      { branch: "task/a", runUrl: `${U}/actions/runs/11`, prNumber: 5, prUrl: `${U}/pull/5` },
      { branch: "task/b", runUrl: `${U}/actions/runs/12`, prNumber: null, prUrl: null },
      { branch: "task/c", runUrl: `${U}/actions/runs/13`, prNumber: null, prUrl: null },
    ]);
  });

  it("실행에 PR 번호가 비어 있으면 브랜치로 찾은 PR 을 씀 (두 번째 인자)", () => {
    const r = run({ id: 21, c: "failure", start: "2026-11-24T03:00:00Z", end: "2026-11-24T03:02:00Z", branch: "task/0331-readme-refresh" });
    const g = summarizeRuns([r], { "task/0331-readme-refresh": { number: 381, url: `${U}/pull/381` } })!;
    expect(g.failed[0]).toMatchObject({ prNumber: 381, prUrl: `${U}/pull/381` });
  });

  it("실행 링크 모양이 이상하면 그 실패 줄은 버림 (남이 쓴 글이 링크가 되지 않게)", () => {
    const bad = { ...run({ c: "failure", start: "2026-11-24T03:00:00Z", end: "2026-11-24T03:02:00Z", branch: "x" }), html_url: "javascript:alert(1)" };
    const g = summarizeRuns([bad])!;
    expect(g.fail).toBe(1);
    expect(g.failed).toEqual([]);
  });

  it("끝난 실행이 하나도 없으면 null (자료 없음) · 시각이 깨진 실행은 시간 계산에서만 뺌", () => {
    expect(summarizeRuns([])).toBeNull();
    expect(summarizeRuns([run({ c: "cancelled", start: "2026-11-24T03:00:00Z", end: "2026-11-24T03:02:00Z", branch: "main" })])).toBeNull();
    const g = summarizeRuns([run({ c: "success", start: "나쁜 값", end: "2026-11-24T03:02:00Z", branch: "main" })])!;
    expect(g).toMatchObject({ total: 1, pass: 1, medianSec: null, latestSec: null });
  });
});

describe("저장 SQL (요구 3) — 이슈 본문은 남이 쓸 수 있는 글", () => {
  const AT = "2026-11-24T03:30:00.000Z";

  it("key 마다 INSERT OR REPLACE · body 는 JSON · synced_at", () => {
    const sql = snapshotSql([{ key: "gate-runs", value: { total: 1 } }], AT);
    expect(sql).toContain("INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('gate-runs', '{\"total\":1}', '2026-11-24T03:30:00.000Z');");
  });

  it("작은따옴표는 두 번 — 본문에 SQL 을 끼워도 한 문장 안의 글일 뿐", () => {
    const evil = "x'); DROP TABLE github_items; --";
    const sql = snapshotSql([{ key: "today-issue", value: { items: [{ done: false, head: evil }] } }], AT);
    expect(sql).toContain("x''); DROP TABLE github_items; --");
    // 따옴표를 두 번 쓴 뒤에는 홀로 남은 작은따옴표가 없음 — 글 안의 '' 를 지우면 짝이 맞음
    const stripped = sql.replace(/''/g, "");
    expect((stripped.match(/'/g) ?? []).length % 2).toBe(0);
    expect(sql.split("\n").filter((l) => l.trim()).every((l) => /^(INSERT OR REPLACE INTO team_snapshots|DELETE FROM team_snapshots)/.test(l))).toBe(true);
  });

  it("줄바꿈이 든 글도 한 줄 SQL 로 (JSON 이 줄바꿈을 \\n 으로 씀)", () => {
    const sql = snapshotSql([{ key: "today-issue", value: { items: [{ done: false, head: "a\nb" }] } }], AT);
    expect(sql.trim().split("\n")).toHaveLength(1);
  });

  it("값이 null 이면 그 key 줄을 지움 (받지 못한 자료를 옛 값으로 두지 않음)", () => {
    const sql = snapshotSql([{ key: "today-issue", value: null }, { key: "gate-runs", value: { total: 2 } }], AT);
    expect(sql).toContain("DELETE FROM team_snapshots WHERE key = 'today-issue';");
    expect(sql).toContain("'gate-runs'");
  });
});

describe("GET /tasks 응답에 두 값 (요구 4의 자료 쪽)", () => {
  const at = "2026-11-24T03:30:00.000Z";
  const today = { number: 395, title: "오늘 할 일 2026-11-24 (화)", url: `${U}/issues/395`, items: [{ done: true, head: "GEO 측정" }, { done: false, head: "하루 마무리" }] };
  const gate = { total: 20, pass: 20, fail: 0, medianSec: 113.5, latestSec: 98, failed: [] };

  it("저장된 두 key 를 today · gate 로 · 지난 작업 · 작업 이름은 그대로", () => {
    const rows = [{ number: 51, kind: "pr" as const, task: "0050", name: "만드는 중", url: `${U}/pull/51`, mergedAt: "2026-10-28T14:30:30.000Z", syncedAt: at }];
    const s = TasksSummary.parse(
      summarize(rows, [], [
        { key: "today-issue", body: JSON.stringify(today), syncedAt: at },
        { key: "gate-runs", body: JSON.stringify(gate), syncedAt: at },
      ]),
    );
    expect(s.today).toEqual(today);
    expect(s.gate).toEqual(gate);
    expect(s.done.map((d) => d.number)).toEqual([51]);
  });

  it("저장된 것이 없거나 JSON 이 깨졌거나 모양이 다르면 null (지어내지 않음)", () => {
    expect(summarize([], [], [])).toMatchObject({ today: null, gate: null });
    const s = summarize([], [], [
      { key: "today-issue", body: "{깨진", syncedAt: at },
      { key: "gate-runs", body: JSON.stringify({ total: "많음" }), syncedAt: at },
    ]);
    expect(s).toMatchObject({ today: null, gate: null });
  });

  it("예전 응답(today · gate 없음)도 통과 — 웹 · 어드민이 API 보다 먼저 배포돼도 깨지지 않음", () => {
    expect(TasksSummary.parse({ names: {}, done: [], syncedAt: null })).toMatchObject({ today: null, gate: null });
  });

  it("TodayIssue 계약", () => {
    expect(TodayIssue.parse(today)).toEqual(today);
  });
});

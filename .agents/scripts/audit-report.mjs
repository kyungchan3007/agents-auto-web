// npm audit 결과 → 이슈 본문 · 고칠 개수 (작업 0118) — security-audit.yml 이 부름
//   고칠 기준: 서비스 의존성은 전부 · 개발 도구는 높음 이상 · 패키지 이름 등은 데이터일 뿐
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SEVERE = new Set(["high", "critical"]);
const cell = (s) => String(s).replace(/[|\n\r]/g, " ");

function vulnerabilities(json) {
  if (!json?.metadata?.vulnerabilities) throw new Error("npm audit 결과가 아님 (네트워크 오류일 수 있음)");
  return Object.values(json.vulnerabilities ?? {});
}

/** prod = npm audit --omit=dev · all = npm audit */
export function summarize(prod, all) {
  const rows = new Map();
  for (const v of vulnerabilities(prod)) rows.set(v.name, { ...v, kind: "서비스" });
  for (const v of vulnerabilities(all)) if (SEVERE.has(v.severity) && !rows.has(v.name)) rows.set(v.name, { ...v, kind: "개발 도구" });
  const list = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
  const body = [
    "매일 보안 점검(`npm audit`)에서 고칠 항목이 나왔습니다. 앱 예약이 이 이슈를 보고 고칩니다.",
    "",
    "| 패키지 | 등급 | 구분 | 영향 버전 | 자동 수정 |",
    "| --- | --- | --- | --- | --- |",
    ...list.map((v) => `| ${cell(v.name)} | ${cell(v.severity)} | ${v.kind} | ${cell(v.range ?? "")} | ${v.fixAvailable ? "가능" : "불가"} |`),
  ].join("\n");
  return { count: list.length, body };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [prodPath, allPath, outPath] = process.argv.slice(2);
  const r = summarize(JSON.parse(readFileSync(prodPath, "utf8")), JSON.parse(readFileSync(allPath, "utf8")));
  writeFileSync(outPath, r.body);
  console.log(r.count);
}

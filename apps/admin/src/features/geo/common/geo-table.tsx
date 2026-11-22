// GEO 판 안의 표 · 작은 제목 · 빈 상태 글 (작업 0214 · 0303 · 0312 에 geo-detail.tsx 에서 나눔) — GEO 판들이 같이 씀
import type { ReactNode } from "react";

export const EMPTY = "아직 기록이 없습니다";

/** 첫 칸이 경로("/…")면 고정폭 · numFrom 번째 칸부터 숫자 정렬 */
const cellClass = (v: string | number, i: number, numFrom: number) => (i >= numFrom ? "n" : i === 0 && String(v).startsWith("/") ? "mono" : undefined);

export function GeoTable({ head, rows, numFrom = 1 }: { head: string[]; rows: (string | number)[][]; numFrom?: number }) {
  return (
    <div className="adm-tw">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={i >= numFrom ? "n" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])}>
              {r.map((v, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 칸 순서가 곧 키
                <td key={i} className={cellClass(v, i, numFrom)}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const GeoSub = ({ title, children }: { title: string; children: ReactNode }) => (
  <>
    <h3 className="adm-subh">{title}</h3>
    {children}
  </>
);

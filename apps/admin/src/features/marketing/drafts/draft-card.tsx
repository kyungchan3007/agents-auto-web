"use client";

// 소재 초안 카드 하나 (작업 0307 · 0312 에 marketing-page.tsx 에서 나눔) — 그림 · 본문 · 복사 · 쓴 숫자
import { copyText } from "@/shared/clipboard/copy-text";
import { type Draft, copyBody, linkText } from "./drafts";
import { useImageFallback } from "./use-image-fallback";

const copy = (text: string, what: string) => void copyText(text, `${what}을 복사했습니다`, "복사하지 못했습니다. 글을 직접 골라 복사해 주세요");

export function DraftCard({ d }: { d: Draft }) {
  const { check, onError } = useImageFallback(d);
  return (
    <article data-testid="marketing-draft" className="adm-panel adm-draft" data-cmd="소재 초안" data-cmd-label={`${d.day} 초안`}>
      <div className="adm-ph">
        <h3 className="mono" style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          {d.day}
        </h3>
        {d.link && (
          <a className="adm-link" href={d.link} target="_blank" rel="noreferrer">
            {linkText(d.link)} ↗
          </a>
        )}
      </div>
      <div className="adm-draft-b">
        {d.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기 · R2 공개 주소(안 열리면 저장소 raw)를 그대로 (next/image 최적화 서버 없음) */}
            <img ref={check} onError={onError} src={d.image} alt={d.alt || `${d.day} 소재`} width={1080} height={1350} loading="lazy" />
            <div className="adm-draft-noimg" style={{ display: "none" }}>
              이미지 없음
            </div>
          </>
        ) : (
          <div className="adm-draft-noimg">이미지 없음</div>
        )}
        <div className="adm-draft-t">
          <p className="adm-draft-body">{d.body || "본문 없음"}</p>
          {d.tags && <p className="adm-note">{d.tags}</p>}
          <div className="adm-topr" style={{ marginTop: 4 }}>
            <button type="button" className="adm-btn" onClick={() => copy(copyBody(d), "본문과 해시태그")} disabled={!d.body}>
              본문 복사
            </button>
            {d.alt && (
              <button type="button" className="adm-btn" onClick={() => copy(d.alt, "이미지 대체 글")}>
                대체 글 복사
              </button>
            )}
          </div>
          {d.numbers.length > 0 && (
            <details className="adm-more" style={{ marginTop: 4 }}>
              <summary style={{ padding: "8px 0" }}>쓴 숫자와 받은 날짜</summary>
              <ul className="adm-note" style={{ margin: 0, paddingLeft: 16 }}>
                {d.numbers.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

"use client";

// 판 링크 복사 (작업 0303) — 지금 주소 + #판 id · 복사를 못 하면 알림에 주소를 보여 줌
import { copyText, panelUrl } from "../../clipboard/copy-text";
import { IconLink } from "../icons/icons";

export function PermaLink({ id, title }: { id: string; title: string }) {
  return (
    <button
      type="button"
      className="adm-perma"
      aria-label={`${title} 판 링크 복사`}
      onClick={() => void copyText(panelUrl(location.href, id), "이 판의 링크를 복사했습니다", `링크: #${id}`)}
    >
      <IconLink />
    </button>
  );
}

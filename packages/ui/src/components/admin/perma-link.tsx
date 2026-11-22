"use client";

// 판 링크 복사 (작업 0303) — 지금 주소 + #판 id · 복사를 못 하면 알림에 주소를 보여 줌
import { toast } from "../../lib/admin-events";
import { IconLink } from "./icons";

export function PermaLink({ id, title }: { id: string; title: string }) {
  return (
    <button
      type="button"
      className="adm-perma"
      aria-label={`${title} 판 링크 복사`}
      onClick={async () => {
        const url = `${location.href.split("#")[0]}#${id}`;
        try {
          await navigator.clipboard.writeText(url);
          toast("이 판의 링크를 복사했습니다");
        } catch {
          toast(`링크: #${id}`);
        }
      }}
    >
      <IconLink />
    </button>
  );
}

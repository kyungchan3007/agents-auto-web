// 글 복사 + 아래 알림 한 줄 (작업 0303 · 0307 · 0312 에 알리기 · 판 링크 복사의 같은 처리를 모음)
//   복사를 못 하면(권한 · 오래된 브라우저) 실패 문구를 알림으로
import { toast } from "../ui/events/admin-events";

export async function copyText(text: string, done: string, failed: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
    return true;
  } catch {
    toast(failed);
    return false;
  }
}

/** 지금 주소 + #판 id */
export const panelUrl = (href: string, id: string) => `${href.split("#")[0]}#${id}`;

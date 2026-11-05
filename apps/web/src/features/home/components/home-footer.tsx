// 꼬리말 — 신호 설명 · 출처 · 소개 · 작업실 링크
import { SOURCE_NOTE } from "@hav/shared/currency";
import { TextLink } from "@hav/ui/text/text-link";
import { PageFooter } from "@hav/ui/layout/page-footer";

export function HomeFooter({ windowDays }: { windowDays: number }) {
  return (
    <PageFooter className="space-y-2">
        <p>신호는 최근 {windowDays}일 중 오늘 값의 위치입니다. 앞으로를 예측하지 않으며, 투자 · 금융 조언이 아닙니다.</p>
        <p>
          {SOURCE_NOTE} · 화면에 보이는 값은 사이트를 만든 시점의 자료입니다 ·{" "}
          <TextLink href="/about">
            소개 · 판단 기준
          </TextLink>{" "}
          ·{" "}
          <TextLink href="/log">
            🚧 이 사이트는 AI 코딩 에이전트가 만들고 있습니다
          </TextLink>
        </p>
    </PageFooter>
  );
}

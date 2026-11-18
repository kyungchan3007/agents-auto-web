import { BigNumber } from "@hav/ui/text/big-number";
import { Button } from "@hav/ui/form/button";
import { Card } from "@hav/ui/layout/card";
import { NavBar } from "@hav/ui/layout/nav-bar";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Section } from "@hav/ui/layout/section";
import { DestinationRow } from "@hav/ui/data/destination-row";
import { SignalPin } from "@hav/ui/data/signal-pin";
import { FlapBoard } from "@hav/ui/data/flap-board";
import { CountUp } from "@hav/ui/motion/count-up";
import { SlideIn } from "@hav/ui/motion/slide-in";
import { Stamp } from "@hav/ui/data/stamp";
import { StatTile } from "@hav/ui/data/stat-tile";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { Tabs } from "@hav/ui/form/tabs";
import { Tooltip } from "@hav/ui/feedback/tooltip";
import type { Metadata } from "next";

// 개발용 확인 페이지 — 검색에 내보내지 않음 (작업 0076)
export const metadata: Metadata = { title: "디자인 시스템 · Flapfx", robots: { index: false, follow: false } };

// 디자인 시스템 확인용 — 숫자는 모두 예시 (실제 데이터 아님) · 새 테마 "하늘 종이 · 바다 띠"의 공통 컴포넌트 (작업 0168)
export default function DesignPage() {
  return (
    <>
      <NavBar
        title="flapfx"
        links={[
          { href: "#numbers", label: "큰 숫자" },
          { href: "#pins", label: "판정 핀" },
          { href: "#rows", label: "도착지 줄" },
          { href: "#stamp", label: "도장" },
          { href: "#tabs", label: "탭" },
          { href: "#motion", label: "움직임" },
        ]}
      />

      {/* 바다 띠 — 울트라마린 바탕 · 큰 숫자는 해 노랑 */}
      <Section id="numbers" surface="dark" eyebrow="디자인 시스템" title="오늘, 달러는 싼 편입니다.">
        <BigNumber label="예시 · 미국 달러" value="1,312" unit="원" />
      </Section>

      <Section id="pins" eyebrow="판정 핀" title={<>글자가 늘 같이<br />있습니다.</>}>
        <div className="flex flex-wrap gap-3">
          <SignalPin signal="cheap" pct={-4.1} />
          <SignalPin signal="normal" pct={0.4} />
          <SignalPin signal="expensive" pct={2.3} />
          <SignalPin signal="cheap" />
        </div>
        <dl className="mt-10 grid gap-6 sm:grid-cols-3">
          <StatTile label="예시 · 오늘" value="1,312원" sub="최근 90일 중 낮은 편" />
          <StatTile label="예시 · 가장 쌀 때" value="1,284원" />
          <StatTile label="예시 · 가장 비쌀 때" value="1,401원" />
        </dl>
      </Section>

      <Section id="rows" eyebrow="도착지 줄" title="도시 하나, 줄 하나.">
        <div className="max-w-3xl">
          <DestinationRow city="도쿄" currency="엔 100" rate="912원" signal="cheap" percentile={0.12} position={0.12} />
          <DestinationRow city="뉴욕" currency="달러 1" rate="1,312원" signal="normal" percentile={0.5} position={0.5} />
          <DestinationRow city="파리" currency="유로 1" rate="1,540원" signal="expensive" percentile={0.9} position={0.9} />
          <DestinationRow city="방콕" currency="바트 1" signal={null} />
        </div>
      </Section>

      <Section id="flap-board" eyebrow="출발 안내판" title="판에만 울트라마린.">
        <FlapBoard
          rows={[
            { text: "ICN → 도쿄", tone: "dest" },
            { text: "912원 / 100엔", tone: "money" },
            { text: "가장 싼 달 11월", tone: "white" },
          ]}
          cols={12}
          label="예시 — 인천에서 도쿄, 100엔에 912원, 가장 싼 달 11월"
        />
      </Section>

      <Section id="stamp" eyebrow="도장 · 카드 · 비어 있음" title="좋은 판정에만 노랑.">
        <Stamp>면세 한도 안</Stamp>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <Card title="달러">
            <SignalPin signal="cheap" />
          </Card>
          <Card title="엔">
            <SignalPin signal="normal" />
          </Card>
          <Card title="유로">
            <SignalPin signal="expensive" />
          </Card>
        </div>
        <div className="mt-10 max-w-xl">
          <EmptyState title="준비 중">자료를 아직 받지 못했습니다. 숫자를 만들어 보여 주지 않습니다.</EmptyState>
        </div>
      </Section>

      <Section id="tabs" eyebrow="탭 · 툴팁 · 버튼" title="여행지를 골라 보세요.">
        <Tabs
          items={[
            { value: "jp", label: "일본", content: "예시 · 엔화 기준 여행 물가 자리" },
            { value: "us", label: "미국", content: "예시 · 달러 기준 여행 물가 자리" },
            { value: "eu", label: "유럽", content: "예시 · 유로 기준 여행 물가 자리" },
          ]}
        />
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button>바로 계산</Button>
          <Button variant="secondary">자세히</Button>
          <Tooltip content="최근 90일 안에서 오늘 값의 위치 (예측 아님)">
            <Button variant="ghost">신호는 어떻게 계산하나요?</Button>
          </Tooltip>
        </div>
      </Section>

      <Section id="motion" eyebrow="움직임" title="화면에 들어올 때 한 번.">
        <div data-testid="motion-sample-count" className="font-display text-number font-extrabold">
          예시 · <CountUp value={1338.8} digits={1} suffix="원" />
        </div>
        <p className="mt-2 text-small text-fg-2">최종 값 근처에서 시작해 약 1초 · 움직임 줄이기를 켜면 바로 최종 값입니다.</p>
        <div data-testid="motion-sample-slide" className="mt-10 max-w-xl">
          <SlideIn from="left">
            <Card title="탑승권 예시">왼쪽에서 제자리로 0.7초 동안 들어옵니다.</Card>
          </SlideIn>
        </div>
      </Section>

      <PageFooter>자료: 예시 화면입니다 · 숫자는 모두 가짜 값 (실제 데이터 아님)</PageFooter>
    </>
  );
}

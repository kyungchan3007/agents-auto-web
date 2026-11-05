// 소개 · 판단 기준 (작업 0115 · 이슈 #117) — 규칙 숫자는 원본(API rule · 공용 상수 · rules.ts)에서 읽음
import type { Fetched } from "@/shared/api";
import { REPO_URL } from "@/shared/site";
import { SiteNav } from "@/shared/site-nav";
import { SOURCE_NOTE } from "@hav/shared/currency";
import type { SignalList } from "@hav/shared/signal";
import { BAND_EDGE } from "@hav/shared/travel";
import type { ReactNode } from "react";
import { DUTY_FREE_USD, RULES_SOURCE } from "../import-calc/rules";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const LINK = "text-accent underline underline-offset-2 hover:decoration-2";

export function AboutPage({ signals }: { signals: Fetched<SignalList> }) {
  const rule = signals.ok ? signals.data.rule : null;
  return (
    <>
      <SiteNav page="about" />
      <main data-surface="dark" className="bg-surface px-4 pt-14 pb-24 text-fg sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-eyebrow font-semibold text-fg-2">소개</p>
          <h1 className="mt-3 text-title font-semibold tracking-tight">Tripfx는 어떤 자료를, 어떤 기준으로 보여 주나요.</h1>
          <p className="mt-6 text-lead text-fg-2">Tripfx는 여행과 해외 직구를 앞둔 사람이 환율 · 여행지 물가 · 직구 세금을 한곳에서 확인하는 사이트입니다. 로그인 없이 쓸 수 있습니다.</p>

          <Part title="환율">
            <p>{SOURCE_NOTE}. 평일 낮에 하루 한 번 받아 저장합니다.</p>
            <p>주말 · 공휴일처럼 고시가 없는 날의 값은 만들지 않습니다. 화면의 값에는 기준일과 출처를 함께 적습니다.</p>
          </Part>

          <Part title="싼 편 · 비싼 편 신호">
            {rule ? (
              <>
                <p>최근 {rule.windowDays}일 중 오늘 환율보다 낮았던 날의 비율로 정합니다. {pct(rule.cheapAt)} 이하면 싼 편, {pct(rule.expensiveAt)} 이상이면 비싼 편, 그 사이는 보통입니다.</p>
                <p>그 기간 평일의 {pct(rule.minCoverage)}보다 기록이 적으면 신호를 내지 않습니다.</p>
              </>
            ) : (
              <p>규칙 값을 받지 못했습니다 ({signals.ok ? "" : signals.reason})</p>
            )}
            <p>지난 값 안에서의 위치일 뿐입니다. 앞으로를 예측하지 않으며 투자 · 금융 조언이 아닙니다.</p>
          </Part>

          <Part title="여행 물가">
            <p>세계은행의 가계 소비 구매력 평가(PPP)를 시장 환율로 나눈 값을 쓰고, 한국과 같은 연도끼리 비교합니다.</p>
            <p>한국 대비 {BAND_EDGE.cheap} 미만이면 싼 편, {BAND_EDGE.pricey} 초과면 비싼 편, 그 사이는 비슷으로 묶습니다.</p>
            <p>나라 전체 평균이라 도시 · 품목 · 숙소에 따라 체감은 다릅니다. 세계은행 안내대로 정밀한 순위를 매기지 않습니다.</p>
          </Part>

          <Part title="직구 계산">
            <p>면세 한도는 미국발 목록통관 물품 {DUTY_FREE_USD["us-list"]}달러, 그 밖은 {DUTY_FREE_USD.other}달러로 계산합니다.</p>
            <p>
              근거:{" "}
              <a href={RULES_SOURCE.url} className={LINK}>
                {RULES_SOURCE.name}
              </a>{" "}
              (<time dateTime={RULES_SOURCE.checked}>{RULES_SOURCE.checked}</time> 확인)
            </p>
            <p>결과는 예상 금액입니다. 실제 세액은 관세청 과세환율과 품목 분류로 정해집니다. 입력한 값은 브라우저 안에서만 계산하고 어디에도 보내지 않습니다.</p>
          </Part>

          <Part title="방문 통계">
            <p>어느 페이지를 얼마나 보는지와 어디서 넘어왔는지를 Cloudflare Web Analytics로 집계합니다. 로그인이 없고, 직구 계산기 · 여행 예산에 넣은 값은 보내지 않습니다.</p>
          </Part>

          <Part title="누가 만드나요">
            <p>
              개발자는 기획 · 설계 · 정책을 간단히 정하고, 코드의 역할 분담까지만 확인합니다. 코드 작성부터 테스트 · 머지까지는 AI 코딩 에이전트가 맡습니다. 에이전트의 개발 생산성과 효과, GEO(AI 검색 노출)를 확인하기 위한 프로젝트이며, 과정은{" "}
              <a href="/log" className={LINK}>
                작업실
              </a>
              에 공개합니다. 코드와 작업 기록은{" "}
              <a href={REPO_URL} className={LINK}>
                GitHub 저장소
              </a>
              에 있고, 잘못된 내용은{" "}
              <a href={`${REPO_URL}/issues`} className={LINK}>
                이슈
              </a>
              로 알려 주세요.
            </p>
          </Part>
        </div>
      </main>
    </>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-fg-2">{children}</div>
    </section>
  );
}

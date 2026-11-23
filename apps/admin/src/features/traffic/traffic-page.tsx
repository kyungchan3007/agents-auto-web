"use client";

// 유입 화면 (작업 0324 · 사용자 결정 "GA4 확인하는 화면 하나") — 날짜별 · 유입 경로별 · 많이 본 페이지 · 받지 못한 값은 빈 칸 · 그래프는 자료가 쌓인 뒤 따로
import { AdminNav } from "@/shared/nav/admin-nav";
import { MEASURE_START } from "@/shared/site";
import { Stamp } from "@/shared/ui/panel/panel";
import { TrafficBody } from "./traffic-body";

export function TrafficPage() {
  return (
    <AdminNav page="traffic">
      <div className="adm-top">
        <div>
          <p className="adm-eyebrow">유입</p>
          <h1>방문이 어디서 얼마나 오는지</h1>
          <p className="adm-lede">구글 애널리틱스(GA4)가 센 운영 사이트 방문을 매일 한 번 받아 날짜별로 남깁니다. 어드민 방문은 세지 않습니다.</p>
          <p data-testid="traffic-start" className="adm-lede">GA4 측정 시작 {MEASURE_START.ga4} — 그 전 날짜는 자료가 없습니다.</p>
        </div>
        <Stamp>매일 04:50 받음 · 최근 28일</Stamp>
      </div>
      <TrafficBody />
    </AdminNav>
  );
}

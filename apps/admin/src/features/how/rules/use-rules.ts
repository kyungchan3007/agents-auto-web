"use client";

// 규칙 목록 (작업 0303) — 묶음(전체 · 안전 · 품질 · 협업) · 하나씩 · 모두 펼치기 · 찾기 창에서 고른 규칙(adm-pick)은 펼치고 가운데로 (처리는 shared/fold)
import { useFoldList } from "@/shared/fold/use-fold-list";
import { HOW_RULES, type RuleCat } from "../common/how";

export const useRules = () => useFoldList<(typeof HOW_RULES)[number], RuleCat, HTMLDivElement>(HOW_RULES, (r) => r.cat, "rule");

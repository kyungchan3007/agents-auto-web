"use client";

// 시행착오 목록 (작업 0306) — 종류로 골라 보기 · 하나씩 · 모두 펼치기 · 찾기 창에서 고른 항목(adm-pick)은 펼치고 가운데로 (처리는 shared/fold)
import { useFoldList } from "@/shared/fold/use-fold-list";
import { HOW_TRIALS, type TrialCat } from "./trials-data";

export const useTrials = () => useFoldList<(typeof HOW_TRIALS)[number], TrialCat, HTMLOListElement>(HOW_TRIALS, (t) => t.cat, "trial");

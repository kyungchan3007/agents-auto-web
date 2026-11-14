"use client";

// 3D 는 첫 화면 로드에 넣지 않고 화면 가까이 올 때 브라우저가 한가할 때 불러온다 (정적 HTML 에는 글자 · 빈 칸만)
// 장면 · 늦게 불러오기 틀 모두 디자인 시스템(@hav/ui/three/* · @hav/ui/motion/lazy-near) · 여기는 어떤 장면을 쓰는지만
import { lazyNear } from "../../components/motion/lazy-near";
import type { CoinProps } from "../objects/coin";
import type { GlobeProps } from "../objects/globe";
import type { PlaneProps } from "../objects/plane";
import type { MoneyCatProps } from "../characters/money-cat";
import type { StationsProps } from "../objects/stations";
import type { WorkerCatProps } from "../characters/worker-cat";

export const GlobeLazy = lazyNear<GlobeProps>(() => import("../objects/globe"));
export const WorkerCatLazy = lazyNear<WorkerCatProps>(() => import("../characters/worker-cat"));
export const StationsLazy = lazyNear<StationsProps>(() => import("../objects/stations"));
export const CoinLazy = lazyNear<CoinProps>(() => import("../objects/coin"));
export const MoneyCatLazy = lazyNear<MoneyCatProps>(() => import("../characters/money-cat"));
export const PlaneLazy = lazyNear<PlaneProps>(() => import("../objects/plane"));

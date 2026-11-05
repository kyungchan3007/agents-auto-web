"use client";

// 3D 는 첫 화면 로드에 넣지 않고 화면 가까이 올 때 브라우저가 한가할 때 불러온다 (정적 HTML 에는 글자 · 빈 칸만)
// 장면 · 늦게 불러오기 틀 모두 디자인 시스템(@hav/ui/three/* · @hav/ui/lazy-near) · 여기는 어떤 장면을 쓰는지만
import { lazyNear } from "../components/lazy-near";
import type { CoinProps } from "./coin";
import type { GlobeProps } from "./globe";
import type { MoneyCatProps } from "./money-cat";
import type { StationsProps } from "./stations";
import type { WorkerCatProps } from "./worker-cat";

export const GlobeLazy = lazyNear<GlobeProps>(() => import("./globe"));
export const WorkerCatLazy = lazyNear<WorkerCatProps>(() => import("./worker-cat"));
export const StationsLazy = lazyNear<StationsProps>(() => import("./stations"));
export const CoinLazy = lazyNear<CoinProps>(() => import("./coin"));
export const MoneyCatLazy = lazyNear<MoneyCatProps>(() => import("./money-cat"));

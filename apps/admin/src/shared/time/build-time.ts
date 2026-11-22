// 빌드 때 시각 (작업 0205 · 0105 · 0312 에 app/geo · app/log 의 page.tsx 에서 옮김) — 브라우저에서 여는 날이 아니라 자료를 받은 때
import { kstDate } from "@hav/shared/date";

/** 자료를 받은 날(빌드 때 한국 날짜) */
export const buildDay = () => kstDate(new Date());

/** 빌드한 시각 (ISO) */
export const buildStamp = () => new Date().toISOString();

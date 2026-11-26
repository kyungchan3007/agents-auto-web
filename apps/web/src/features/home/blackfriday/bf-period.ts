// 블랙프라이데이 hero 보이는 기간 (작업 0381) — 배포 즉시 ~ BF_END(미국 사이버먼데이 끝 · 한국 시각 12-01 17:00) · 시작 · 끝 시각은 이 파일 한 곳
//   정적 빌드라 빌드 시각으로 고를 수 없어 브라우저 지금 시각으로 고름 · 첫 그림 깜빡임이 없게 html 의 data-hero 를 첫 그림 전에 정하는 작은 인라인 스크립트(layout)가 하고, 스크립트가 꺼졌을 때는 use-bf-period 가 같은 값으로 맞춤
//   기간이 끝나면 다음 작업에서 이 폴더(blackfriday)와 홈의 자리 바꿈 코드를 지움
export const BF_END = "2026-12-01T17:00:00+09:00";
export const HERO_ATTR = "data-hero";

/** 지금(Date 또는 밀리초)이 기간 안인가 — 끝 시각 정각부터는 기본 hero */
export const isBlackFriday = (now: Date | number): boolean => Number(now) < Date.parse(BF_END);

/** 지금 시각으로 고른 hero 이름 — html 의 data-hero 값 */
export const heroOf = (now: Date | number): "bf" | "default" => (isBlackFriday(now) ? "bf" : "default");

/** html 에 data-hero 를 정하는 인라인 스크립트 글 — isBlackFriday 와 같은 판정(끝 시각 숫자만 이 파일에서 가져옴) */
export const heroScript = (): string => `document.documentElement.setAttribute("${HERO_ATTR}",Date.now()<${Date.parse(BF_END)}?"bf":"default")`;

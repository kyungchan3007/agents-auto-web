// 홈 도착지 — 이 사이트의 데이터 (작업 0177: 3D 지구를 없애 서울 · 지구 그림 파일은 더 쓰지 않음)

/** 도착지 하나 — 위경도는 예전 지구 호에 쓰던 값 (지금은 이름 · 통화 · 나라만 읽음) */
export type Place = { id: string; name: string; lat: number; lng: number; currency?: string };

/** 여행지 — 홈 흐름 "일본 · 미국 · 유럽 · 태국" (docs/design.md) · country = 물가 자료의 나라 코드 (ISO alpha-3) */
export const DESTINATIONS: (Place & { country: string })[] = [
  { id: "tokyo", name: "도쿄", lat: 35.68, lng: 139.69, currency: "JPY", country: "JPN" },
  { id: "newyork", name: "뉴욕", lat: 40.71, lng: -74.01, currency: "USD", country: "USA" },
  { id: "paris", name: "파리", lat: 48.86, lng: 2.35, currency: "EUR", country: "FRA" },
  { id: "bangkok", name: "방콕", lat: 13.75, lng: 100.5, currency: "THB", country: "THA" },
];

// 어드민 선 아이콘 — 한 벌 · 16px · 선 1.5 (작업 0303)
const P = { className: "i", viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const IconLog = () => (
  <svg {...P}>
    <path d="M4 5h16M4 12h16M4 19h10" />
  </svg>
);
export const IconGeo = () => (
  <svg {...P}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
export const IconHow = () => (
  <svg {...P}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <path d="M8 7.5l3 8M16 7.5l-3 8M8.5 6h7" />
  </svg>
);
export const IconOut = () => (
  <svg {...P}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
  </svg>
);
export const IconSearch = () => (
  <svg {...P}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconRefresh = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M20 12a8 8 0 1 1-2.3-5.7L20 8" />
    <path d="M20 3v5h-5" />
  </svg>
);
export const IconLink = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
);

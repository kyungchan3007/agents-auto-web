// 공유 미리보기 이미지 — 빌드 때 한 번 그림 (정적) · 한글은 Pretendard 파일로 (기본 글꼴엔 한글이 없음)
// 새 디자인 1안 (작업 0216 · 사용자 "새 디자인으로" → "1안" · 시안 .tmp/redesign-1118/og/og-1.png): 사진 없이 파랑 한 면 · 왼쪽 위 B 로고(flap 흰 + fx 노랑) · 큰 제목 · 출발 안내판 한 줄
// 이미지 그리기는 CSS 변수를 못 읽어 토큰 색을 값으로 적음: 파랑 #2438A8 · 노랑 #F7C548 · 안내판 판 #16246E · 칸 #1F3190 · 이음선 #0E1648
// 숫자는 넣지 않음 — 이미지는 캐시돼 오래 남아서 그날 환율이 틀린 값으로 보일 수 있음 (FX-02 · 지어내지 않음)
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Flapfx — 지금 환율이 싼 편인지, 여행 · 직구 전에 한눈에";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 빌드는 apps/web 에서 돌고 패키지는 저장소 맨 위 node_modules 로 올라가 있을 수 있음 — 번들러가 require.resolve 를 모듈 번호로 바꿔서 경로로 찾음
const FONT_DIRS = ["node_modules/pretendard/dist/public/static", "../../node_modules/pretendard/dist/public/static"].map((d) => join(process.cwd(), d));
const font = (weight: "Black" | "ExtraBold" | "Medium") => {
  const dir = FONT_DIRS.find((d) => existsSync(d));
  if (!dir) throw new Error("Pretendard 글꼴 파일을 찾지 못함 (pretendard 패키지)");
  return readFile(join(dir, `Pretendard-${weight}.otf`));
};

const SUN = "#F7C548";
// 안내판 한 줄 — 18칸 · 글자 하나 = 한 칸 · 빈칸은 "" (시안 1안)
const BOARD = "ICN → 도쿄 뉴욕 파리";
const CELLS = ["I", "C", "N", "", "→", "", "도", "쿄", "", "", "뉴", "욕", "", "", "파", "리", "", ""];

export default async function Image() {
  const [black, extraBold, medium] = await Promise.all([font("Black"), font("ExtraBold"), font("Medium")]);
  return new ImageResponse(
    <div aria-label={BOARD} style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard", color: "#FFFFFF", background: "#2438A8" }}>
      <div style={{ position: "absolute", left: 72, top: 56, display: "flex", fontSize: 40, fontWeight: 900, letterSpacing: "-0.05em" }}>
        <span>flap</span>
        <span style={{ color: "#F7C548" }}>fx</span>
      </div>
      <div style={{ position: "absolute", right: 72, top: 68, display: "flex", fontSize: 22, fontWeight: 500, color: "#C6D4F5" }}>환율 · 여행 물가 · 직구 계산</div>
      <div style={{ position: "absolute", left: 72, top: 150, display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.045em" }}>
        <span>오늘, 그 통화는</span>
        <div style={{ display: "flex" }}>
          <span style={{ color: SUN }}>싼 편</span>
          <span>일까?</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 72, top: 372, display: "flex", fontSize: 26, fontWeight: 500, color: "#D3DEF7" }}>매일 받은 환율이 최근 90일 중 어디쯤인지 · 예측 아님</div>
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 56, display: "flex", gap: 6, padding: 14, borderRadius: 14, background: "#16246E" }}>
        {CELLS.map((c, i) => (
          <div key={i} style={{ position: "relative", flex: 1, height: 58, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, background: "#1F3190", color: "#FFFFFF", fontSize: 32, fontWeight: 800 }}>
            {c}
            <div style={{ position: "absolute", left: 0, right: 0, top: 28, height: 2, background: "#0E1648" }} />
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: black, weight: 900, style: "normal" },
        { name: "Pretendard", data: extraBold, weight: 800, style: "normal" },
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}

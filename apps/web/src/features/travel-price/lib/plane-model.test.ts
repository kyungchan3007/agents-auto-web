// 작업 0164 — 3D 비행기 모델 파일 주소 · 출처 표시 (CC-BY 4.0 조건) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/travel-price/lib/plane-model.ts
//   export const PLANE_MODEL_URL = "/models/plane.glb"        // 사이트 정적 파일 · packages/ui 컴포넌트에는 url prop 으로 넘김 (지구 사진과 같은 방식)
//   export const PLANE_CREDIT = {
//     text: "3D 비행기: Airplane · Poly by Google (CC-BY 4.0)",
//     sourceUrl: "https://poly.pizza/m/8ciDd9k8wha",           // 원본 링크
//     licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
//   } as const
//   파일: apps/web/public/models/plane.glb — .tmp/model-trial/plane.glb 를 복사 (236,520 바이트 · 새로 내려받지 않음)
//   화면(소스 검사): travel-price/components/*.tsx 중 하나가 PLANE_CREDIT 을 쓰고(출처 문구 + 원본 링크) 비행기에 PLANE_MODEL_URL 을 넘김
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PLANE_CREDIT, PLANE_MODEL_URL } from "./plane-model";

const WEB = fileURLToPath(new URL("../../../../", import.meta.url)); // apps/web/
const GLB = join(WEB, "public", PLANE_MODEL_URL.replace(/^\//, ""));

describe("모델 파일", () => {
  it("주소는 사이트 안 절대 경로 (.glb) · 그 자리에 파일이 있음", () => {
    expect(PLANE_MODEL_URL).toBe("/models/plane.glb");
    expect(existsSync(GLB), GLB).toBe(true);
  });

  it("진짜 glTF 2.0 바이너리 — 머리 글자 'glTF' · 버전 2 · 머리의 전체 길이 = 파일 크기", () => {
    const buf = readFileSync(GLB);
    expect(buf.subarray(0, 4).toString("ascii")).toBe("glTF");
    expect(buf.readUInt32LE(4)).toBe(2);
    expect(buf.readUInt32LE(8)).toBe(buf.length);
  });

  it("크기는 받아 둔 파일 그대로 236,520 바이트 (모바일 · 전송량 — 다른 파일로 바뀌거나 커지지 않게)", () => {
    expect(statSync(GLB).size).toBe(236_520);
  });
});

describe("출처 표시 (CC-BY 4.0 은 출처 표시가 조건)", () => {
  it("문구 · 원본 링크 · 라이선스 링크", () => {
    expect(PLANE_CREDIT.text).toBe("3D 비행기: Airplane · Poly by Google (CC-BY 4.0)");
    expect(PLANE_CREDIT.sourceUrl).toBe("https://poly.pizza/m/8ciDd9k8wha");
    expect(PLANE_CREDIT.licenseUrl).toBe("https://creativecommons.org/licenses/by/4.0/");
  });

  it("화면 코드가 출처를 보여 주고 모델 주소를 비행기에 넘김", () => {
    const dir = join(WEB, "src/features/travel-price/components");
    const sources = readdirSync(dir).filter((f) => f.endsWith(".tsx")).map((f) => readFileSync(join(dir, f), "utf8"));
    expect(sources.some((s) => s.includes("PLANE_CREDIT")), "PLANE_CREDIT 을 쓰는 화면").toBe(true);
    expect(sources.some((s) => /PlaneLazy|Plane/.test(s) && s.includes("PLANE_MODEL_URL")), "비행기에 PLANE_MODEL_URL").toBe(true);
  });
});

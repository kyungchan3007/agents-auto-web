import { describe, expect, it } from "vitest";
import { panelUrl } from "./copy-text";

describe("판 링크 주소", () => {
  it("지금 주소의 #뒤를 바꿔 판 id 를 붙임", () => {
    expect(panelUrl("https://admin.flapfx.com/geo#old", "geo-bots")).toBe("https://admin.flapfx.com/geo#geo-bots");
    expect(panelUrl("http://localhost:3001/log", "status")).toBe("http://localhost:3001/log#status");
  });
});

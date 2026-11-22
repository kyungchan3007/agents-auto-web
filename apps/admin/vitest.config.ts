import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 어디에 두든 *.test.ts 를 찾는다 — 테스트는 그 로직 옆(같은 하위 도메인 폴더)에 둔다 (작업 0312)
//   "@/" 는 tsconfig paths 와 같게 src 로 (lib · 훅이 @/shared 를 가져와도 테스트가 돎)
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "out/**", ".tmp/**"],
  },
});

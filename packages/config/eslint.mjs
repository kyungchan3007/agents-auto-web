// 공용 eslint — apps/api · packages/ui · packages/shared (웹은 Next 설정)
//   no-floating-promises: Worker 는 응답 뒤 끝나지 않은 일이 끊길 수 있음 (근거: Cloudflare Workers Best Practices)
import tseslint from "typescript-eslint";

export default function config(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ["dist/**", ".wrangler/**", "node_modules/**", "worker-configuration.d.ts", "scripts/**", "**/*.mjs", "*.config.ts"] },
    ...tseslint.configs.recommended,
    {
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir } },
      rules: {
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      },
    },
  );
}

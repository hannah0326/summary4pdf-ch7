// 작성: 2026-11-26 11:59 KST
// ESLint 설정
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next의 기본 무시 목록을 아래 내용으로 덮어쓴다.
  globalIgnores([
    // eslint-config-next의 기본 무시 목록:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

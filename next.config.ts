// 작성: 2026-11-26 11:59 KST
// Next.js 설정
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 캐시 컴포넌트와 부분 미리 가져오기 사용
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

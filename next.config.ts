import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // ⭐ 외부 이미지를 Next.js의 <Image> 컴포넌트에서 쓰기 위한 허락 설정
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // 모든 https 사이트의 이미지 허용
      },
      {
        protocol: "http",
        hostname: "**", // 모든 http 사이트의 이미지 허용
      },
    ],
  },
};

export default nextConfig;
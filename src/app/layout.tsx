import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import MainNavigation from "@/components/layout/MainNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap", // 폰트 로딩 최적화
  preload: true, // 프리로드 활성화
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap", // 폰트 로딩 최적화
  preload: true, // 프리로드 활성화
});

export const metadata: Metadata = {
  title: "Consulton - 전문가 상담 플랫폼",
  description:
    "전문가와의 실시간 상담을 통해 문제를 해결하고 새로운 인사이트를 얻어보세요.",
  // 폰트 최적화를 위한 메타데이터
  other: {
    "font-display": "swap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 폰트 프리로드 최적화 - Next.js가 자동으로 처리하므로 제거 */}
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <MainNavigation />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

/**
 * 루트 레이아웃 컴포넌트
 *
 * 이 컴포넌트는 Next.js 앱의 최상위 레이아웃입니다.
 * 모든 페이지에 공통으로 적용되는 설정들을 포함합니다:
 * - 폰트 설정
 * - 전역 스타일
 * - AuthProvider로 전체 앱을 감싸서 인증 상태를 제공
 */

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

/**
 * 페이지 메타데이터
 * 브라우저 탭에 표시되는 제목과 설명을 설정합니다.
 */
export const metadata: Metadata = {
  title: "AssetHub",
  description: "개인 자산 관리 서비스",
};

/**
 * 루트 레이아웃 컴포넌트
 *
 * @param children - 모든 페이지 컴포넌트들이 여기에 렌더링됩니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {/* 
          AuthProvider로 전체 앱을 감싸서 
          모든 컴포넌트에서 useAuth() 훅을 사용할 수 있게 합니다.
        */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

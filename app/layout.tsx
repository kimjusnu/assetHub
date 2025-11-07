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
 * SEO 최적화를 위한 메타 태그 포함
 */
export const metadata: Metadata = {
  title: {
    default: "AssetHub - 프라이빗 자산 관리 서비스",
    template: "%s | AssetHub",
  },
  description: "자산관리툴로 금융관리를 쉽고 간단하게! 자산포트폴리오를 한눈에 확인하고 체계적으로 관리하세요. 전문가가 설계한 자산관리 서비스로 자산별 추이를 그래프로 확인하고 관리하세요.",
  keywords: ["자산관리", "자산관리툴", "금융관리", "자산포트폴리오", "포트폴리오", "재무관리", "자산추적", "투자관리", "자산대시보드", "자산관리앱", "개인자산관리"],
  authors: [{ name: "AssetHub" }],
  creator: "AssetHub",
  publisher: "AssetHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://asset-hub-three.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://asset-hub-three.vercel.app",
    siteName: "AssetHub",
    title: "AssetHub - 프라이빗 자산 관리 서비스 | 자산관리툴",
    description: "자산관리툴로 금융관리를 쉽고 간단하게! 자산포트폴리오를 한눈에 확인하고 체계적으로 관리하세요. 전문가가 설계한 자산관리 서비스로 자산별 추이를 그래프로 확인하고 관리하세요.",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "AssetHub - 프라이빗 자산 관리 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AssetHub - 프라이빗 자산 관리 서비스 | 자산관리툴",
    description: "자산관리툴로 금융관리를 쉽고 간단하게! 자산포트폴리오를 한눈에 확인하고 체계적으로 관리하세요. 전문가가 설계한 자산관리 서비스로 자산별 추이를 그래프로 확인하고 관리하세요.",
    images: ["/opengraph.png"],
  },
  icons: {
    icon: [
      { url: "/pavicon.png", sizes: "any" },
      { url: "/pavicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/pavicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // 구글 서치 콘솔과 네이버 서치어드바이저에서 제공하는 메타 태그를 여기에 추가하세요
    // google: "your-google-verification-code",
    // other: {
    //   "naver-site-verification": "your-naver-verification-code",
    // },
  },
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
  // 구조화된 데이터 (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AssetHub - 자산관리툴",
    "alternateName": "자산관리, 금융관리, 자산포트폴리오 관리",
    "description": "자산관리툴로 금융관리를 쉽고 간단하게! 자산포트폴리오를 한눈에 확인하고 체계적으로 관리하세요. 전문가가 설계한 자산관리 서비스로 자산별 추이를 그래프로 확인하고 관리하세요.",
    "url": "https://asset-hub-three.vercel.app",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "keywords": "자산관리, 자산관리툴, 금융관리, 자산포트폴리오, 포트폴리오, 재무관리, 자산추적, 투자관리",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    }
  };

  return (
    <html lang="ko">
      <head>
        {/* 네이버 서치어드바이저 사이트 검증 */}
        {/* 네이버 서치어드바이저에서 제공하는 메타 태그를 여기에 추가하세요 */}
        {/* <meta name="naver-site-verification" content="your-naver-verification-code" /> */}
        
        {/* 구조화된 데이터 (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </head>
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

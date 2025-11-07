import { MetadataRoute } from 'next';

/**
 * robots.txt 생성
 * 검색 엔진 크롤러에게 사이트 크롤링 규칙을 알려줍니다.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://asset-hub-three.vercel.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


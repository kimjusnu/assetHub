import { MetadataRoute } from 'next';

/**
 * 사이트맵 생성
 * 구글과 네이버 검색 엔진에 사이트 구조를 알려줍니다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://asset-hub-three.vercel.app';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/assets`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}


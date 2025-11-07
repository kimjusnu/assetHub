# SEO 설정 가이드

이 문서는 AssetHub 프로젝트의 SEO 설정 방법을 안내합니다.

## 설정 완료된 항목

### 1. 메타 태그 설정
- ✅ 기본 메타 태그 (title, description, keywords)
- ✅ Open Graph 태그 (소셜 미디어 공유용)
- ✅ Twitter Card 태그
- ✅ Robots 메타 태그
- ✅ Canonical URL

### 2. 사이트맵 (Sitemap)
- ✅ `/sitemap.xml` 자동 생성
- ✅ 주요 페이지 포함 (/, /settings, /assets)

### 3. Robots.txt
- ✅ `/robots.txt` 자동 생성
- ✅ 구글봇(Googlebot) 및 네이버봇(Yeti) 설정
- ✅ 크롤링 허용/차단 규칙 설정

### 4. 구조화된 데이터 (JSON-LD)
- ✅ Schema.org WebApplication 마크업

## 추가 설정 필요 항목

### 구글 서치 콘솔 등록

1. **구글 서치 콘솔 접속**
   - https://search.google.com/search-console 접속
   - Google 계정으로 로그인

2. **속성 추가**
   - "속성 추가" 클릭
   - URL 접두어 방식 선택
   - `https://asset-hub-three.vercel.app` 입력

3. **소유권 확인**
   - HTML 태그 방식 선택
   - 제공된 메타 태그 코드 복사
   - `app/layout.tsx` 파일의 `verification.google` 부분에 추가:
   ```typescript
   verification: {
     google: "your-google-verification-code",
   },
   ```

4. **사이트맵 제출**
   - 구글 서치 콘솔에서 "사이트맵" 메뉴 선택
   - `https://asset-hub-three.vercel.app/sitemap.xml` 제출

### 네이버 서치어드바이저 등록

1. **네이버 서치어드바이저 접속**
   - https://searchadvisor.naver.com 접속
   - 네이버 계정으로 로그인

2. **사이트 등록**
   - "웹마스터 도구" → "사이트 추가"
   - 사이트 URL 입력: `https://asset-hub-three.vercel.app`
   - 사이트명 입력: `AssetHub`

3. **소유권 확인**
   - HTML 메타 태그 방식 선택
   - 제공된 메타 태그 코드 복사
   - `app/layout.tsx` 파일의 `<head>` 섹션에 추가:
   ```tsx
   <meta name="naver-site-verification" content="your-naver-verification-code" />
   ```

4. **사이트맵 제출**
   - 네이버 서치어드바이저에서 "요청" → "사이트맵 제출"
   - `https://asset-hub-three.vercel.app/sitemap.xml` 제출

## SEO 최적화 팁

### 1. 콘텐츠 최적화
- 각 페이지에 고유한 title과 description 설정
- 키워드를 자연스럽게 콘텐츠에 포함
- 정기적으로 콘텐츠 업데이트

### 2. 성능 최적화
- 이미지 최적화 (WebP 형식 사용)
- 페이지 로딩 속도 개선
- 모바일 반응형 디자인 확인

### 3. 백링크 구축
- 소셜 미디어 공유
- 관련 커뮤니티에 소개
- 블로그 포스팅

### 4. 모니터링
- 구글 서치 콘솔에서 검색 성과 확인
- 네이버 서치어드바이저에서 노출 현황 확인
- 정기적으로 사이트맵 업데이트

## 참고 링크

- [구글 서치 콘솔](https://search.google.com/search-console)
- [네이버 서치어드바이저](https://searchadvisor.naver.com)
- [Next.js SEO 가이드](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org 문서](https://schema.org/)


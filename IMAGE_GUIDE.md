# 이미지 크기 가이드

## 파비콘 (Favicon)

### 표준 크기
- **16x16px**: 브라우저 탭 기본 크기
- **32x32px**: 브라우저 탭 고해상도
- **96x96px**: 데스크톱 단축 아이콘
- **192x192px**: Android 홈 화면
- **512x512px**: Android 홈 화면 고해상도

### Next.js App Router
Next.js는 `app/icon.tsx` 파일을 자동으로 인식하여 다양한 크기의 파비콘을 생성합니다.

### 수동 생성 방법
1. 원본 이미지를 512x512px로 준비
2. 온라인 도구 사용:
   - https://realfavicongenerator.net/
   - https://favicon.io/
3. 생성된 파일들을 `app/` 폴더에 배치

---

## 오픈그래프 이미지 (카카오톡, 페이스북 등)

### 표준 크기
- **권장**: 1200x630px
- **최소**: 600x315px
- **비율**: 1.91:1 (가로:세로)

### 카카오톡 공유 이미지
- **크기**: 1200x630px (권장)
- **파일 형식**: PNG 또는 JPG
- **최대 크기**: 5MB

### Next.js App Router
Next.js는 `app/opengraph-image.tsx` 또는 `app/opengraph-image.png` 파일을 자동으로 인식합니다.

### 수동 생성 방법
1. 디자인 도구(Photoshop, Figma 등)에서 1200x630px 캔버스 생성
2. 로고, 제목, 설명 등을 배치
3. PNG 또는 JPG로 저장
4. `app/opengraph-image.png`로 저장

---

## 트위터 카드 이미지

### 표준 크기
- **권장**: 1200x675px 또는 1200x630px
- **비율**: 16:9 또는 1.91:1

### Next.js App Router
Next.js는 `app/twitter-image.tsx` 또는 `app/twitter-image.png` 파일을 자동으로 인식합니다.

---

## Apple Touch Icon (iOS)

### 표준 크기
- **권장**: 180x180px
- **파일명**: `apple-icon.png`

### Next.js App Router
Next.js는 `app/apple-icon.png` 파일을 자동으로 인식합니다.

---

## 이미지 최적화 팁

1. **파일 크기 최적화**
   - PNG: 투명도가 필요한 경우
   - JPG: 사진이나 복잡한 이미지
   - WebP: 최신 브라우저 지원 (가장 작은 파일 크기)

2. **압축 도구**
   - https://tinypng.com/
   - https://squoosh.app/
   - https://imageoptim.com/

3. **반응형 이미지**
   - Next.js의 `next/image` 컴포넌트 사용
   - 자동으로 최적화된 이미지 제공

---

## 현재 설정

현재 프로젝트에는 다음 파일들이 설정되어 있습니다:

- ✅ `app/icon.tsx`: 파비콘 자동 생성
- ✅ `app/opengraph-image.tsx`: 오픈그래프 이미지 자동 생성
- ✅ `app/favicon.ico`: 기본 파비콘

---

## 커스텀 이미지 사용하기

자동 생성 대신 직접 만든 이미지를 사용하려면:

1. **파비콘**
   - `app/icon.png` 또는 `app/icon.ico` 파일 생성
   - 또는 `app/icon.tsx` 파일 삭제 후 정적 파일 사용

2. **오픈그래프 이미지**
   - `app/opengraph-image.png` 파일 생성
   - 또는 `app/opengraph-image.tsx` 파일 삭제 후 정적 파일 사용

3. **트위터 이미지**
   - `app/twitter-image.png` 파일 생성

---

## 참고 링크

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [카카오톡 링크 공유 가이드](https://developers.kakao.com/docs/latest/ko/message/message-template)


# AssetHub - 프라이빗 자산 관리 서비스

## 프로젝트 개요

AssetHub는 개인의 자산을 체계적으로 관리하고 투자 성과를 분석할 수 있는 프라이빗 컨시어지 서비스입니다.

### 핵심 가치

- **간단한 자산 기록**: 복잡한 절차 없이 자산을 쉽고 간단하게 기록하여 관리
- **목표 달성 지원**: 목표 금액을 설정하고 필요한 금액을 모으기 위해 체계적으로 지원
- **통계 데이터 시각화**: 자산에 대한 통계 데이터를 그래프로 제공하여 한눈에 파악하고 분석

## 기술 스택

- **Frontend**: Next.js 16.0.1, React 19.2.0
- **Backend**: Firebase 12.5.0 (Authentication, Firestore)
- **스타일링**: Tailwind CSS 4
- **언어**: TypeScript
- **기타 라이브러리**:
  - `react-datepicker`: 날짜 입력
  - `lucide-react`: 아이콘
  - `@dnd-kit/core`, `@dnd-kit/sortable`: 드래그 앤 드롭

## 디자인 가이드라인

### 컬러 시스템

#### 무채색 베이스

- **주요 색상**: Slate 계열 (slate-50, slate-100, slate-200, slate-600, slate-700, slate-800, slate-900)
- **배경**: 주로 `bg-white`, `bg-slate-50`
- **텍스트**: `text-slate-900`, `text-slate-600`, `text-slate-500`
- **보더**: `border-slate-200`

#### 형광 컬러 포인트 (Accent Colors)

형광 컬러는 무채색 배경과 대비되는 포인트로 사용됩니다:

- **`#00FF9C`** (형광 민트/청록색): 월별 자산 성장 추이 그래프
- **`#0065F8`** (형광 파란색): 자산 구성 현황 - 예금/적금
- **`#00CAFF`** (형광 하늘색): 자산 구성 현황 - 투자
- **`#00FFDE`** (형광 청록색): 자산 구성 현황 - 기타

**사용 원칙**:

- 형광 컬러는 데이터 시각화(그래프, 차트)에만 사용
- 텍스트는 무채색(slate) 계열 사용 (가독성 확보)
- 성장률 등 강조 숫자는 형광 컬러보다 진한 톤 사용 (예: `#2ED896`)

### 타이포그래피

- **로고 폰트**: `YesMyungjo` - "Asset Hub" 로고에만 사용
- **본문 폰트**: `Suit` - 모든 텍스트에 사용
- **폰트 크기**:
  - 메인 타이틀: `text-4xl lg:text-5xl`
  - 섹션 제목: `text-lg`
  - 본문: `text-base`, `text-sm`

### 레이아웃 원칙

#### 로그인 페이지 (비로그인 상태)

- **2컬럼 레이아웃**: 왼쪽 서비스 소개 (50%), 오른쪽 로그인 폼 (50%)
- **왼쪽 영역 구성**:
  - 메인 타이틀: "당신의 자산을 위한 프라이빗 컨시어지 서비스"
  - 서브 타이틀: "모든 자산을 하나의 대시보드로 통합해 데이터 기반으로 분석하고, 목표에 맞는 전략을 제안합니다."
  - 그래프 2개 (월별 자산 성장 추이, 자산 구성 현황) - 나란히 배치
  - 주요 기능 3개 (간단한 자산 기록, 목표 달성 지원, 통계 데이터 시각화) - 한 줄에 배치
- **여백**: 섹션 간 충분한 여백 (`mb-12`)으로 여유로운 느낌 유지

#### 대시보드 (로그인 상태)

- **4섹션 그리드 레이아웃**:
  - 좌상단: 자산 입력 폼
  - 우상단: 월별 자산 추이
  - 좌하단: 월별 가용 계획
  - 우하단: 연도별 자산 추이

### UI/UX 원칙

#### 버튼 및 인터랙션

- **호버 효과**: `hover:shadow-md`, `hover:scale-[1.02]` 등 부드러운 트랜지션
- **커서**: 인터랙티브한 요소는 `cursor-pointer`
- **트랜지션**: `transition-all duration-200` 또는 `duration-300`

#### 그래프 및 차트

- **배경**: 배경 없이 직접 표시 (투명 배경)
- **호버 효과**: 미묘한 그림자와 확대 효과 (`hover:shadow-xl`, `hover:scale-[1.02]`)
- **형광 컬러**: 데이터 시각화에 형광 컬러 사용으로 시각적 포인트 제공

#### 폼 요소

- **입력 필드**: `h-10`, 일관된 높이 유지
- **날짜 입력**: `react-datepicker` 사용, 높이 조정 (`height: 2.5rem`)
- **패스워드**: 복사/붙여넣기/잘라내기 방지, 보기/숨기기 토글

#### 카드 및 섹션

- **배경**: `bg-white` 또는 `bg-slate-50`
- **보더**: `border border-slate-200`
- **그림자**: `shadow-sm` 또는 `shadow-lg`
- **여백**: 적절한 패딩으로 여유로운 느낌 (`p-4`, `p-6`)

### 데이터 구조

#### Firestore 구조

```
users/
  {userId}/
    - email: string
    - name?: string (선택)
    - gender?: string (선택)
    - birthDate?: string (선택)
    - assets: {
        depositSavings: AssetProduct[]
        trustISA: AssetProduct[]
        insurance: AssetProduct[]
        pension: AssetProduct[]
        investment: AssetProduct[]
      }
    - monthlyTrends: Record<string, Record<string, number>>
    - monthlyTrendsOrder: string[]
    - monthlyPlans: {
        income: number
        savings: MonthlyPlanItem[]
        cash: MonthlyPlanItem[]
      }
    - annualTrends: Record<string, Record<string, number>>
    - createdAt: string
    - updatedAt: string
```

#### AssetProduct 인터페이스

```typescript
interface AssetProduct {
  id: string;
  name: string;
  maturityDate?: string;
  amount: number;
  memo?: string;
}
```

#### MonthlyPlanItem 인터페이스

```typescript
interface MonthlyPlanItem {
  id: string;
  name: string;
  amount: number;
}
```

## 주요 기능

### 1. 자산 관리

- 예금/적금, 신탁/ISA, 보험/공제, 퇴직연금, 투자 카테고리별 관리
- 각 카테고리 내 여러 상품 추가/수정/삭제 가능
- 상품별 만기일, 예치금액, 메모 관리
- 드래그 앤 드롭으로 자산 순서 변경 (월별 자산 추이)

### 2. 월별 자산 추이

- 테이블 형태로 월별(1월~12월) 자산별 저축액 변화 입력
- 각 자산의 현재 금액과 만기일 표시
- 자산 순서 드래그 앤 드롭으로 재정렬 가능

### 3. 월별 가용 계획

- 월 수입 입력
- 저축 항목과 현금 항목 동적 추가/삭제
- 가용금액 자동 계산 (수입 - 총 저축)

### 4. 연도별 자산 추이

- 연도 선택 드롭다운 (2025년부터 현재 연도까지)
- 월별 총 자산 추이 입력 및 관리

### 5. 통계 및 시각화

- 현금 자산, 투자 자산, 총 자산 실시간 계산
- 월별 자산 성장 추이 그래프 (더미 데이터)
- 자산 구성 현황 도넛 차트 (더미 데이터)

## 개발 가이드

### 환경 변수 설정

`.env.local` 파일에 Firebase 설정 추가:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 실행 방법

```bash
npm install
npm run dev
```

### 디자인 작업 시 주의사항

1. **컬러 사용**: 무채색을 기본으로, 형광 컬러는 데이터 시각화에만 사용
2. **폰트**: 로고는 YesMyungjo, 나머지는 Suit 사용
3. **여백**: 충분한 여백을 두어 여유로운 느낌 유지
4. **일관성**: 버튼, 입력 필드, 카드 등의 스타일 일관성 유지
5. **반응형**: 모바일(`flex-col`), 데스크톱(`lg:flex-row`) 레이아웃 고려

### 향후 개선 방향

- [ ] 실제 데이터 기반 그래프 구현
- [ ] 자산 목표 설정 기능
- [ ] 알림 및 리마인더 기능
- [ ] 데이터 내보내기/가져오기
- [ ] 다크 모드 지원 (현재 미지원)

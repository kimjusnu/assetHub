/**
 * Firebase 설정 및 초기화 파일
 * 
 * 이 파일은 Firebase 서비스를 사용하기 위한 기본 설정을 담당합니다.
 * - Firebase Authentication: 사용자 인증 관리
 * - Firestore Database: 데이터베이스 연동
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase 설정 객체
 * .env.local 파일에서 환경 변수를 읽어와서 설정합니다.
 * NEXT_PUBLIC_ 접두사가 붙은 변수는 클라이언트 측에서 접근 가능합니다.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,                    // Firebase API 키
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,           // 인증 도메인 (예: project.firebaseapp.com)
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,              // 프로젝트 ID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,     // 스토리지 버킷 (파일 저장용)
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // 메시징 발신자 ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,                      // 앱 ID
};

/**
 * 환경 변수 검증
 * 필수 설정값이 없으면 애플리케이션이 시작되지 않도록 에러를 발생시킵니다.
 * 빌드 타임에는 에러를 던지지 않고, 런타임에만 검증합니다.
 */
const isServerSide = typeof window === 'undefined';
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// 환경 변수 검증 (빌드 타임이 아닐 때만)
if (!isBuildTime) {
  if (!firebaseConfig.apiKey) {
    const errorMsg = 'Firebase API Key가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.';
    if (isServerSide) {
      console.error('❌', errorMsg);
    } else {
      throw new Error(errorMsg);
    }
  }
  if (!firebaseConfig.projectId) {
    const errorMsg = 'Firebase Project ID가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.';
    if (isServerSide) {
      console.error('❌', errorMsg);
    } else {
      throw new Error(errorMsg);
    }
  }
}

/**
 * Firebase 앱 초기화
 * firebaseConfig를 사용하여 Firebase 앱 인스턴스를 생성합니다.
 * 빌드 타임에는 환경 변수가 없어도 더미 값으로 초기화하여 빌드가 성공하도록 합니다.
 */
let app;
try {
  // 빌드 타임에 환경 변수가 없으면 더미 값으로 초기화
  if (isBuildTime && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
    console.warn('⚠️ 빌드 타임: Firebase 환경 변수가 없어 더미 값으로 초기화합니다.');
    app = initializeApp({
      apiKey: 'dummy-key-for-build',
      authDomain: 'dummy.firebaseapp.com',
      projectId: 'dummy-project',
      storageBucket: 'dummy.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:dummy',
    }, 'dummy-app');
  } else {
    // 런타임에는 실제 환경 변수로 초기화
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase 환경 변수가 설정되지 않았습니다.');
    }
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  // 빌드 타임 에러는 무시하고 더미 앱으로 초기화
  if (isBuildTime) {
    console.warn('⚠️ Firebase 초기화 경고 (빌드 타임):', error);
    try {
      app = initializeApp({
        apiKey: 'dummy-key-for-build',
        authDomain: 'dummy.firebaseapp.com',
        projectId: 'dummy-project',
        storageBucket: 'dummy.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:dummy',
      }, 'dummy-app');
    } catch {
      // 이미 초기화된 경우 무시
      app = initializeApp({
        apiKey: 'dummy-key-for-build',
        authDomain: 'dummy.firebaseapp.com',
        projectId: 'dummy-project',
        storageBucket: 'dummy.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:dummy',
      });
    }
  } else {
    // 런타임 에러는 그대로 던짐
    console.error('❌ Firebase 초기화 실패:', error);
    throw error;
  }
}

/**
 * Firebase 서비스 인스턴스
 * 
 * auth: 사용자 인증 관리 (로그인, 로그아웃, 회원가입 등)
 * db: Firestore 데이터베이스 (데이터 저장 및 조회)
 * 
 * 이 인스턴스들은 다른 파일에서 import하여 사용할 수 있습니다.
 */
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;


/**
 * 인증 컨텍스트 (Authentication Context)
 *
 * 이 파일은 React Context API를 사용하여 전역 인증 상태를 관리합니다.
 * - 사용자 로그인/로그아웃 상태 관리
 * - 이메일/비밀번호 로그인 및 회원가입
 * - Google 로그인
 * - Firestore에 사용자 정보 자동 저장
 *
 * 사용 방법:
 *   const { user, signInWithEmail, logout } = useAuth();
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword, // 이메일/비밀번호 로그인
  createUserWithEmailAndPassword, // 이메일/비밀번호 회원가입
  signInWithPopup, // 소셜 로그인 (팝업 방식)
  GoogleAuthProvider, // Google 로그인 프로바이더
  signOut, // 로그아웃
  onAuthStateChanged, // 인증 상태 변경 감지
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * 인증 컨텍스트의 타입 정의
 * 이 인터페이스는 인증 관련 함수들과 상태를 정의합니다.
 */
interface AuthContextType {
  user: User | null; // 현재 로그인한 사용자 정보 (null이면 로그아웃 상태)
  loading: boolean; // 인증 상태 확인 중인지 여부
  signInWithEmail: (email: string, password: string) => Promise<void>; // 이메일 로그인
  signUpWithEmail: (email: string, password: string) => Promise<void>; // 이메일 회원가입
  signInWithGoogle: () => Promise<void>; // Google 로그인
  logout: () => Promise<void>; // 로그아웃
  updateUserProfile: (profile: {
    name?: string;
    gender?: string;
    birthDate?: string;
  }) => Promise<void>; // 사용자 프로필 업데이트
}

/**
 * 인증 컨텍스트 생성
 * 기본값은 undefined로 설정하여 AuthProvider 외부에서 사용하면 에러가 발생하도록 합니다.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider 컴포넌트
 *
 * 이 컴포넌트는 앱 전체를 감싸서 인증 상태를 제공합니다.
 * children으로 전달된 모든 컴포넌트에서 useAuth() 훅을 사용할 수 있습니다.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 현재 로그인한 사용자 정보를 저장하는 state
  const [user, setUser] = useState<User | null>(null);
  // 인증 상태 확인 중인지 여부를 저장하는 state (초기 로딩 시 true)
  const [loading, setLoading] = useState(true);

  /**
   * 인증 상태 변경 감지
   *
   * useEffect를 사용하여 컴포넌트가 마운트될 때 인증 상태 리스너를 등록합니다.
   * 사용자가 로그인하거나 로그아웃할 때마다 자동으로 실행됩니다.
   */
  useEffect(() => {
    // onAuthStateChanged는 Firebase의 인증 상태 변경을 감지하는 함수입니다.
    // 사용자가 로그인하거나 로그아웃할 때마다 콜백 함수가 실행됩니다.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // 사용자 정보 업데이트 (null이면 로그아웃 상태)
      setLoading(false); // 로딩 완료
    });

    // 컴포넌트가 언마운트될 때 리스너를 제거하여 메모리 누수를 방지합니다.
    return unsubscribe;
  }, []);

  /**
   * 이메일/비밀번호 로그인 함수
   *
   * @param email - 사용자 이메일 주소
   * @param password - 사용자 비밀번호
   */
  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // 로그인 성공 시 onAuthStateChanged가 자동으로 실행되어 user state가 업데이트됩니다.
  };

  /**
   * 이메일/비밀번호 회원가입 함수
   *
   * 1. Firebase Authentication에 새 사용자 계정을 생성합니다.
   * 2. Firestore 데이터베이스에 사용자 정보를 저장합니다.
   *
   * @param email - 사용자 이메일 주소
   * @param password - 사용자 비밀번호 (최소 6자 이상)
   */
  const signUpWithEmail = async (email: string, password: string) => {
    // 1단계: Firebase Authentication에 새 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2단계: Firestore에 사용자 정보 저장
    // doc(db, 'users', user.uid): 'users' 컬렉션에 사용자 UID를 문서 ID로 사용
    // setDoc: 문서 생성 또는 업데이트
    await setDoc(doc(db, "users", user.uid), {
      email: user.email, // 사용자 이메일
      createdAt: new Date().toISOString(), // 계정 생성 시간
      updatedAt: new Date().toISOString(), // 마지막 업데이트 시간
    });
    // 회원가입 성공 시 자동으로 로그인됩니다 (onAuthStateChanged가 실행됨)
  };

  /**
   * Google 로그인 함수
   *
   * 1. Google 로그인 팝업을 띄워 사용자가 Google 계정으로 로그인합니다.
   * 2. Firestore에 사용자 정보가 없으면 자동으로 생성합니다.
   *    (기존 사용자는 데이터가 그대로 유지됩니다)
   */
  const signInWithGoogle = async () => {
    // Google 로그인 프로바이더 생성
    const provider = new GoogleAuthProvider();

    // Google 로그인 팝업 표시
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Firestore에 사용자 정보가 있는지 확인
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    // 사용자 정보가 없으면 새로 생성 (첫 로그인인 경우)
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: user.email, // Google 이메일
        displayName: user.displayName, // Google 표시 이름
        photoURL: user.photoURL, // Google 프로필 사진 URL
        createdAt: new Date().toISOString(), // 계정 생성 시간
        updatedAt: new Date().toISOString(), // 마지막 업데이트 시간
      });
    }
    // 로그인 성공 시 onAuthStateChanged가 자동으로 실행됩니다.
  };

  /**
   * 로그아웃 함수
   *
   * Firebase에서 사용자를 로그아웃시키고,
   * onAuthStateChanged가 자동으로 실행되어 user state가 null로 업데이트됩니다.
   */
  const logout = async () => {
    await signOut(auth);
    // 로그아웃 후 user state가 null로 변경되어 로그인 화면이 표시됩니다.
  };

  /**
   * 사용자 프로필 업데이트 함수
   *
   * Firestore에 사용자의 추가 정보(이름, 성별, 생년월일)를 저장합니다.
   *
   * @param profile - 업데이트할 사용자 프로필 정보
   */
  const updateUserProfile = async (profile: {
    name?: string;
    gender?: string;
    birthDate?: string;
  }) => {
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    // 기존 사용자 정보 가져오기
    const existingData = userDoc.exists() ? userDoc.data() : {};

    // 프로필 정보 업데이트
    await setDoc(
      userDocRef,
      {
        ...existingData,
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ); // merge: true로 기존 데이터와 병합
  };

  /**
   * Context Provider 반환
   * value에 제공할 값들을 전달합니다.
   */
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth 훅
 *
 * 이 훅을 사용하면 AuthProvider 내부의 컴포넌트에서 인증 관련 기능을 사용할 수 있습니다.
 *
 * 사용 예시:
 *   const { user, signInWithEmail, logout } = useAuth();
 *
 * @throws {Error} AuthProvider 외부에서 사용하면 에러 발생
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * 로그인/회원가입 폼 컴포넌트
 * 
 * 이 컴포넌트는 사용자 로그인과 회원가입을 처리하는 UI를 제공합니다.
 * 기능:
 * - 이메일/비밀번호 로그인
 * - 이메일/비밀번호 회원가입
 * - Google 로그인
 * - 로그인/회원가입 모드 전환
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function LoginForm() {
  // 로그인 모드인지 회원가입 모드인지 관리하는 state
  const [isSignUp, setIsSignUp] = useState(false);
  
  // 입력 필드의 값들을 관리하는 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 에러 메시지를 저장하는 state
  const [error, setError] = useState('');
  
  // useAuth 훅을 사용하여 인증 관련 함수들을 가져옵니다
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  /**
   * 폼 제출 핸들러
   * 
   * 이메일/비밀번호 로그인 또는 회원가입을 처리합니다.
   * isSignUp 상태에 따라 로그인 또는 회원가입을 수행합니다.
   * 
   * @param e - 폼 제출 이벤트
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // 기본 폼 제출 동작 방지 (페이지 새로고침 방지)
    setError('');        // 이전 에러 메시지 초기화

    try {
      if (isSignUp) {
        // 회원가입 모드인 경우
        await signUpWithEmail(email, password);
        // 성공 시 자동으로 로그인되어 대시보드로 이동합니다.
      } else {
        // 로그인 모드인 경우
        await signInWithEmail(email, password);
        // 성공 시 대시보드로 이동합니다.
      }
    } catch (err: any) {
      // 에러 발생 시 에러 메시지를 표시합니다.
      // Firebase는 자동으로 한국어 에러 메시지를 제공합니다.
      setError(err.message || '로그인에 실패했습니다.');
    }
  };

  /**
   * Google 로그인 핸들러
   * 
   * Google 로그인 팝업을 띄워서 사용자가 Google 계정으로 로그인할 수 있게 합니다.
   */
  const handleGoogleSignIn = async () => {
    setError('');  // 이전 에러 메시지 초기화
    
    try {
      await signInWithGoogle();
      // 성공 시 자동으로 로그인되어 대시보드로 이동합니다.
    } catch (err: any) {
      // 에러 발생 시 에러 메시지를 표시합니다.
      setError(err.message || 'Google 로그인에 실패했습니다.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      {/* 제목: 로그인 또는 회원가입 모드에 따라 변경 */}
      <h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
        {isSignUp ? '회원가입' : '로그인'}
      </h2>

      {/* 이메일/비밀번호 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이메일 입력 필드 */}
        <div>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}  // 입력값이 변경될 때마다 email state 업데이트
            required  // 필수 입력 필드
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {/* 비밀번호 입력 필드 */}
        <div>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}  // 입력값이 변경될 때마다 password state 업데이트
            required  // 필수 입력 필드
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {/* 에러 메시지 표시 (에러가 있을 때만 표시) */}
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        {/* 제출 버튼: 로그인 또는 회원가입 모드에 따라 텍스트 변경 */}
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {isSignUp ? '회원가입' : '로그인'}
        </button>
      </form>

      {/* 구분선 및 Google 로그인 버튼 */}
      <div className="mt-4">
        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500">
              또는
            </span>
          </div>
        </div>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleSignIn}
          className="mt-4 w-full py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          {/* Google 로고 SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        </button>
      </div>

      {/* 로그인/회원가입 모드 전환 버튼 */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);  // 모드 전환 (로그인 ↔ 회원가입)
            setError('');            // 에러 메시지 초기화
          }}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {isSignUp
            ? '이미 계정이 있으신가요? 로그인'
            : '계정이 없으신가요? 회원가입'}
        </button>
      </div>
    </div>
  );
}


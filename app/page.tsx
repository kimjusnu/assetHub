/**
 * 메인 페이지 컴포넌트
 *
 * 이 컴포넌트는 앱의 진입점입니다.
 * - 로그인하지 않은 사용자: 로그인 화면 표시
 * - 로그인한 사용자: 자산 관리 대시보드 표시
 */

"use client";

import { useAuth } from "@/lib/auth-context";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  // useAuth 훅을 사용하여 현재 로그인 상태와 로그아웃 함수를 가져옵니다
  const { user, loading, logout } = useAuth();

  /**
   * 로딩 중일 때 표시할 UI
   *
   * 앱이 처음 시작될 때 Firebase에서 인증 상태를 확인하는 동안
   * 로딩 화면을 표시합니다.
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  /**
   * 로그인하지 않은 사용자용 UI
   *
   * user가 null이면 로그인하지 않은 상태이므로
   * 로그인 폼을 표시합니다.
   */
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <LoginForm />
      </div>
    );
  }

  /**
   * 로그인한 사용자용 UI (대시보드)
   *
   * user가 있으면 로그인한 상태이므로
   * 자산 관리 대시보드를 표시합니다.
   */
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더: 제목, 사용자 이메일, 로그아웃 버튼 */}
        <header className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            {/* 앱 제목 */}
            <h1 className="text-2xl font-bold text-black dark:text-white">
              자산 포트폴리오
            </h1>

            {/* 사용자 정보 및 로그아웃 버튼 */}
            <div className="flex items-center gap-4">
              {/* 현재 로그인한 사용자의 이메일 표시 */}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </span>

              {/* 로그아웃 버튼 */}
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            자산 관리 대시보드
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            여기에 자산 관리 기능을 추가하세요.
          </p>
        </main>
      </div>
    </div>
  );
}
